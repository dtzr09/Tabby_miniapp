import { NextApiRequest, NextApiResponse } from "next";
import { validateTelegramWebApp } from "../../../../../lib/validateTelegram";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";
import { postgresClient } from "../../../../../lib/postgresClient";
import { BOT_TOKEN, isLocal } from "../../../../../utils/utils";
import { roundToCents } from "../../../../../lib/currencyUtils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Missing expense ID" });
  }

  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { shares, chat_id, initData } = req.body;

  if (!shares || !chat_id || !initData) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const isValid = await validateTelegramWebApp(initData as string, BOT_TOKEN);

  if (!isValid) {
    return res.status(400).json({ error: "Invalid Telegram request" });
  }

  try {
    if (isLocal) {
      // Update existing shares (much more efficient than delete/recreate)
      for (const share of shares) {
        // Round share amount to prevent floating point precision issues
        const roundedShareAmount = roundToCents(parseFloat(share.share_amount));
        
        // First try to update existing share
        const updateResult = await postgresClient.query(
          "UPDATE expense_shares SET share_amount = $1 WHERE expense_id = $2 AND user_id = $3",
          [roundedShareAmount, id, share.user_id]
        );

        // If no rows were updated, insert new share (for equal -> custom split conversion)
        if (updateResult.rowCount === 0) {
          await postgresClient.query(
            "INSERT INTO expense_shares (expense_id, user_id, share_amount) VALUES ($1, $2, $3)",
            [id, share.user_id, roundedShareAmount]
          );
        }
      }

      return res.status(200).json({ success: true });
    } else {
      if (!supabaseAdmin) {
        return res
          .status(500)
          .json({ error: "Supabase client not configured" });
      }

      // First verify the expense exists and belongs to the chat
      const { data: expense, error: fetchError } = await supabaseAdmin
        .from("expenses")
        .select("id")
        .eq("id", id)
        .eq("chat_id", chat_id)
        .single();

      if (fetchError || !expense) {
        return res.status(404).json({ error: "Expense not found" });
      }

      // Update existing shares (much more efficient than delete/recreate)
      for (const share of shares) {
        // Round share amount to prevent floating point precision issues
        const roundedShareAmount = roundToCents(parseFloat(share.share_amount));
        
        // First try to update existing share
        const { data: updateData, error: updateError } = await supabaseAdmin
          .from("expense_shares")
          .update({ share_amount: roundedShareAmount })
          .eq("expense_id", id)
          .eq("user_id", share.user_id)
          .select();

        if (updateError) {
          console.error("Error updating expense share:", updateError);
          return res.status(500).json({ error: "Failed to update shares" });
        }

        // If no rows were updated, insert new share (for equal -> custom split conversion)
        if (!updateData || updateData.length === 0) {
          const { error: insertError } = await supabaseAdmin
            .from("expense_shares")
            .insert({
              expense_id: id,
              user_id: share.user_id,
              share_amount: roundedShareAmount,
            });

          if (insertError) {
            console.error("Error inserting expense share:", insertError);
            return res.status(500).json({ error: "Failed to update shares" });
          }
        }
      }

      return res.status(200).json({ success: true });
    }
  } catch (error) {
    console.error("Error in expense shares API:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}