import { NextApiRequest, NextApiResponse } from "next";
import { validateTelegramWebApp } from "../../../../../lib/validateTelegram";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";
import { postgresClient } from "../../../../../lib/postgresClient";
import { BOT_TOKEN } from "../../../../../utils/utils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Missing expense ID" });
  }

  const { telegram_id, initData } = req.method === "GET" ? req.query : req.body;

  if (!telegram_id || !initData) {
    return res.status(400).json({ error: "Missing telegram_id or initData" });
  }

  const isValid = await validateTelegramWebApp(initData as string, BOT_TOKEN);

  if (!isValid) {
    return res.status(400).json({ error: "Invalid Telegram request" });
  }

  // Use appropriate client based on environment
  const isLocal =
    process.env.NODE_ENV === "development" &&
    process.env.DATABASE_URL?.includes("postgresql://");

  try {
    if (req.method === "GET") {
      // Get expense detail
      if (isLocal) {
        const expenseResult = await postgresClient.query(
          `SELECT e.*, c.id as category_id, c.name as category_name
           FROM expenses e
           LEFT JOIN categories c ON e.category_id = c.id
           WHERE e.id = $1 AND e.chat_id = $2`,
          [id, telegram_id]
        );

        if (expenseResult.rows.length === 0) {
          return res.status(404).json({ error: "Expense not found" });
        }

        const expense = expenseResult.rows[0];
        const formattedExpense = {
          ...expense,
          category: expense.category_id
            ? {
                id: expense.category_id,
                name: expense.category_name,
                emoji: expense.category_emoji,
              }
            : null,
        };

        return res.status(200).json({ expense: formattedExpense });
      } else {
        if (!supabaseAdmin) {
          return res
            .status(500)
            .json({ error: "Supabase client not configured" });
        }

        const { data: expense, error } = await supabaseAdmin
          .from("expenses")
          .select(
            `
            *,
            category:categories(*)
          `
          )
          .eq("id", id)
          .eq("chat_id", telegram_id)
          .single();

        if (error) {
          console.error("Error fetching expense:", error);
          return res.status(500).json({ error: "Failed to fetch expense" });
        }

        if (!expense) {
          return res.status(404).json({ error: "Expense not found" });
        }

        return res.status(200).json({ expense });
      }
    } else if (req.method === "PUT") {
      // Update expense
      const { description, amount, category_id, is_income } = req.body;

      if (
        !description ||
        amount === undefined ||
        category_id === undefined ||
        is_income === undefined
      ) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (isLocal) {
        // First check if the expense exists and belongs to the user
        const existingExpense = await postgresClient.query(
          "SELECT id FROM expenses WHERE id = $1 AND chat_id = $2",
          [id, telegram_id]
        );

        if (existingExpense.rows.length === 0) {
          return res.status(404).json({ error: "Expense not found" });
        }

        // Update the expense
        await postgresClient.query(
          `UPDATE expenses 
           SET description = $1, amount = $2, category_id = $3, is_income = $4, updated_at = NOW()
           WHERE id = $5 AND chat_id = $6`,
          [description, amount, category_id, is_income, id, telegram_id]
        );

        // Get the updated expense
        const updatedExpenseResult = await postgresClient.query(
          `SELECT e.*, c.id as category_id, c.name as category_name
           FROM expenses e
           LEFT JOIN categories c ON e.category_id = c.id
           WHERE e.id = $1 AND e.chat_id = $2`,
          [id, telegram_id]
        );

        const updatedExpense = updatedExpenseResult.rows[0];
        const formattedExpense = {
          ...updatedExpense,
          category: updatedExpense.category_id
            ? {
                id: updatedExpense.category_id,
                name: updatedExpense.category_name,
                emoji: updatedExpense.category_emoji,
              }
            : null,
        };

        return res.status(200).json({ expense: formattedExpense });
      } else {
        if (!supabaseAdmin) {
          return res
            .status(500)
            .json({ error: "Supabase client not configured" });
        }

        // First check if the expense exists and belongs to the user
        const { data: existingExpense, error: fetchError } = await supabaseAdmin
          .from("expenses")
          .select("id")
          .eq("id", id)
          .eq("chat_id", telegram_id)
          .single();

        if (fetchError || !existingExpense) {
          return res.status(404).json({ error: "Expense not found" });
        }

        // Update the expense
        const { data: updatedExpense, error: updateError } = await supabaseAdmin
          .from("expenses")
          .update({
            description,
            amount,
            category_id,
            is_income,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .eq("chat_id", telegram_id)
          .select(
            `
            *,
            category:categories(*)
          `
          )
          .single();

        if (updateError) {
          console.error("Error updating expense:", updateError);
          return res.status(500).json({ error: "Failed to update expense" });
        }

        return res.status(200).json({ expense: updatedExpense });
      }
    } else if (req.method === "DELETE") {
      // Delete expense
      if (isLocal) {
        await postgresClient.query(
          "DELETE FROM expenses WHERE id = $1 AND chat_id = $2",
          [id, telegram_id]
        );
      } else {
        if (!supabaseAdmin) {
          return res
            .status(500)
            .json({ error: "Supabase client not configured" });
        }

        const { error } = await supabaseAdmin
          .from("expenses")
          .delete()
          .eq("id", id)
          .eq("chat_id", telegram_id);

        if (error) {
          return res.status(500).json({ error: error.message });
        }
      }

      return res.status(200).json({ success: true });
    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error in expense API:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
