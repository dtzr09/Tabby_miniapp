import { NextApiRequest, NextApiResponse } from "next";
import { validateTelegramWebApp } from "../../../../lib/validateTelegram";
import { BOT_TOKEN, isLocal } from "../../../../utils/utils";
import { postgresClient } from "../../../../lib/postgresClient";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

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

  if (isLocal) {
    const userGroups = await postgresClient.query(
      "SELECT * FROM users WHERE telegram_id = $1 AND chat_id != $1",
      [telegram_id]
    );

    if (userGroups.rows.length === 0) {
      return res.status(200).json([]);
    }

    const groupsIds = userGroups.rows.map((user) => user.chat_id);

    const groupsWithExpenses = await postgresClient.query(
      `
      SELECT * FROM groups
      WHERE chat_id = ANY($1)
        AND EXISTS (
          SELECT 1 FROM expenses
          WHERE expenses.chat_id = groups.chat_id
        )
      `,
      [groupsIds]
    );

    return res.status(200).json(groupsWithExpenses.rows || []);
  } else {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Supabase client not configured" });
    }

    // First get user's groups by finding users with matching telegram_id
    const { data: userGroups, error: userError } = await supabaseAdmin
      .from("users")
      .select("chat_id")
      .eq("telegram_id", telegram_id)
      .neq("chat_id", telegram_id);

    if (userError) {
      console.error("Error fetching user groups:", userError);
      return res.status(500).json({ error: "Failed to fetch user groups" });
    }

    if (!userGroups || userGroups.length === 0) {
      return res.status(200).json([]);
    }

    const groupChatIds = userGroups.map(user => user.chat_id);

    // Get groups that have expenses
    const { data: groupsWithExpenses, error: groupsError } = await supabaseAdmin
      .from("groups")
      .select("*")
      .in("chat_id", groupChatIds)
      .filter("chat_id", "in", `(${groupChatIds.join(",")})`);

    if (groupsError) {
      console.error("Error fetching groups with expenses:", groupsError);
      return res.status(500).json({ error: "Failed to fetch groups" });
    }

    return res.status(200).json(groupsWithExpenses || []);
  }
}
