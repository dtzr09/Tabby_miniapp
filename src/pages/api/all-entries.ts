import { NextApiRequest, NextApiResponse } from "next";
import { validateTelegramWebApp } from "../../../lib/validateTelegram";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { postgresClient } from "../../../lib/postgresClient";
import { BOT_TOKEN, isLocal } from "../../../utils/utils";
import { ExpenseShareWithUser } from "../../../utils/types";

interface Category {
  id: number;
  name: string;
}

interface ExpenseShare {
  user_id: number;
  share_amount: number;
  user_name: string;
  username: string;
  name: string;
}

interface Expense {
  id: number;
  amount: number;
  description: string;
  date: string;
  created_at: string;
  updated_at: string;
  category_id: number;
  user_id: number;
  chat_id: string;
  category: Category | null;
  shares: ExpenseShare[];
}

interface Income {
  id: number;
  amount: number;
  description: string;
  date: string;
  created_at: string;
  updated_at: string;
  category_id: number;
  user_id: number;
  chat_id: string;
  category: Category | null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { telegram_id, initData, chat_id } = req.query;
  const isValid = await validateTelegramWebApp(initData as string, BOT_TOKEN);

  if (!isValid) {
    return res.status(400).json({ error: "Invalid Telegram request" });
  }

  const value = chat_id ? chat_id : telegram_id;

  try {
    if (isLocal) {
      // Single UNION ALL query to get both expenses and incomes with all relationships
      const result = await postgresClient.query(
        `SELECT 
          e.id, e.amount, e.description, e.date, e.created_at, e.updated_at, 
          e.category_id, e.payer_id as user_id, e.chat_id,
          'expense' as entry_type,
          c.id as category_id_ref,
          c.name as category_name,
          es.user_id as share_user_id,
          es.share_amount,
          u.name as share_user_name,
          u.username as share_username
        FROM expenses e
        LEFT JOIN all_categories c ON e.category_id = c.id
        LEFT JOIN expense_shares es ON e.id = es.expense_id
        LEFT JOIN users u ON es.user_id = u.id
        WHERE e.chat_id = $1
        
        UNION ALL
        
        SELECT 
          i.id, i.amount, i.description, i.date, i.created_at, i.updated_at,
          i.category_id, i.user_id, i.chat_id,
          'income' as entry_type,
          c.id as category_id_ref,
          c.name as category_name,
          null as share_user_id,
          null as share_amount,
          null as share_user_name,
          null as share_username
        FROM incomes i
        LEFT JOIN all_categories c ON i.category_id = c.id
        WHERE i.chat_id = $1
        
        ORDER BY date DESC, created_at DESC`,
        [value]
      );

      // Process the unified result - separate expenses and incomes
      const expensesMap = new Map<number, Expense>();
      const incomes: Income[] = [];

      result.rows.forEach((row) => {
        if (row.entry_type === 'expense') {
          const expenseId = row.id;

          if (!expensesMap.has(expenseId)) {
            expensesMap.set(expenseId, {
              id: row.id,
              amount: row.amount,
              description: row.description,
              date: row.date,
              created_at: row.created_at,
              updated_at: row.updated_at,
              category_id: row.category_id,
              user_id: row.user_id,
              chat_id: row.chat_id,
              category: row.category_id_ref
                ? {
                    id: row.category_id_ref,
                    name: row.category_name,
                  }
                : null,
              shares: [],
            });
          }

          // Add share if it exists
          if (row.share_user_id && row.share_amount) {
            expensesMap.get(expenseId)?.shares.push({
              user_id: row.share_user_id,
              share_amount: row.share_amount,
              user_name: row.share_user_name || `User ${row.share_user_id}`,
              username: row.share_username || "",
              name: row.share_user_name || `User ${row.share_user_id}`, // For backward compatibility
            });
          }
        } else if (row.entry_type === 'income') {
          incomes.push({
            id: row.id,
            amount: row.amount,
            description: row.description,
            date: row.date,
            created_at: row.created_at,
            updated_at: row.updated_at,
            category_id: row.category_id,
            user_id: row.user_id,
            chat_id: row.chat_id,
            category: row.category_id_ref
              ? {
                  id: row.category_id_ref,
                  name: row.category_name,
                }
              : null,
          });
        }
      });

      const expenses = Array.from(expensesMap.values());

      // Return expenses and incomes only (budgets handled separately)
      return res.status(200).json({
        expenses,
        income: incomes,
      });

    } else {
      if (!supabaseAdmin) {
        return res.status(500).json({ error: "Supabase client not configured" });
      }

      // For Supabase, we still need separate queries due to different table structures
      // But we can run them in parallel for better performance
      const [expensesResult, incomesResult] = await Promise.all([
        // Fetch expenses with shares
        supabaseAdmin
          .from("expenses")
          .select(`
            *,
            category:all_categories!category_id(*),
            shares:expense_shares(user_id, share_amount, user:users!inner(name, username))
          `)
          .eq("chat_id", value)
          .order("date", { ascending: false }),

        // Fetch incomes
        supabaseAdmin
          .from("incomes")
          .select(`
            *,
            category:all_categories!category_id(*)
          `)
          .eq("chat_id", value)
          .order("date", { ascending: false }),
      ]);

      if (expensesResult.error) {
        console.error("Error fetching expenses:", expensesResult.error);
        return res.status(500).json({ error: "Failed to fetch expenses" });
      }

      if (incomesResult.error) {
        console.error("Error fetching incomes:", incomesResult.error);
        return res.status(500).json({ error: "Failed to fetch incomes" });
      }

      // Process expenses with shares
      const processedExpenses: Expense[] = (expensesResult.data || []).map((entry) => ({
        ...entry,
        shares:
          entry.shares?.map((share: ExpenseShareWithUser) => ({
            user_id: share.user_id,
            share_amount: share.share_amount,
            user_name: share.user?.name || `User ${share.user_id}`,
            username: share.user?.username || "",
            name: share.user?.name || `User ${share.user_id}`,
          })) || [],
      }));

      // Return expenses and incomes only (budgets handled separately)
      return res.status(200).json({
        expenses: processedExpenses,
        income: incomesResult.data || [],
      });
    }
  } catch (error) {
    console.error("Error in all-entries API:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}