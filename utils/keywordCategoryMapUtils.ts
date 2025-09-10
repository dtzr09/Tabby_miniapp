import { postgresClient } from "../lib/postgresClient";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { isLocal } from "./utils";

/**
 * Updates keyword category mappings AND actual entries when an expense/income category changes
 * Matches entries by chat_id and identical description, not entry_id
 * Updates ALL entries with the same description to have the same category
 * @param description - The description of the entry to match
 * @param newCategoryId - The new category ID
 * @param entryType - 1 for expenses, 2 for incomes
 * @param chatId - The chat ID for the entry
 */
export async function updateKeywordCategoryMap(
  description: string,
  newCategoryId: number,
  entryType: number,
  chatId: string
): Promise<void> {
  try {
    const tableName = entryType === 1 ? 'expenses' : 'incomes';
    
    if (isLocal) {
      // Update ALL entries with identical description to have the same category
      await postgresClient.query(
        `UPDATE ${tableName} 
         SET category_id = $1, updated_at = NOW()
         WHERE description = $2 AND chat_id = $3`,
        [newCategoryId, description, chatId]
      );

      // Update keyword mappings for all entries with identical description
      await postgresClient.query(
        `UPDATE keyword_category_map 
         SET category_id = $1 
         WHERE chat_id = $2 AND entry_type = $3
         AND entry_id IN (
           SELECT id FROM ${tableName} 
           WHERE description = $4 AND chat_id = $2
         )`,
        [newCategoryId, chatId, entryType, description]
      );
    } else {
      // Update ALL entries with identical description to have the same category
      if (!supabaseAdmin) {
        console.error("Supabase client not configured");
        return;
      }

      // Update all entries with the same description
      const { error: updateEntriesError } = await supabaseAdmin
        .from(tableName)
        .update({ 
          category_id: newCategoryId,
          updated_at: new Date().toISOString()
        })
        .eq('description', description)
        .eq('chat_id', chatId);

      if (updateEntriesError) {
        console.error("Error updating entries:", updateEntriesError);
        return;
      }

      // Get all entry IDs with the same description for keyword mapping update
      const { data: matchingEntries, error: fetchError } = await supabaseAdmin
        .from(tableName)
        .select('id')
        .eq('description', description)
        .eq('chat_id', chatId);

      if (fetchError) {
        console.error("Error fetching matching entries:", fetchError);
        return;
      }

      if (matchingEntries && matchingEntries.length > 0) {
        const entryIds = matchingEntries.map(entry => entry.id);
        
        await supabaseAdmin
          .from('keyword_category_map')
          .update({ category_id: newCategoryId })
          .eq('chat_id', chatId)
          .eq('entry_type', entryType)
          .in('entry_id', entryIds);
      }
    }
  } catch (error) {
    console.error("Error updating keyword category map:", error);
    // Don't throw error to prevent blocking the main category update operation
  }
}

/**
 * Clean up keyword mappings when an entry is deleted
 */
export async function deleteKeywordCategoryMappings(
  entryId: number,
  entryType: number,
  chatId: string
): Promise<void> {
  try {
    if (isLocal) {
      await postgresClient.query(
        'DELETE FROM keyword_category_map WHERE entry_id = $1 AND entry_type = $2 AND chat_id = $3',
        [entryId, entryType, chatId]
      );
    } else {
      if (!supabaseAdmin) {
        console.error("Supabase client not configured");
        return;
      }

      await supabaseAdmin
        .from('keyword_category_map')
        .delete()
        .eq('entry_id', entryId)
        .eq('entry_type', entryType)
        .eq('chat_id', chatId);
    }
  } catch (error) {
    console.error("Error deleting keyword category mappings:", error);
  }
}