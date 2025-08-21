import { NextApiRequest, NextApiResponse } from "next";
import { validateTelegramWebApp } from "../../../../lib/validateTelegram";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { postgresClient } from "../../../../lib/postgresClient";
import { BOT_TOKEN, isLocal } from "../../../../utils/utils";
import { Expense, ExpenseShareWithUser } from "../../../../utils/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { telegram_id, initData, isIncome, chat_id } = req.query;
  const isValid = await validateTelegramWebApp(initData as string, BOT_TOKEN);

  if (!isValid) {
    return res.status(400).json({ error: "Invalid Telegram request" });
  }

  // Handle personal entries
  const isIncomeBoolean = isIncome === "true";
  const tableName = isIncomeBoolean ? "incomes" : "expenses";
  const value = chat_id ? chat_id : telegram_id;

  try {
    if (isLocal) {
      let entries;

      if (chat_id && !isIncomeBoolean) {
        // For group expenses, include expense shares with user information
        const result = await postgresClient.query(
          `SELECT e.*, c.id as category_id, c.name as category_name,
                  es.user_id as share_user_id, es.share_amount,
                  u.name, u.username
           FROM ${tableName} e
           LEFT JOIN all_categories c ON e.category_id = c.id
           LEFT JOIN expense_shares es ON e.id = es.expense_id
           LEFT JOIN users u ON es.user_id = u.id
           WHERE e.chat_id = $1
           ORDER BY e.date DESC, e.id`,
          [value]
        );

        // Group expenses by id and collect shares
        const expensesMap = new Map();

        result.rows.forEach((row) => {
          const expenseId = row.id;

          if (!expensesMap.has(expenseId)) {
            expensesMap.set(expenseId, {
              ...row,
              category: row.category_id
                ? {
                    id: row.category_id,
                    name: row.category_name,
                  }
                : null,
              shares: [],
            });
          }

          // Add share if it exists
          if (row.share_user_id && row.share_amount) {
            expensesMap.get(expenseId).shares.push({
              user_id: row.share_user_id,
              share_amount: row.share_amount,
              user_name: row.name || `User ${row.share_user_id}`,
              username: row.username || "",
              name: row.name || `User ${row.share_user_id}`, // For backward compatibility
            });
          }
        });

        entries = Array.from(expensesMap.values());
      } else {
        // For personal expenses or incomes, use original query
        const result = await postgresClient.query(
          `SELECT e.*, c.id as category_id, c.name as category_name
           FROM ${tableName} e
           LEFT JOIN all_categories c ON e.category_id = c.id
           WHERE e.chat_id = $1
           ORDER BY e.date DESC`,
          [value]
        );

        entries = result.rows.map((entry) => ({
          ...entry,
          category: entry.category_id
            ? {
                id: entry.category_id,
                name: entry.category_name,
              }
            : null,
        }));
      }

      return res.status(200).json(entries);
    } else {
      if (!supabaseAdmin) {
        return res
          .status(500)
          .json({ error: "Supabase client not configured" });
      }

      let selectQuery = `
        *,
        category:all_categories!category_id(*)
      `;

      // For group expenses, include expense shares with user information
      if (chat_id && !isIncomeBoolean) {
        selectQuery = `
          *,
          category:all_categories!category_id(*),
          shares:expense_shares(user_id, share_amount, user:users!inner(name, username))
        `;
      }

      const { data: entries, error } = await supabaseAdmin
        .from(tableName)
        .select(selectQuery)
        .eq("chat_id", value)
        .order("date", { ascending: false });

      if (error) {
        console.error(`Error fetching ${tableName}:`, error);
        return res.status(500).json({ error: `Failed to fetch ${tableName}` });
      }

      // Process Supabase data to match SQL structure
      if (chat_id && !isIncomeBoolean && entries) {
        const processedEntries = entries.map((entry: Expense) => ({
          ...entry,
          shares:
             
            entry.shares?.map((share: ExpenseShareWithUser) => ({
              user_id: share.user_id,
              share_amount: share.share_amount,
              user_name: share.user?.name || `User ${share.user_id}`,
              username: share.user?.username || "",
              name: share.user?.name || `User ${share.user_id}`, // For backward compatibility
            })) || [],
        }));
        return res.status(200).json(processedEntries || []);
      }

      return res.status(200).json(entries || []);
    }
  } catch (error) {
    console.error("Error in entries API:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
