import { NextApiRequest, NextApiResponse } from "next";
import { validateTelegramWebApp } from "../../../../../lib/validateTelegram";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";
import { postgresClient } from "../../../../../lib/postgresClient";
import { BOT_TOKEN, isLocal } from "../../../../../utils/static";

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

  try {
    if (req.method === "GET") {
      // Get income detail
      if (isLocal) {
        const incomeResult = await postgresClient.query(
          `SELECT i.*, c.id as category_id, c.name as category_name
           FROM incomes i
           LEFT JOIN all_categories c ON i.category_id = c.id
           WHERE i.id = $1 AND i.chat_id = $2`,
          [id, telegram_id]
        );

        if (incomeResult.rows.length === 0) {
          return res.status(404).json({ error: "Income not found" });
        }

        const income = incomeResult.rows[0];
        const formattedIncome = {
          ...income,
          category: income.category_id
            ? {
                id: income.category_id,
                name: income.category_name,
                emoji: income.category_emoji,
              }
            : null,
        };

        return res.status(200).json({ income: formattedIncome });
      } else {
        if (!supabaseAdmin) {
          return res
            .status(500)
            .json({ error: "Supabase client not configured" });
        }

        const { data: income, error } = await supabaseAdmin
          .from("incomes")
          .select(
            `
            *,
            category:all_categories(*)
          `
          )
          .eq("id", id)
          .eq("chat_id", telegram_id)
          .single();

        if (error) {
          console.error("Error fetching income:", error);
          return res.status(500).json({ error: "Failed to fetch income" });
        }

        if (!income) {
          return res.status(404).json({ error: "Income not found" });
        }

        return res.status(200).json({ income });
      }
    } else if (req.method === "PUT") {
      // Update income
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
        // First check if the income exists and belongs to the user
        const existingIncome = await postgresClient.query(
          "SELECT id FROM incomes WHERE id = $1 AND chat_id = $2",
          [id, telegram_id]
        );

        if (existingIncome.rows.length === 0) {
          return res.status(404).json({ error: "Income not found" });
        }

        // Update the income
        await postgresClient.query(
          `UPDATE incomes 
           SET description = $1, amount = $2, category_id = $3, is_income = $4, updated_at = NOW()
           WHERE id = $5 AND chat_id = $6`,
          [description, amount, category_id, is_income, id, telegram_id]
        );

        // Get the updated income
        const updatedIncomeResult = await postgresClient.query(
          `SELECT i.*, c.id as category_id, c.name as category_name
           FROM incomes i
           LEFT JOIN all_categories c ON i.category_id = c.id
           WHERE i.id = $1 AND i.chat_id = $2`,
          [id, telegram_id]
        );

        const updatedIncome = updatedIncomeResult.rows[0];
        const formattedIncome = {
          ...updatedIncome,
          category: updatedIncome.category_id
            ? {
                id: updatedIncome.category_id,
                name: updatedIncome.category_name,
                emoji: updatedIncome.category_emoji,
              }
            : null,
        };

        return res.status(200).json({ income: formattedIncome });
      } else {
        if (!supabaseAdmin) {
          return res
            .status(500)
            .json({ error: "Supabase client not configured" });
        }

        // First check if the income exists and belongs to the user
        const { data: existingIncome, error: fetchError } = await supabaseAdmin
          .from("incomes")
          .select("id")
          .eq("id", id)
          .eq("chat_id", telegram_id)
          .single();

        if (fetchError || !existingIncome) {
          return res.status(404).json({ error: "Income not found" });
        }

        // Update the expense
        const { data: updatedIncome, error: updateError } = await supabaseAdmin
          .from("incomes")
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
            category:all_categories(*)
          `
          )
          .single();

        if (updateError) {
          console.error("Error updating income:", updateError);
          return res.status(500).json({ error: "Failed to update income" });
        }

        return res.status(200).json({ income: updatedIncome });
      }
    } else if (req.method === "DELETE") {
      // Delete income
      if (isLocal) {
        await postgresClient.query(
          "DELETE FROM incomes WHERE id = $1 AND chat_id = $2",
          [id, telegram_id]
        );
      } else {
        if (!supabaseAdmin) {
          return res
            .status(500)
            .json({ error: "Supabase client not configured" });
        }

        const { error } = await supabaseAdmin
          .from("incomes")
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
    console.error("Error in income API:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
