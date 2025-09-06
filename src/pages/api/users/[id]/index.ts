import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";
import { postgresClient } from "../../../../../lib/postgresClient";
import { validateTelegramWebApp } from "../../../../../lib/validateTelegram";
import { BOT_TOKEN, isLocal } from "../../../../../utils/utils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { id: userId, initData, chat_id } = req.query;

  // Validate required parameters
  if (!userId || !initData) {
    return res.status(400).json({
      error: "Missing required parameters: userId or initData",
    });
  }

  if (typeof userId !== "string" || typeof initData !== "string") {
    return res.status(400).json({ error: "Invalid parameter types" });
  }

  // Validate Telegram WebApp data
  const isValid = validateTelegramWebApp(initData, BOT_TOKEN);

  if (!isValid) {
    return res.status(401).json({ error: "Invalid Telegram WebApp data" });
  }

  const chat_id_to_use = chat_id as string;

  try {
    if (isLocal) {
      // Get user by ID from local database
      const userResult = await postgresClient.query(
        "SELECT * FROM users WHERE id = $1 AND chat_id = $2 LIMIT 1",
        [userId, chat_id_to_use]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.status(200).json(userResult.rows[0]);
    } else {
      // Use Supabase for production
      if (!supabaseAdmin) {
        return res
          .status(500)
          .json({ error: "Supabase client not configured" });
      }

      try {
        // Get the user row by ID
        const { data: users, error: userError } = await supabaseAdmin
          .from("users")
          .select("*")
          .eq("id", userId)
          .eq("chat_id", chat_id_to_use)
          .limit(1);

        if (userError) {
          console.error("Supabase user query error:", userError);
          return res.status(500).json({ error: "Failed to fetch user data" });
        }

        if (!users || users.length === 0) {
          return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json(users[0]);
      } catch (error) {
        console.error("Unexpected error:", error);
        return res.status(500).json({ error: "An unexpected error occurred" });
      }
    }
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({ error: "Database error occurred" });
  }
}
