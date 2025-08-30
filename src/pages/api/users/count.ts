import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { postgresClient } from "../../../../lib/postgresClient";
import { validateTelegramWebApp } from "../../../../lib/validateTelegram";
import { BOT_TOKEN, isLocal } from "../../../../utils/utils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { telegram_id, initData, chat_id } = req.query;

  // Validate required parameters
  if (!telegram_id || !initData || !chat_id) {
    return res.status(400).json({
      error: "Missing required parameters: telegram_id, initData, or chat_id",
    });
  }

  if (typeof telegram_id !== "string" || typeof initData !== "string" || typeof chat_id !== "string") {
    return res.status(400).json({ error: "Invalid parameter types" });
  }

  // Validate Telegram WebApp data
  const isValid = validateTelegramWebApp(initData, BOT_TOKEN);

  if (!isValid) {
    return res.status(401).json({ error: "Invalid Telegram WebApp data" });
  }

  if (isLocal) {
    try {
      // Get user count by chat_id
      const countResult = await postgresClient.query(
        "SELECT COUNT(*) as user_count FROM users WHERE chat_id = $1",
        [chat_id]
      );

      const userCount = parseInt(countResult.rows[0].user_count, 10);
      return res.status(200).json({ userCount });
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
      // Get the user count by chat_id
      const { count, error: countError } = await supabaseAdmin
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("chat_id", chat_id);

      if (countError) {
        console.error("Supabase count query error:", countError);
        return res.status(500).json({ error: "Failed to fetch user count" });
      }

      return res.status(200).json({ userCount: count || 0 });
    } catch (error) {
      console.error("Unexpected error:", error);
      return res.status(500).json({ error: "An unexpected error occurred" });
    }
  }
}