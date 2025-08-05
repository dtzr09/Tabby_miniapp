import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { postgresClient } from "../../../lib/postgresClient";
import { validateTelegramWebApp } from "../../../lib/validateTelegram";
import { BOT_TOKEN, isLocal } from "../../../utils/static";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const { telegram_id, initData } = req.query;
    // Validate Telegram WebApp data
    const isValid = validateTelegramWebApp(initData as string, BOT_TOKEN);

    if (!isValid) {
      console.log("❌ Invalid Telegram WebApp data for budgets");
      return res.status(401).json({ error: "Invalid Telegram WebApp data" });
    }

    if (isLocal) {
      // Get user by telegram_id
      // TODO: If is group chat, then use chat_id cuz telegram_id and chat_id will be different
      // TODO: If is private chat, telegram_id = chat_id
      const userResult = await postgresClient.query(
        "SELECT id, timezone FROM users WHERE telegram_id = $1 AND chat_id = $1 LIMIT 1",
        [telegram_id]
      );

      if (userResult.rows.length === 0) {
        console.log("❌ User not found for budgets:", { telegram_id });
        return res.status(404).json({ error: "User not found" });
      }

      const userId = userResult.rows[0].id;
      const timezone = userResult.rows[0].timezone;

      // Get current month budgets for this user with category names
      const now = new Date();
      const timeNow = new Date(
        now.toLocaleString("en-US", { timeZone: timezone })
      );
      const currentMonth = timeNow.getMonth() + 1;
      const currentYear = timeNow.getFullYear();

      const budgetsResult = await postgresClient.query(
        `SELECT 
          b.id, 
          b.amount, 
          b.created_at, 
          b.updated_at,
          b.category_id,
          json_build_object('id', c.id, 'name', c.name) as category
        FROM budgets b
        LEFT JOIN all_categories c ON b.category_id = c.id
        WHERE b.user_id = $1 AND b.month = $2 AND b.year = $3`,
        [userId, currentMonth, currentYear]
      );

      return res.status(200).json(budgetsResult.rows);
    } else {
      if (!supabaseAdmin) {
        return res
          .status(500)
          .json({ error: "Supabase client not configured" });
      }

      // Get the user row by telegram_id
      const { data: users, error: userError } = await supabaseAdmin
        .from("users")
        .select("id, timezone")
        .eq("telegram_id", telegram_id as string)
        .limit(1);

      if (userError || !users || users.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      const userId = users[0].id;
      const timezone = users[0].timezone;

      // Get current month budgets for this user
      const now = new Date();
      const timeNow = new Date(
        now.toLocaleString("en-US", { timeZone: timezone })
      );
      const currentMonth = timeNow.getMonth() + 1;
      const currentYear = timeNow.getFullYear();

      const { data, error } = await supabaseAdmin
        .from("budgets")
        .select(
          `
          id, 
          amount, 
          created_at, 
          updated_at,
          category_id,
          category:all_categories!budgets_category_id_fkey (
            id,
            name
          )
        `
        )
        .eq("user_id", userId)
        .eq("month", currentMonth)
        .eq("year", currentYear);

      if (error) {
        console.log("❌ Budgets database error:", error);
        return res.status(400).json({ error: error.message });
      }

      console.log("✅ Budgets fetched:", { count: data?.length || 0, data });
      return res.status(200).json(data || []);
    }
  }

  res.setHeader("Allow", ["GET"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
