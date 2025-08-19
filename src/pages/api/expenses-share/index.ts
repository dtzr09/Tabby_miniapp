import { NextApiRequest, NextApiResponse } from "next";
import { BOT_TOKEN, isLocal } from "../../../../utils/utils";
import { validateTelegramWebApp } from "../../../../lib/validateTelegram";
import { postgresClient } from "../../../../lib/postgresClient";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { initData, group_id } = req.query;
  const isValid = await validateTelegramWebApp(initData as string, BOT_TOKEN);

  if (!isValid) {
    return res.status(400).json({ error: "Missing telegram_id or initData" });
  }

  if (isLocal) {
    const expenses = await postgresClient.query(
      "SELECT * FROM expenses WHERE chat_id = $1",
      [group_id]
    );

    return res.status(200).json(expenses.rows);
  } else {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Supabase client not configured" });
    }

    const expenses = await supabaseAdmin
      .from("expenses")
      .select("*")
      .eq("chat_id", group_id);

    if (expenses.error) {
      return res.status(500).json({ error: expenses.error.message });
    }

    return res.status(200).json(expenses.data);
  }
}
