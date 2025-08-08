import { NextApiRequest, NextApiResponse } from "next";
import { validateTelegramWebApp } from "../../../../../lib/validateTelegram";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";
import { postgresClient } from "../../../../../lib/postgresClient";
import { BOT_TOKEN, isLocal } from "../../../../../utils/utils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  const { telegram_id, initData, isIncome } =
    req.method === "GET" ? req.query : req.body;

  if (!id) {
    return res.status(400).json({ error: "Missing entry ID" });
  }

  if (!telegram_id || !initData) {
    return res.status(400).json({ error: "Missing telegram_id or initData" });
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
        const result = await postgresClient.query(
          `SELECT e.*, c.id as category_id, c.name as category_name
           FROM ${tableName} e
           LEFT JOIN all_categories c ON e.category_id = c.id
           WHERE e.id = $1 AND e.chat_id = $2`,
          [id, telegram_id]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ error: "Entry not found" });
        }

        const entry = result.rows[0];
        const formattedEntry = {
          ...entry,
          is_income: isIncomeBoolean, // Add is_income for consistency
          category: entry.category_id
            ? {
                id: entry.category_id,
                name: entry.category_name,
              }
            : null,
        };

        return res.status(200).json(formattedEntry);
      } else {
        if (!supabaseAdmin) {
          return res
            .status(500)
            .json({ error: "Supabase client not configured" });
        }

        const { data: entry, error } = await supabaseAdmin
          .from(tableName)
          .select(
            `
            *,
            category:all_categories!category_id(*)
          `
          )
          .eq("id", id)
          .eq("chat_id", telegram_id)
          .single();

        if (error) {
          console.error(`Error fetching ${tableName}:`, error);
          return res
            .status(500)
            .json({ error: `Failed to fetch ${tableName}` });
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
    } else if (req.method === "PUT") {
      const { description, amount, category_id } = req.body;
      console.log("🔍 description", description);
      console.log("🔍 amount", amount);
      console.log("🔍 category_id", category_id);

      if (!description || amount === undefined || category_id === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (isLocal) {
        // First check if the entry exists and belongs to the user
        const existingEntry = await postgresClient.query(
          `SELECT id FROM ${tableName} WHERE id = $1 AND chat_id = $2`,
          [id, telegram_id]
        );

        if (existingEntry.rows.length === 0) {
          return res.status(404).json({ error: "Entry not found" });
        }

        // Update the entry - only include is_income field for expenses table
        const updateFields = isIncomeBoolean
          ? "description = $1, amount = $2, category_id = $3, updated_at = NOW()"
          : "description = $1, amount = $2, category_id = $3, is_income = $4, updated_at = NOW()";
        const updateValues = isIncomeBoolean
          ? [description, amount, category_id, id, telegram_id]
          : [description, amount, category_id, isIncomeBoolean, id, telegram_id];

        await postgresClient.query(
          `UPDATE ${tableName}
           SET ${updateFields}
           WHERE id = ${isIncomeBoolean ? "$4" : "$5"} AND chat_id = ${isIncomeBoolean ? "$5" : "$6"}`,
          updateValues
        );

        // Get the updated entry
        const updatedResult = await postgresClient.query(
          `SELECT e.*, c.id as category_id, c.name as category_name
           FROM ${tableName} e
           LEFT JOIN all_categories c ON e.category_id = c.id
           WHERE e.id = $1 AND e.chat_id = $2`,
          [id, telegram_id]
        );
        console.log("🔍 updatedResult", updatedResult);

        const updatedEntry = updatedResult.rows[0];
        const formattedEntry = {
          ...updatedEntry,
          is_income: isIncomeBoolean, // Add is_income for consistency
          category: updatedEntry.category_id
            ? {
                id: updatedEntry.category_id,
                name: updatedEntry.category_name,
              }
            : null,
        };
        console.log("🔍 formattedEntry", formattedEntry);

        return res.status(200).json(formattedEntry);
      } else {
        if (!supabaseAdmin) {
          return res
            .status(500)
            .json({ error: "Supabase client not configured" });
        }

        // First check if the entry exists and belongs to the user
        const { data: existingEntry, error: fetchError } = await supabaseAdmin
          .from(tableName)
          .select("id")
          .eq("id", id)
          .eq("chat_id", telegram_id)
          .single();

        if (fetchError || !existingEntry) {
          return res.status(404).json({ error: "Entry not found" });
        }

        // Update the entry - only include is_income field for expenses table
        const updateData = isIncomeBoolean
          ? {
              description,
              amount,
              category_id,
              updated_at: new Date().toISOString(),
            }
          : {
              description,
              amount,
              category_id,
              is_income: isIncomeBoolean,
              updated_at: new Date().toISOString(),
            };

        const { data: updatedEntry, error: updateError } = await supabaseAdmin
          .from(tableName)
          .update(updateData)
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
          console.error(`Error updating ${tableName}:`, updateError);
          return res
            .status(500)
            .json({ error: `Failed to update ${tableName}` });
        }

        // Add is_income field for consistency
        const formattedEntry = {
          ...updatedEntry,
          is_income: isIncomeBoolean,
        };

        return res.status(200).json(formattedEntry);
      }
    } else if (req.method === "DELETE") {
      if (isLocal) {
        await postgresClient.query(
          `DELETE FROM ${tableName} WHERE id = $1 AND chat_id = $2`,
          [id, telegram_id]
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
    console.error("Error in entries API:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
