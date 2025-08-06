import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { postgresClient } from "../../../../lib/postgresClient";
import { validateTelegramWebApp } from "../../../../lib/validateTelegram";
import { BOT_TOKEN, isLocal } from "../../../../utils/utils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const { telegram_id, initData, isPeriod } = req.query;

    // Validate required parameters
    if (!telegram_id || !initData) {
      return res.status(400).json({
        error: "Missing required parameters: telegram_id or initData",
      });
    }

    if (typeof telegram_id !== "string" || typeof initData !== "string") {
      return res.status(400).json({ error: "Invalid parameter types" });
    }

    // Validate Telegram WebApp data
    const isValid = validateTelegramWebApp(initData, BOT_TOKEN);

    if (!isValid) {
      return res.status(401).json({ error: "Invalid Telegram WebApp data" });
    }

    if (isLocal) {
      try {
        // Get user by telegram_id
        const userResult = await postgresClient.query(
          "SELECT id, timezone FROM users WHERE telegram_id = $1 AND chat_id = $1 LIMIT 1",
          [telegram_id]
        );

        if (userResult.rows.length === 0) {
          return res.status(404).json({ error: "User not found" });
        }

        const userId = userResult.rows[0].id;
        const timezone = userResult.rows[0].timezone || "Asia/Singapore";

        const now = new Date();
        const timeNow = new Date(
          now.toLocaleString("en-US", { timeZone: timezone })
        );
        const startOfMonth = new Date(
          timeNow.getFullYear(),
          timeNow.getMonth(),
          1
        );
        const startOfNextMonth = new Date(
          timeNow.getFullYear(),
          timeNow.getMonth() + 1,
          1
        );

        let query = `
        SELECT 
          incomes.id, 
          incomes.amount, 
          incomes.description, 
          incomes.date, 
          json_build_object('name', c.name) as category
        FROM incomes
        LEFT JOIN all_categories c ON incomes.category_id = c.id
        WHERE incomes.user_id = $1
        ORDER BY incomes.id DESC
      `;

        let values = [userId];

        if (isPeriod) {
          query = `
          SELECT 
            incomes.id, 
            incomes.amount, 
            incomes.description, 
            incomes.date, 
            json_build_object('name', c.name) as category
          FROM incomes
          LEFT JOIN all_categories c ON incomes.category_id = c.id
          WHERE incomes.user_id = $1
            AND incomes.date >= $2
            AND incomes.date < $3
          ORDER BY incomes.id DESC
        `;
          values = [userId, startOfMonth, startOfNextMonth];
        }

        const incomeResult = await postgresClient.query(query, values);

        return res.status(200).json(incomeResult.rows);
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
        // Get the user row by telegram_id
        const { data: users, error: userError } = await supabaseAdmin
          .from("users")
          .select("id, timezone")
          .eq("telegram_id", telegram_id)
          .limit(1);

        if (userError) {
          console.error("Supabase user query error:", userError);
          return res.status(500).json({ error: "Failed to fetch user data" });
        }

        if (!users || users.length === 0) {
          return res.status(404).json({ error: "User not found" });
        }

        const userId = users[0].id;
        const timezone = users[0].timezone || "Asia/Singapore";

        const now = new Date();
        const timeNow = new Date(
          now.toLocaleString("en-US", { timeZone: timezone })
        );

        // Format dates for Supabase
        const startOfMonth = new Date(
          timeNow.getFullYear(),
          timeNow.getMonth(),
          1
        ).toISOString();

        const startOfNextMonth = new Date(
          timeNow.getFullYear(),
          timeNow.getMonth() + 1,
          1
        ).toISOString();

        let query = supabaseAdmin
          .from("incomes")
          .select(
            `
            id,
            amount,
            description,
            date,
            category:all_categories!category_id (
              name
            )
          `
          )
          .eq("user_id", userId)
          .order("id", { ascending: false });

        if (isPeriod) {
          query = query.gte("date", startOfMonth).lt("date", startOfNextMonth);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Supabase expenses query error:", error);
          return res.status(500).json({ error: "Failed to fetch expenses" });
        }
        return res.status(200).json(data);
      } catch (error) {
        console.error("Unexpected error:", error);
        return res.status(500).json({ error: "An unexpected error occurred" });
      }
    }
  }

  res.setHeader("Allow", ["GET"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
