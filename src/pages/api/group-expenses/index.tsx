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

  const { telegram_id, initData, group_id, isPeriod, group_view, user } =
    req.query;
  const isValid = await validateTelegramWebApp(initData as string, BOT_TOKEN);

  if (!isValid) {
    return res.status(400).json({ error: "Missing telegram_id or initData" });
  }
  const userData = JSON.parse(user as string)[0];
  const userId = userData.id;
  const timezone = userData.timezone || "Asia/Singapore";

  const now = new Date();
  const timeNow = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
  const startOfMonth = new Date(timeNow.getFullYear(), timeNow.getMonth(), 1);
  const startOfNextMonth = new Date(
    timeNow.getFullYear(),
    timeNow.getMonth() + 1,
    1
  );

  if (isLocal) {
    let query = "";
    let values = [group_id];
    if (group_view) {
      if (isPeriod) {
        query = `
        SELECT * FROM expenses
        WHERE chat_id = $1
        AND date >= $2
        AND date < $3
        `;
        values.push(startOfMonth.toISOString(), startOfNextMonth.toISOString());
      } else {
        query = `
          SELECT * FROM expenses
          WHERE chat_id = $1
          `;
      }
    } else {
      if (isPeriod) {
        query = `
        SELECT * FROM expenses
        WHERE chat_id = $1
          AND payer_id = $2
          AND date >= $3
          AND date < $4
          `;
        values = [
          group_id,
          userId,
          startOfMonth.toISOString(),
          startOfNextMonth.toISOString(),
        ];
      } else {
        query = `
          SELECT * FROM expenses
          WHERE chat_id = $1
          AND payer_id = $2
          `;
        values = [group_id, userId];
      }
    }
    const expenses = await postgresClient.query(query, values);

    return res.status(200).json(expenses.rows);
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
