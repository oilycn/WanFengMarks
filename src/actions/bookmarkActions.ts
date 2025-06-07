
'use server';

import type { Bookmark } from '@/types';
import { connectToDatabase, query } from '@/lib/mysql';
import type { RowDataPacket, OkPacket, PoolConnection } from 'mysql2/promise';

interface BookmarkRow extends RowDataPacket {
  id: number;
  name: string;
  url: string;
  category_id: number | null;
  description: string | null;
  is_private: boolean | number;
  priority: number;
}

interface MaxPriorityRow extends RowDataPacket {
  max_priority: number | null;
}

interface MinPriorityRow extends RowDataPacket {
  min_priority: number | null;
}

function mapDbRowToBookmark(row: BookmarkRow): Bookmark {
  console.log(`[BookmarkAction][mapDbRowToBookmark] Mapping row for ID: ${row.id}, Priority: ${row.priority}`);
  return {
    id: String(row.id),
    name: row.name,
    url: row.url,
    categoryId: row.category_id ? String(row.category_id) : 'default',
    description: row.description || '',
    isPrivate: Boolean(row.is_private),
    priority: row.priority === null || row.priority === undefined ? 0 : row.priority, // Ensure priority is a number, default to 0
  };
}

export async function getBookmarksAction(): Promise<Bookmark[]> {
  console.log('[BookmarkAction][getBookmarksAction] ENTRY');
  try {
    const rows = await query<BookmarkRow[]>("SELECT * FROM bookmarks ORDER BY priority DESC, created_at DESC");
    const bookmarks = rows.map(mapDbRowToBookmark);
    console.log(`[BookmarkAction][getBookmarksAction] SUCCESS_EXIT - Fetched ${bookmarks.length} bookmarks.`);
    return bookmarks;
  } catch (error: any) {
    console.error("[BookmarkAction][getBookmarksAction] ERROR_EXIT - Error fetching bookmarks. Message:", error.message, error);
    return [];
  }
}

export async function addBookmarkAction(bookmarkData: Omit<Bookmark, 'id' | 'priority'>): Promise<Bookmark> {
  console.log('[BookmarkAction][addBookmarkAction] ENTRY - Data:', bookmarkData);
  const { name, url, categoryId, description, isPrivate } = bookmarkData;

  let connection: PoolConnection | null = null;
  try {
    connection = await connectToDatabase();
    console.log('[BookmarkAction][addBookmarkAction] Database connection obtained.');
    await connection.beginTransaction();
    console.log('[BookmarkAction][addBookmarkAction] Transaction started.');

    const existingBookmarks = await connection.query<BookmarkRow[]>("SELECT id FROM bookmarks WHERE url = ?", [url]);
    if (existingBookmarks[0].length > 0) {
      console.warn('[BookmarkAction][addBookmarkAction] Bookmark URL already exists:', url);
      throw new Error('此书签网址已存在，请勿重复添加。');
    }

    // To add to the end, new bookmarks should get the lowest priority.
    // We fetch the current minimum priority and subtract 1.
    // If no bookmarks exist, or all have priority 0 or positive, new priority could be 0 or negative.
    const [minPriorityResultRows] = await connection.query<MinPriorityRow[]>("SELECT MIN(priority) as min_priority FROM bookmarks");
    const minPriorityRow = minPriorityResultRows[0];
    let newPriority: number;

    if (minPriorityRow && (minPriorityRow.min_priority !== null && minPriorityRow.min_priority !== undefined)) {
        newPriority = minPriorityRow.min_priority - 1;
        console.log(`[BookmarkAction][addBookmarkAction] Current min priority: ${minPriorityRow.min_priority}. New priority for item at end: ${newPriority}`);
    } else {
        // No bookmarks exist, or no priority set (should not happen if default is 0).
        // Set to 0 as a sensible default for the first item, or if min_priority is unexpectedly null.
        newPriority = 0;
        console.log(`[BookmarkAction][addBookmarkAction] No min priority found or it's null/undefined. Setting new priority to 0.`);
    }


    console.log(`[BookmarkAction][addBookmarkAction] Determined new priority: ${newPriority}`);

    const [result] = await connection.query<OkPacket>(
      "INSERT INTO bookmarks (name, url, category_id, description, is_private, priority) VALUES (?, ?, ?, ?, ?, ?)",
      [name, url, categoryId === 'default' ? null : Number(categoryId), description || null, isPrivate || false, newPriority]
    );
    console.log('[BookmarkAction][addBookmarkAction] Insert query executed. Result:', result);

    if (!result.insertId) {
        console.error('[BookmarkAction][addBookmarkAction] Failed to insert bookmark, insertId is missing.');
        throw new Error('Failed to insert bookmark into MySQL DB.');
    }
    await connection.commit();
    console.log('[BookmarkAction][addBookmarkAction] Transaction committed.');
    const newBookmark = {
      id: String(result.insertId),
      ...bookmarkData,
      priority: newPriority,
    };
    console.log('[BookmarkAction][addBookmarkAction] SUCCESS_EXIT - Bookmark added:', newBookmark);
    return newBookmark;

  } catch (error: any) {
    if (connection) {
      console.error('[BookmarkAction][addBookmarkAction] Rolling back transaction due to error.');
      await connection.rollback();
    }
    console.error("[BookmarkAction][addBookmarkAction] ERROR_EXIT - Error adding bookmark. Message:", error.message, error);
    throw error; // Re-throw to be handled by the caller
  } finally {
    if (connection) {
      console.log('[BookmarkAction][addBookmarkAction] Releasing database connection.');
      connection.release();
    }
  }
}

export async function updateBookmarkAction(bookmarkToUpdate: Bookmark): Promise<Bookmark> {
  console.log('[BookmarkAction][updateBookmarkAction] ENTRY - Bookmark to update:', bookmarkToUpdate);
  const { id, name, url, categoryId, description, isPrivate, priority } = bookmarkToUpdate;
  let connection: PoolConnection | null = null;
  try {
    connection = await connectToDatabase();
    console.log('[BookmarkAction][updateBookmarkAction] Database connection obtained.');
    await connection.beginTransaction();
    console.log('[BookmarkAction][updateBookmarkAction] Transaction started.');

    const existingBookmarks = await connection.query<BookmarkRow[]>("SELECT id FROM bookmarks WHERE url = ? AND id != ?", [url, Number(id)]);
    if (existingBookmarks[0].length > 0) {
      console.warn('[BookmarkAction][updateBookmarkAction] Bookmark URL already exists for another bookmark:', url);
      throw new Error('此书签网址已存在于其他书签，请勿重复。');
    }

    await connection.query(
      "UPDATE bookmarks SET name = ?, url = ?, category_id = ?, description = ?, is_private = ?, priority = ? WHERE id = ?",
      [name, url, categoryId === 'default' ? null : Number(categoryId), description || null, isPrivate || false, priority, Number(id)]
    );
    console.log('[BookmarkAction][updateBookmarkAction] Update query executed.');

    await connection.commit();
    console.log('[BookmarkAction][updateBookmarkAction] Transaction committed.');
    console.log('[BookmarkAction][updateBookmarkAction] SUCCESS_EXIT - Bookmark updated:', bookmarkToUpdate);
    return bookmarkToUpdate;
  } catch (error: any) {
    if (connection) {
      console.error('[BookmarkAction][updateBookmarkAction] Rolling back transaction due to error.');
      await connection.rollback();
    }
    console.error("[BookmarkAction][updateBookmarkAction] ERROR_EXIT - Error updating bookmark. Message:", error.message, error);
    throw error;
  } finally {
    if (connection) {
      console.log('[BookmarkAction][updateBookmarkAction] Releasing database connection.');
      connection.release();
    }
  }
}

export async function deleteBookmarkAction(bookmarkId: string): Promise<{ id: string }> {
  console.log('[BookmarkAction][deleteBookmarkAction] ENTRY - Bookmark ID:', bookmarkId);
  let connection: PoolConnection | null = null;
  try {
    connection = await connectToDatabase();
    console.log('[BookmarkAction][deleteBookmarkAction] Database connection obtained.');
    await connection.beginTransaction();
    console.log('[BookmarkAction][deleteBookmarkAction] Transaction started.');

    const result = await connection.query<OkPacket>("DELETE FROM bookmarks WHERE id = ?", [Number(bookmarkId)]);
    console.log('[BookmarkAction][deleteBookmarkAction] Delete query executed. Result:', result);

    if (result[0].affectedRows === 0) {
      console.warn(`[BookmarkAction][deleteBookmarkAction] Bookmark with ID ${bookmarkId} not found for deletion, or already deleted.`);
    }
    await connection.commit();
    console.log('[BookmarkAction][deleteBookmarkAction] Transaction committed.');
    console.log('[BookmarkAction][deleteBookmarkAction] SUCCESS_EXIT - Bookmark deleted. ID:', bookmarkId);
    return { id: bookmarkId };
  } catch (error: any) {
    if (connection) {
      console.error('[BookmarkAction][deleteBookmarkAction] Rolling back transaction due to error.');
      await connection.rollback();
    }
    console.error("[BookmarkAction][deleteBookmarkAction] ERROR_EXIT - Error deleting bookmark. Message:", error.message, error);
    throw error;
  } finally {
    if (connection) {
      console.log('[BookmarkAction][deleteBookmarkAction] Releasing database connection.');
      connection.release();
    }
  }
}

export async function deleteBookmarksByCategoryIdAction(categoryId: string): Promise<{ deletedCount: number }> {
  console.log('[BookmarkAction][deleteBookmarksByCategoryIdAction] ENTRY - Category ID:', categoryId);
  let connection: PoolConnection | null = null;
  try {
    connection = await connectToDatabase();
    console.log('[BookmarkAction][deleteBookmarksByCategoryIdAction] Database connection obtained.');
    await connection.beginTransaction();
    console.log('[BookmarkAction][deleteBookmarksByCategoryIdAction] Transaction started.');

    if (categoryId === 'default' || categoryId === null || categoryId === undefined) {
        console.warn(`[BookmarkAction][deleteBookmarksByCategoryIdAction] Attempted to delete bookmarks for a non-specific category ID: ${categoryId}. No action taken.`);
        console.log('[BookmarkAction][deleteBookmarksByCategoryIdAction] SUCCESS_EXIT - No action taken for non-specific category ID.');
        await connection.commit(); // Commit even if no action, to close transaction
        return { deletedCount: 0 };
    }
    const result = await connection.query<OkPacket>("DELETE FROM bookmarks WHERE category_id = ?", [Number(categoryId)]);
    console.log('[BookmarkAction][deleteBookmarksByCategoryIdAction] Delete by category ID query executed. Result:', result);
    await connection.commit();
    console.log('[BookmarkAction][deleteBookmarksByCategoryIdAction] Transaction committed.');
    console.log(`[BookmarkAction][deleteBookmarksByCategoryIdAction] SUCCESS_EXIT - Deleted ${result[0].affectedRows} bookmarks for category ID ${categoryId}`);
    return { deletedCount: result[0].affectedRows };
  } catch (error: any) {
    if (connection) {
      console.error('[BookmarkAction][deleteBookmarksByCategoryIdAction] Rolling back transaction due to error.');
      await connection.rollback();
    }
    console.error(`[BookmarkAction][deleteBookmarksByCategoryIdAction] ERROR_EXIT - Error deleting bookmarks for category ID ${categoryId}. Message:`, error.message, error);
    throw error;
  } finally {
    if (connection) {
      console.log('[BookmarkAction][deleteBookmarksByCategoryIdAction] Releasing database connection.');
      connection.release();
    }
  }
}

export async function updateBookmarksOrderAction(orderedBookmarkIds: string[]): Promise<{ success: boolean }> {
  console.log('[BookmarkAction][updateBookmarksOrderAction] ENTRY - Ordered IDs:', orderedBookmarkIds);
  if (!orderedBookmarkIds || orderedBookmarkIds.length === 0) {
    console.log('[BookmarkAction][updateBookmarksOrderAction] SUCCESS_EXIT - No order to update.');
    return { success: true };
  }

  let connection: PoolConnection | null = null;
  try {
    connection = await connectToDatabase();
    console.log('[BookmarkAction][updateBookmarksOrderAction] Database connection obtained.');
    await connection.beginTransaction();
    console.log('[BookmarkAction][updateBookmarksOrderAction] Transaction started.');

    const totalItems = orderedBookmarkIds.length;
    // Higher index in orderedBookmarkIds means lower in the list visually.
    // We want lower visual items to have smaller priority numbers, for "ORDER BY priority DESC".
    // So, items at the end of `orderedBookmarkIds` (dragged to bottom) should get smallest `priority`.
    // Items at the start of `orderedBookmarkIds` (dragged to top) should get largest `priority`.
    for (let i = 0; i < totalItems; i++) {
      const bookmarkId = orderedBookmarkIds[i];
      // The priority is `totalItems - 1 - i`.
      // Example: 3 items.
      // Item at index 0 (top of list) gets priority 3-1-0 = 2.
      // Item at index 1 (middle) gets priority 3-1-1 = 1.
      // Item at index 2 (bottom of list) gets priority 3-1-2 = 0.
      // This correctly makes top items have higher priority for "ORDER BY priority DESC".
      const priority = totalItems - 1 - i;
      await connection.query("UPDATE bookmarks SET priority = ? WHERE id = ?", [priority, Number(bookmarkId)]);
    }
    console.log('[BookmarkAction][updateBookmarksOrderAction] Update queries for order executed.');

    await connection.commit();
    console.log('[BookmarkAction][updateBookmarksOrderAction] Transaction committed.');
    console.log('[BookmarkAction][updateBookmarksOrderAction] SUCCESS_EXIT - Bookmarks order updated successfully.');
    return { success: true };
  } catch (error: any) {
    if (connection) {
      console.error('[BookmarkAction][updateBookmarksOrderAction] Rolling back transaction due to error.');
      await connection.rollback();
    }
    console.error("[BookmarkAction][updateBookmarksOrderAction] ERROR_EXIT - Error updating bookmarks order. Message:", error.message, error);
    return { success: false };
  } finally {
    if (connection) {
      console.log('[BookmarkAction][updateBookmarksOrderAction] Releasing database connection.');
      connection.release();
    }
  }
}
