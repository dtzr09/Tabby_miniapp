import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
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

    console.log("🔍 Budgets API Request received:", {
      telegram_id,
      initDataLength: initData ? (initData as string).length : 0,
      hasBotToken: !!BOT_TOKEN,
    });

    // Validate Telegram WebApp data
    const isValid = validateTelegramWebApp(initData as string, BOT_TOKEN);
    console.log("🔐 Budgets validation result:", isValid);

    if (!isValid) {
      console.log("❌ Invalid Telegram WebApp data for budgets");
      return res.status(401).json({ error: "Invalid Telegram WebApp data" });
    }

    // Get the user row by telegram_id
    const { data: users, error: userError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("telegram_id", telegram_id as string)
      .limit(1);

    if (userError || !users || users.length === 0) {
      console.log("❌ User not found for budgets:", { telegram_id, userError });
      return res.status(404).json({ error: "User not found" });
    }
    const userId = users[0].id;
    console.log("✅ User found for budgets:", { telegram_id, userId });

    // Get budgets for this user
    console.log("🔍 Fetching budgets for user ID:", userId);
    const { data, error } = await supabaseAdmin
      .from("budgets")
      .select(
        `
        id, 
        amount, 
        created_at, 
        updated_at,
        category_id,
        categories!budgets_category_id_fkey (
          id,
          name
        )
      `
      )
      .eq("user_id", userId);

    if (error) {
      console.log("❌ Budgets database error:", error);
      return res.status(400).json({ error: error.message });
    }

    console.log("✅ Budgets fetched:", { count: data?.length || 0, data });
    return res.status(200).json(data || []);
  }

  res.setHeader("Allow", ["GET"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
