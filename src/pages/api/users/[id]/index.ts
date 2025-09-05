import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";
import { postgresClient } from "../../../../../lib/postgresClient";
import { rateLimit } from "../../../../../lib/security";
import { isLocal } from "../../../../../utils/utils";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Rate limiting
  if (!rateLimit(req, 100, 60000)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  // Method validation
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const { id: userId, chat_id } = req.query;

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
          return res.status(500).json({ error: "Failed to fetch user data" });
        }

        if (!users || users.length === 0) {
          return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json(users[0]);
      } catch {
        return res.status(500).json({ error: "An unexpected error occurred" });
      }
    }
  } catch {
    return res.status(500).json({ error: "Database error occurred" });
  }
}

