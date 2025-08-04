import { NextApiRequest, NextApiResponse } from "next";
import { validateTelegramWebApp } from "../../../lib/validateTelegram";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { postgresClient } from "../../../lib/postgresClient";

const BOT_TOKEN =
  process.env.NODE_ENV === "development"
    ? process.env.TELEGRAM_LOCAL_BOT_TOKEN!
    : process.env.TELEGRAM_BOT_TOKEN!;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { telegram_id, initData } = req.query;
  const isValid = await validateTelegramWebApp(initData as string, BOT_TOKEN);

  if (!isValid) {
    return res.status(400).json({ error: "Missing telegram_id or initData" });
  }

  // Use appropriate client based on environment
  const isLocal =
    process.env.NODE_ENV === "development" &&
    process.env.DATABASE_URL?.includes("postgresql://");

  if (isLocal) {
    const static_categories = await postgresClient.query(
      "SELECT * FROM all_categories WHERE user_id IS NULL AND chat_id IS NULL"
    );
    const user_categories = await postgresClient.query(
      "SELECT * FROM all_categories WHERE chat_id = $1",
      [telegram_id]
    );
    return res.status(200).json({
      categories: [...static_categories.rows, ...user_categories.rows],
    });
  } else {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Supabase client not configured" });
    }

    const { data: static_categories } = await supabaseAdmin
      .from("all_categories")
      .select("*")
      .is("user_id", null)
    .is("chat_id", null);

    const { data: categories } = await supabaseAdmin
      .from("all_categories")
      .select("*")
      .eq("chat_id", telegram_id)
      .order("name");

    return res.status(200).json({
      categories: [...(static_categories || []), ...(categories || [])],
    });
  }
}
