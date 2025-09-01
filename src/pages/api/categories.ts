import { NextApiRequest, NextApiResponse } from "next";
import { validateTelegramWebApp } from "../../../lib/validateTelegram";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { postgresClient } from "../../../lib/postgresClient";
import { BOT_TOKEN, isLocal } from "../../../utils/utils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { telegram_id, initData } = req.query;
  const isValid = await validateTelegramWebApp(initData as string, BOT_TOKEN);

  if (!isValid) {
    return res.status(400).json({ error: "Missing telegram_id or initData" });
  }

  switch (req.method) {
    case "GET":
      return handleGetCategories(req, res, telegram_id as string);
    case "PUT":
      return handleUpdateCategory(req, res, telegram_id as string);
    case "DELETE":
      return handleDeleteCategory(req, res, telegram_id as string);
    default:
      return res.status(405).json({ error: "Method not allowed" });
  }
}

async function handleGetCategories(
  req: NextApiRequest,
  res: NextApiResponse,
  telegram_id: string
) {
  const { chat_id } = req.query;
  const effectiveChatId = chat_id || telegram_id; // Use group chat_id if provided, otherwise use telegram_id for personal

  if (isLocal) {
    const static_categories = await postgresClient.query(
      "SELECT * FROM all_categories WHERE user_id IS NULL AND chat_id IS NULL ORDER BY name"
    );
    const user_categories = await postgresClient.query(
      "SELECT * FROM all_categories WHERE chat_id = $1 ORDER BY name",
      [effectiveChatId]
    );
    return res.status(200).json({
      userCategories: user_categories.rows,
      staticCategories: static_categories.rows,
      // Keep backwards compatibility
      categories: [
        ...(user_categories.rows || []),
        ...(static_categories.rows || []),
      ],
    });
  } else {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Supabase client not configured" });
    }

    // Single optimized query to get both user and static categories
    const { data: allCategoriesData, error } = await supabaseAdmin
      .from("all_categories")
      .select("*")
      .or(`and(user_id.is.null,chat_id.is.null),chat_id.eq.${effectiveChatId}`)
      .order("name");

    if (error) {
      console.error("Supabase categories query error:", error);
      return res.status(500).json({ error: "Failed to fetch categories" });
    }

    // Separate static and user categories
    const static_categories = allCategoriesData?.filter(
      cat => cat.user_id === null && cat.chat_id === null
    ) || [];
    
    const user_categories = allCategoriesData?.filter(
      cat => cat.chat_id === effectiveChatId
    ) || [];

    return res.status(200).json({
      userCategories: user_categories || [],
      staticCategories: static_categories || [],
      // Keep backwards compatibility
      categories: [...(user_categories || []), ...(static_categories || [])],
    });
  }
}

async function handleUpdateCategory(
  req: NextApiRequest,
  res: NextApiResponse,
  telegram_id: string
) {
  const { id, name } = req.body;
  const { chat_id } = req.query;
  const effectiveChatId = chat_id || telegram_id; // Use group chat_id if provided, otherwise use telegram_id for personal

  if (!id || !name) {
    return res.status(400).json({ error: "Category ID and name are required" });
  }

  try {
    if (isLocal) {
      // Check if category belongs to user/group
      const checkResult = await postgresClient.query(
        "SELECT * FROM all_categories WHERE id = $1 AND chat_id = $2",
        [id, effectiveChatId]
      );

      if (checkResult.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "Category not found or not owned by user/group" });
      }

      // Update category name
      const result = await postgresClient.query(
        "UPDATE all_categories SET name = $1 WHERE id = $2 AND chat_id = $3 RETURNING *",
        [name, id, effectiveChatId]
      );

      return res.status(200).json({ category: result.rows[0] });
    } else {
      if (!supabaseAdmin) {
        return res
          .status(500)
          .json({ error: "Supabase client not configured" });
      }
      console.log("Updating category:", id, name, effectiveChatId);

      // Check if category belongs to user/group
      const { data: existingCategory } = await supabaseAdmin
        .from("all_categories")
        .select("*")
        .eq("id", id)
        .eq("chat_id", effectiveChatId)
        .single();
      console.log("Existing category:", existingCategory);

      if (!existingCategory) {
        return res
          .status(404)
          .json({ error: "Category not found or not owned by user/group" });
      }

      // Update category name
      const { error: updateError } = await supabaseAdmin
        .from("all_categories")
        .update({ name })
        .eq("id", id)
        .eq("chat_id", effectiveChatId);

      if (updateError) {
        console.log("Update error:", updateError);
        return res.status(500).json({ error: updateError.message });
      }

      // Fetch the updated category separately
      const { data: updatedCategory, error: fetchError } = await supabaseAdmin
        .from("all_categories")
        .select("*")
        .eq("id", id)
        .eq("chat_id", effectiveChatId)
        .single();

      if (fetchError) {
        console.log("Fetch error:", fetchError);
        return res.status(500).json({ error: fetchError.message });
      }

      console.log("Updated category:", updatedCategory);
      return res.status(200).json({ category: updatedCategory });
    }
  } catch (error) {
    console.error("Error updating category:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleDeleteCategory(
  req: NextApiRequest,
  res: NextApiResponse,
  telegram_id: string
) {
  const { id, chat_id } = req.query;
  const effectiveChatId = chat_id || telegram_id; // Use group chat_id if provided, otherwise use telegram_id for personal

  if (!id) {
    return res.status(400).json({ error: "Category ID is required" });
  }

  try {
    if (isLocal) {
      // Check if category belongs to user/group and is not static
      const checkResult = await postgresClient.query(
        "SELECT * FROM all_categories WHERE id = $1 AND chat_id = $2",
        [id, effectiveChatId]
      );

      if (checkResult.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "Category not found or not owned by user/group" });
      }

      // Check if category is in use
      const usageCheck = await postgresClient.query(
        "SELECT COUNT(*) as count FROM expenses WHERE category_id = $1 UNION ALL SELECT COUNT(*) as count FROM incomes WHERE category_id = $1",
        [id]
      );

      const totalUsage = usageCheck.rows.reduce(
        (sum, row) => sum + parseInt(row.count),
        0
      );
      if (totalUsage > 0) {
        return res
          .status(400)
          .json({ error: "Cannot delete category that is in use" });
      }

      // Delete category
      await postgresClient.query(
        "DELETE FROM all_categories WHERE id = $1 AND chat_id = $2",
        [id, effectiveChatId]
      );

      return res.status(200).json({ message: "Category deleted successfully" });
    } else {
      if (!supabaseAdmin) {
        return res
          .status(500)
          .json({ error: "Supabase client not configured" });
      }

      // Check if category belongs to user/group and is not static
      const { data: existingCategory } = await supabaseAdmin
        .from("all_categories")
        .select("*")
        .eq("id", id)
        .eq("chat_id", effectiveChatId)
        .single();

      if (!existingCategory) {
        return res
          .status(404)
          .json({ error: "Category not found or not owned by user/group" });
      }

      // Check if category is in use
      const { count: expenseCount } = await supabaseAdmin
        .from("expenses")
        .select("*", { count: "exact", head: true })
        .eq("category_id", id);

      const { count: incomeCount } = await supabaseAdmin
        .from("incomes")
        .select("*", { count: "exact", head: true })
        .eq("category_id", id);

      if ((expenseCount || 0) + (incomeCount || 0) > 0) {
        return res
          .status(400)
          .json({ error: "Cannot delete category that is in use" });
      }

      // Delete category
      const { error } = await supabaseAdmin
        .from("all_categories")
        .delete()
        .eq("id", id)
        .eq("chat_id", effectiveChatId);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ message: "Category deleted successfully" });
    }
  } catch (error) {
    console.error("Error deleting category:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
