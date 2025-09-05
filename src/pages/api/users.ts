import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { postgresClient } from "../../../lib/postgresClient";
import { validateTelegramWebApp } from "../../../lib/validateTelegram";
import { BOT_TOKEN, isLocal } from "../../../utils/utils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const { telegram_id, initData, chat_id } = req.query;

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

    let chat_id_to_use = telegram_id;
    if (chat_id) chat_id_to_use = chat_id as string;

    if (isLocal) {
      try {
        // Get user by telegram_id
        const userResult = await postgresClient.query(
          "SELECT * FROM users WHERE telegram_id = $1 AND chat_id = $2 LIMIT 1",
          [telegram_id, chat_id_to_use]
        );

        if (userResult.rows.length === 0) {
          return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json(userResult.rows[0]);
      } catch {
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
          .select("*")
          .eq("telegram_id", telegram_id)
          .eq("chat_id", chat_id_to_use)
          .limit(1);


        if (userError) {
          return res.status(500).json({ error: "Failed to fetch user data" });
        }

        if (!users || users.length === 0) {
          return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json(users[0]);
      } catch {
        return res.status(500).json({ error: "An unexpected error occurred" });
      }
    }
  }

  res.setHeader("Allow", ["GET"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
