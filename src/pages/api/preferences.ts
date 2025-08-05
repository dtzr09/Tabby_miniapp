import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { postgresClient } from "../../../lib/postgresClient";
import { validateTelegramWebApp } from "../../../lib/validateTelegram";
import { BOT_TOKEN, isLocal } from "../../../utils/static";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const { telegram_id, initData } = req.query;

    // Validate Telegram WebApp data
    const isValid = validateTelegramWebApp(initData as string, BOT_TOKEN);

    if (!isValid) {
      return res.status(401).json({ error: "Invalid Telegram WebApp data" });
    }

    if (isLocal) {
      // Use local PostgreSQL for development
      console.log("🔧 Using local PostgreSQL connection for preferences");

      try {
        // Get the user preferences by telegram_id
        const result = await postgresClient.query(
          "SELECT currency, timezone, country FROM users WHERE telegram_id = $1 LIMIT 1",
          [telegram_id]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ error: "User not found" });
        }

        console.log("✅ Preferences fetched locally:", result.rows[0]);
        return res.status(200).json(result.rows[0]);
      } catch (error) {
        console.error("❌ Local database error:", error);
        return res.status(500).json({ error: "Database error" });
      }
    } else {
      // Use Supabase for production
      console.log("🔧 Using Supabase connection for preferences");

      if (!supabaseAdmin) {
        return res
          .status(500)
          .json({ error: "Supabase client not configured" });
      }

      try {
        // Get the user preferences by telegram_id
        const { data, error } = await supabaseAdmin
          .from("users")
          .select("currency, timezone, country")
          .eq("telegram_id", telegram_id as string)
          .limit(1)
          .single();

        if (error || !data) {
          return res.status(404).json({ error: "User not found" });
        }

        console.log("✅ Preferences fetched from Supabase:", data);
        return res.status(200).json(data);
      } catch (error) {
        console.error("❌ Supabase error:", error);
        return res.status(500).json({ error: "Database error" });
      }
    }
  }

  if (req.method === "POST") {
    const { telegram_id, initData, currency, timezone, country } = req.body;

    // Validate Telegram WebApp data
    const isValid = validateTelegramWebApp(initData as string, BOT_TOKEN);

    if (!isValid) {
      return res.status(401).json({ error: "Invalid Telegram WebApp data" });
    }

    // Validate required fields
    if (!telegram_id) {
      return res.status(400).json({ error: "telegram_id is required" });
    }

    // Use appropriate client based on environment
    const isLocal =
      process.env.NODE_ENV === "development" &&
      process.env.DATABASE_URL?.includes("postgresql://");

    if (isLocal) {
      // Use local PostgreSQL for development
      console.log("🔧 Using local PostgreSQL connection for preferences");

      try {
        // Get the user row by telegram_id
        const userResult = await postgresClient.query(
          "SELECT id FROM users WHERE telegram_id = $1 LIMIT 1",
          [telegram_id]
        );

        if (userResult.rows.length === 0) {
          return res.status(404).json({ error: "User not found" });
        }

        const userId = userResult.rows[0].id;

        // Update user preferences
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        if (currency !== undefined) {
          updateFields.push(`currency = $${paramIndex}`);
          updateValues.push(currency);
          paramIndex++;
        }

        if (timezone !== undefined) {
          updateFields.push(`timezone = $${paramIndex}`);
          updateValues.push(timezone);
          paramIndex++;
        }

        if (country !== undefined) {
          updateFields.push(`country = $${paramIndex}`);
          updateValues.push(country);
          paramIndex++;
        }

        if (updateFields.length === 0) {
          return res.status(400).json({ error: "No valid fields to update" });
        }

        updateValues.push(userId);
        const updateQuery = `
          UPDATE users 
          SET ${updateFields.join(", ")}, updated_at = NOW()
          WHERE id = $${paramIndex}
          RETURNING id, currency, timezone, country
        `;

        const result = await postgresClient.query(updateQuery, updateValues);

        console.log("✅ Preferences updated locally:", result.rows[0]);
        return res.status(200).json(result.rows[0]);
      } catch (error) {
        console.error("❌ Local database error:", error);
        return res.status(500).json({ error: "Database error" });
      }
    } else {
      // Use Supabase for production
      console.log("🔧 Using Supabase connection for preferences");

      if (!supabaseAdmin) {
        return res
          .status(500)
          .json({ error: "Supabase client not configured" });
      }

      try {
        // Get the user row by telegram_id
        const { data: users, error: userError } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("telegram_id", telegram_id as string)
          .limit(1);

        if (userError || !users || users.length === 0) {
          return res.status(404).json({ error: "User not found" });
        }

        const userId = users[0].id;

        // Prepare update data
        const updateData: Record<string, string | Date> = {};
        if (currency !== undefined) updateData.currency = currency;
        if (timezone !== undefined) updateData.timezone = timezone;
        if (country !== undefined) updateData.country = country;
        updateData.updated_at = new Date().toISOString();

        if (Object.keys(updateData).length === 0) {
          return res.status(400).json({ error: "No valid fields to update" });
        }

        // Update user preferences
        const { data, error } = await supabaseAdmin
          .from("users")
          .update(updateData)
          .eq("id", userId)
          .select("id, currency, timezone, country")
          .single();

        if (error) {
          console.error("❌ Supabase update error:", error);
          return res.status(400).json({ error: error.message });
        }

        return res.status(200).json(data);
      } catch (error) {
        console.error("❌ Supabase error:", error);
        return res.status(500).json({ error: "Database error" });
      }
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
