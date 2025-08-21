import { NextApiRequest, NextApiResponse } from "next";
import { validateTelegramWebApp } from "../../../../../lib/validateTelegram";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";
import { postgresClient } from "../../../../../lib/postgresClient";
import { BOT_TOKEN, isLocal } from "../../../../../utils/utils";
import { ExpenseShareWithUser } from "../../../../../utils/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  const { chat_id, initData, isIncome } =
    req.method === "GET" ? req.query : req.body;

  if (!id) {
    return res.status(400).json({ error: "Missing entry ID" });
  }

  if (!chat_id || !initData) {
    return res.status(400).json({ error: "Missing chat_id or initData" });
  }

  const isValid = await validateTelegramWebApp(initData as string, BOT_TOKEN);

  if (!isValid) {
    return res.status(400).json({ error: "Invalid Telegram request" });
  }

  // Convert isIncome to boolean
  const isIncomeBoolean = isIncome === "true" || isIncome === true;
  const tableName = isIncomeBoolean ? "incomes" : "expenses";

  try {
    if (req.method === "GET") {
      if (isLocal) {
        // For group expenses, include expense shares
        if (!isIncomeBoolean) {
          const result = await postgresClient.query(
            `SELECT e.*, c.id as category_id, c.name as category_name,
                    es.user_id as share_user_id, es.share_amount,
                    u.name, u.username
             FROM expenses e
             LEFT JOIN all_categories c ON e.category_id = c.id
             LEFT JOIN expense_shares es ON e.id = es.expense_id
             LEFT JOIN users u ON es.user_id = u.id
             WHERE e.id = $1 AND e.chat_id = $2
             ORDER BY es.user_id`,
            [id, chat_id]
          );

          if (result.rows.length === 0) {
            return res.status(404).json({ error: "Entry not found" });
          }

          // Group shares by expense and format the response
          const expenseData = result.rows[0];
          const shares = result.rows
            .filter((row) => row.share_user_id && row.share_amount)
            .map((row) => ({
              user_id: row.share_user_id,
              share_amount: row.share_amount,
              name: row.name || `User ${row.share_user_id}`,
              username: row.username,
            }));

          const formattedEntry = {
            ...expenseData,
            is_income: isIncomeBoolean,
            category: expenseData.category_id
              ? {
                  id: expenseData.category_id,
                  name: expenseData.category_name,
                }
              : null,
            shares: shares.length > 0 ? shares : undefined,
          };

          return res.status(200).json(formattedEntry);
        } else {
          // For income, use the original query (no shares needed)
          const result = await postgresClient.query(
            `SELECT i.*, c.id as category_id, c.name as category_name,
                    u.name, u.username
             FROM incomes i
             LEFT JOIN all_categories c ON i.category_id = c.id
             LEFT JOIN users u ON i.user_id = u.id
             WHERE i.id = $1 AND i.chat_id = $2`,
            [id, chat_id]
          );

          if (result.rows.length === 0) {
            return res.status(404).json({ error: "Entry not found" });
          }

          const entry = result.rows[0];
          const formattedEntry = {
            ...entry,
            is_income: isIncomeBoolean,
            category: entry.category_id
              ? {
                  id: entry.category_id,
                  name: entry.category_name,
                }
              : null,
          };

          return res.status(200).json(formattedEntry);
        }
      } else {
        if (!supabaseAdmin) {
          return res
            .status(500)
            .json({ error: "Supabase client not configured" });
        }

        // For group expenses, include expense shares
        if (!isIncomeBoolean) {
          const { data: entry, error } = await supabaseAdmin
            .from("expenses")
            .select(
              `
              *,
              category:all_categories!category_id(*),
              shares:expense_shares(user_id, share_amount, user:users!inner(name, username))
            `
            )
            .eq("id", id)
            .eq("chat_id", chat_id)
            .single();

          if (error) {
            console.error(`Error fetching expenses:`, error);
            return res.status(500).json({ error: `Failed to fetch expenses` });
          }

          if (!entry) {
            return res.status(404).json({ error: "Entry not found" });
          }

          // Add is_income field for consistency
          const formattedEntry = {
            ...entry,
            shares:
              entry.shares?.map((share: ExpenseShareWithUser) => ({
                user_id: share.user_id,
                share_amount: share.share_amount,
                name: share.user?.name || `User ${share.user_id}`,
                username: share.user?.username || "",
              })) || [],
            is_income: isIncomeBoolean,
          };

          return res.status(200).json(formattedEntry);
        } else {
          // For income, use the original query (no shares needed)
          const { data: entry, error } = await supabaseAdmin
            .from("incomes")
            .select(
              `
              *,
              category:all_categories!category_id(*),
              user:users!inner(name, username)
            `
            )
            .eq("id", id)
            .eq("chat_id", chat_id)
            .single();

          if (error) {
            console.error(`Error fetching incomes:`, error);
            return res.status(500).json({ error: `Failed to fetch incomes` });
          }

          if (!entry) {
            return res.status(404).json({ error: "Entry not found" });
          }

          // Add is_income field for consistency
          const formattedEntry = {
            ...entry,
            is_income: isIncomeBoolean,
          };

          return res.status(200).json(formattedEntry);
        }
      }
    } else if (req.method === "PUT") {
      const { description, amount, category_id } = req.body;

      if (!description || amount === undefined || category_id === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (isLocal) {
        try {
          // First check if the entry exists and belongs to the user
          const existingEntry = await postgresClient.query(
            `SELECT id FROM ${tableName} WHERE id = $1 AND chat_id = $2`,
            [id, chat_id]
          );

          if (existingEntry.rows.length === 0) {
            return res.status(404).json({ error: "Entry not found" });
          }

          // Update the entry - only include is_income field for expenses table
          const updateFields = isIncomeBoolean
            ? "description = $1, amount = $2, category_id = $3, updated_at = NOW()"
            : "description = $1, amount = $2, category_id = $3, is_income = $4, updated_at = NOW()";
          const updateValues = isIncomeBoolean
            ? [description, amount, category_id, id, chat_id]
            : [description, amount, category_id, isIncomeBoolean, id, chat_id];

          await postgresClient.query(
            `UPDATE ${tableName}
             SET ${updateFields}
             WHERE id = ${isIncomeBoolean ? "$4" : "$5"} AND chat_id = ${
              isIncomeBoolean ? "$5" : "$6"
            }`,
            updateValues
          );

          // Return minimal success response since we're using optimistic updates
          return res.status(200).json({ success: true });
        } catch (error) {
          console.error("Database error:", error);
          return res.status(500).json({ error: "Database error occurred" });
        }
      } else {
        // Use Supabase for production
        if (!supabaseAdmin) {
          return res
            .status(500)
            .json({ error: "Supabase client not configured" });
        }

        try {
          // Check if the entry exists and belongs to the user
          const { data: existingEntry, error: checkError } = await supabaseAdmin
            .from(tableName)
            .select("id")
            .eq("id", id)
            .eq("chat_id", chat_id)
            .single();

          if (checkError || !existingEntry) {
            return res.status(404).json({ error: "Entry not found" });
          }

          // Update the entry
          const { error: updateError } = await supabaseAdmin
            .from(tableName)
            .update({
              description,
              amount,
              category_id,
              ...(isIncomeBoolean ? {} : { is_income: isIncomeBoolean }), // Only include is_income for expenses table
              updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .eq("chat_id", chat_id);

          if (updateError) {
            console.error("Supabase update error:", updateError);
            return res.status(500).json({ error: "Failed to update entry" });
          }

          // Return minimal success response since we're using optimistic updates
          return res.status(200).json({ success: true });
        } catch (error) {
          console.error("Supabase error:", error);
          return res.status(500).json({ error: "Database error occurred" });
        }
      }
    } else if (req.method === "DELETE") {
      if (isLocal) {
        await postgresClient.query(
          `DELETE FROM ${tableName} WHERE id = $1 AND chat_id = $2`,
          [id, chat_id]
        );
      } else {
        if (!supabaseAdmin) {
          return res
            .status(500)
            .json({ error: "Supabase client not configured" });
        }

        const { error } = await supabaseAdmin
          .from(tableName)
          .delete()
          .eq("id", id)
          .eq("chat_id", chat_id);

        if (error) {
          return res.status(500).json({ error: error.message });
        }
      }

      return res.status(200).json({ success: true });
    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error in entries API:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
