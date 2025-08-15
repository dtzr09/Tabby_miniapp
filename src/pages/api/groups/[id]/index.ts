import { NextApiRequest, NextApiResponse } from "next";
import { validateTelegramWebApp } from "../../../../../lib/validateTelegram";
import { BOT_TOKEN, isLocal } from "../../../../../utils/utils";
import { postgresClient } from "../../../../../lib/postgresClient";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { telegram_id, initData, id: group_id } = req.query;
  const isValid = await validateTelegramWebApp(initData as string, BOT_TOKEN);

  if (!isValid) {
    return res.status(400).json({ error: "Missing telegram_id or initData" });
  }

  if (isLocal) {
    const userGroups = await postgresClient.query(
      "SELECT * FROM users WHERE chat_id = $1",
      [group_id]
    );

    if (userGroups.rows.length === 0) {
      return res.status(200).json(null);
    }

    const groupsIds = userGroups.rows.map((user) => user.chat_id);

    const groups = await postgresClient.query(
      "SELECT * FROM groups WHERE chat_id = ANY($1)",
      [groupsIds]
    );

    return res.status(200).json(groups.rows);
  } else {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Supabase client not configured" });
    }

    const { data: group } = await supabaseAdmin
      .from("groups")
      .select("*")
      .eq("telegram_id", telegram_id);
    return res.status(200).json(group);
  }
}
