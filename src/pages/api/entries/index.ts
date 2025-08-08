import { NextApiRequest, NextApiResponse } from "next";
import { validateTelegramWebApp } from "../../../../lib/validateTelegram";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { postgresClient } from "../../../../lib/postgresClient";
import { BOT_TOKEN, isLocal } from "../../../../utils/utils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { telegram_id, initData, isIncome } = req.query;
  const isValid = await validateTelegramWebApp(initData as string, BOT_TOKEN);

  if (!isValid) {
    return res.status(400).json({ error: "Invalid Telegram request" });
  }

  const isIncomeBoolean = isIncome === "true";
  const tableName = isIncomeBoolean ? "incomes" : "expenses";

  try {
    if (isLocal) {
      const result = await postgresClient.query(
        `SELECT e.*, c.id as category_id, c.name as category_name
         FROM ${tableName} e
         LEFT JOIN all_categories c ON e.category_id = c.id
         WHERE e.chat_id = $1
         ORDER BY e.date DESC`,
        [telegram_id]
      );

      const entries = result.rows.map((entry) => ({
        ...entry,
        category: entry.category_id
          ? {
              id: entry.category_id,
              name: entry.category_name,
            }
          : null,
      }));

      return res.status(200).json(entries);
    } else {
      if (!supabaseAdmin) {
        return res
          .status(500)
          .json({ error: "Supabase client not configured" });
      }

      const { data: entries, error } = await supabaseAdmin
        .from(tableName)
        .select(
          `
          *,
          category:all_categories!category_id(*)
        `
        )
        .eq("chat_id", telegram_id)
        .order("date", { ascending: false });

      if (error) {
        console.error(`Error fetching ${tableName}:`, error);
        return res.status(500).json({ error: `Failed to fetch ${tableName}` });
      }

      return res.status(200).json(entries || []);
    }
  } catch (error) {
    console.error("Error in entries API:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
