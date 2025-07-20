import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { postgresClient } from "../../../lib/postgresClient";
import { validateTelegramWebApp } from "../../../lib/validateTelegram";

const BOT_TOKEN =
  process.env.NODE_ENV === "development"
    ? process.env.TELEGRAM_DEV_BOT_TOKEN!
    : process.env.TELEGRAM_BOT_TOKEN!;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const { telegram_id, initData } = req.query;

    // Validate Telegram WebApp data
    const isValid = validateTelegramWebApp(initData as string, BOT_TOKEN);

    if (!isValid) {
      return res.status(401).json({ error: "Invalid Telegram WebApp data" });
    }

    // Use appropriate client based on environment
    const isLocal =
      process.env.NODE_ENV === "development" &&
      process.env.DATABASE_URL?.includes("postgresql://");

    if (isLocal) {
      // Get user by telegram_id
      const userResult = await postgresClient.query(
        "SELECT id FROM users WHERE telegram_id = $1 AND chat_id = $1 LIMIT 1",
        [telegram_id]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const userId = userResult.rows[0].id;

      // Get all transactions for this user with category names
      const expensesResult = await postgresClient.query(
        `SELECT 
          e.id, 
          e.amount, 
          e.description, 
          e.date, 
          e.is_income,
          json_build_object('name', c.name) as category
        FROM expenses e
        LEFT JOIN categories c ON e.category_id = c.id
        WHERE e.payer_id = $1
        ORDER BY e.id DESC`,
        [userId]
      );

      return res.status(200).json(expensesResult.rows);
    } else {
      // Use Supabase for production

      if (!supabaseAdmin) {
        return res
          .status(500)
          .json({ error: "Supabase client not configured" });
      }

      // Get the user row by telegram_id
      const { data: users, error: userError } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("telegram_id", telegram_id as string)
        .limit(1);

      if (userError || !users || users.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const userId = users[0].id;

      // Get ALL transactions (both expenses and income) for this user, join with categories
      const { data, error } = await supabaseAdmin
        .from("expenses")
        .select(
          "id, amount, description, date, is_income, category:category_id (name)"
        )
        .eq("payer_id", userId)
        .order("id", { ascending: false }); // Order by ID descending to get newest first

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json(data);
    }
  }

  res.setHeader("Allow", ["GET"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
