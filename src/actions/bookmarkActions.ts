
'use server';

import type { Bookmark } from '@/types';
import { connectToDatabase, query } from '@/lib/mysql';
import type { RowDataPacket, OkPacket, PoolConnection } from 'mysql2/promise';
import { unstable_noStore as noStore } from 'next/cache';

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

function mapDbRowToBookmark(row: BookmarkRow): Bookmark {
  return {
    id: String(row.id),
    name: row.name,
    url: row.url,
    categoryId: row.category_id ? String(row.category_id) : 'default',
    description: row.description || '',
    isPrivate: Boolean(row.is_private),
    priority: row.priority || 0,
  };
}

export async function getBookmarksAction(): Promise<Bookmark[]> {
  noStore();
  console.log('Server Action: getBookmarksAction called (MySQL)');
  try {
    const rows = await query<BookmarkRow[]>("SELECT * FROM bookmarks ORDER BY priority DESC, created_at DESC");
    return rows.map(mapDbRowToBookmark);
  } catch (error) {
    console.error("Error fetching bookmarks from MySQL DB:", error);
    return [];
  }
}

export async function addBookmarkAction(bookmarkData: Omit<Bookmark, 'id' | 'priority'>): Promise<Bookmark> {
  noStore();
  console.log('Server Action: addBookmarkAction called with (MySQL):', bookmarkData);
  const { name, url, categoryId, description, isPrivate } = bookmarkData;

  let connection: PoolConnection | null = null;
  try {
    connection = await connectToDatabase();
    await connection.beginTransaction();

    const existingBookmarks = await connection.query<BookmarkRow[]>("SELECT id FROM bookmarks WHERE url = ?", [url]);
    if (existingBookmarks[0].length > 0) {
      throw new Error('此书签网址已存在，请勿重复添加。');
    }

    const [maxPriorityResult] = await connection.query<MaxPriorityRow[]>("SELECT MAX(priority) as max_priority FROM bookmarks");
    const nextPriority = (maxPriorityResult[0]?.max_priority || 0) + 1;

    const [result] = await connection.query<OkPacket>(
      "INSERT INTO bookmarks (name, url, category_id, description, is_private, priority) VALUES (?, ?, ?, ?, ?, ?)",
      [name, url, categoryId === 'default' ? null : Number(categoryId), description || null, isPrivate || false, nextPriority]
    );

    if (!result.insertId) {
        throw new Error('Failed to insert bookmark into MySQL DB.');
    }
    await connection.commit();
    return {
      id: String(result.insertId),
      ...bookmarkData,
      priority: nextPriority,
    };

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error adding bookmark to MySQL DB:", error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

export async function updateBookmarkAction(bookmarkToUpdate: Bookmark): Promise<Bookmark> {
  noStore();
  console.log('Server Action: updateBookmarkAction called with (MySQL):', bookmarkToUpdate);
  const { id, name, url, categoryId, description, isPrivate, priority } = bookmarkToUpdate;
  try {
    const existingBookmarks = await query<BookmarkRow[]>("SELECT id FROM bookmarks WHERE url = ? AND id != ?", [url, Number(id)]);
    if (existingBookmarks.length > 0) {
      throw new Error('此书签网址已存在于其他书签，请勿重复。');
    }

    await query(
      "UPDATE bookmarks SET name = ?, url = ?, category_id = ?, description = ?, is_private = ?, priority = ? WHERE id = ?",
      [name, url, categoryId === 'default' ? null : Number(categoryId), description || null, isPrivate || false, priority, Number(id)]
    );

    return bookmarkToUpdate;
  } catch (error) {
    console.error("Error updating bookmark in MySQL DB:", error);
    throw error;
  }
}

export async function deleteBookmarkAction(bookmarkId: string): Promise<{ id: string }> {
  noStore();
  console.log('Server Action: deleteBookmarkAction called for ID (MySQL):', bookmarkId);
  try {
    const result = await query<OkPacket>("DELETE FROM bookmarks WHERE id = ?", [Number(bookmarkId)]);

    if (result.affectedRows === 0) {
      console.warn(`Bookmark with ID ${bookmarkId} (MySQL) not found for deletion, or already deleted.`);
    }
    return { id: bookmarkId };
  } catch (error) {
    console.error("Error deleting bookmark from MySQL DB:", error);
    throw error;
  }
}

export async function deleteBookmarksByCategoryIdAction(categoryId: string): Promise<{ deletedCount: number }> {
  noStore();
  console.log('Server Action: deleteBookmarksByCategoryIdAction called for category ID (MySQL):', categoryId);
  try {
    if (categoryId === 'default' || categoryId === null || categoryId === undefined) {
        console.warn(`Attempted to delete bookmarks for a non-specific category ID (MySQL): ${categoryId}. No action taken.`);
        return { deletedCount: 0 };
    }
    const result = await query<OkPacket>("DELETE FROM bookmarks WHERE category_id = ?", [Number(categoryId)]);
    console.log(`Deleted ${result.affectedRows} bookmarks for category ID ${categoryId} (MySQL)`);
    return { deletedCount: result.affectedRows };
  } catch (error) {
    console.error(`Error deleting bookmarks for category ID ${categoryId} from MySQL DB:`, error);
    throw error;
  }
}

export async function updateBookmarksOrderAction(orderedBookmarkIds: string[]): Promise<{ success: boolean }> {
  noStore();
  console.log('Server Action: updateBookmarksOrderAction called with (MySQL):', orderedBookmarkIds);
  if (!orderedBookmarkIds || orderedBookmarkIds.length === 0) {
    return { success: true }; // No order to update
  }

  let connection: PoolConnection | null = null;
  try {
    connection = await connectToDatabase();
    await connection.beginTransaction();

    const totalItems = orderedBookmarkIds.length;
    for (let i = 0; i < totalItems; i++) {
      const bookmarkId = orderedBookmarkIds[i];
      const priority = totalItems - 1 - i; // Highest priority for the first item in the array
      await connection.query("UPDATE bookmarks SET priority = ? WHERE id = ?", [priority, Number(bookmarkId)]);
    }

    await connection.commit();
    console.log('Bookmarks order updated successfully.');
    return { success: true };
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error updating bookmarks order in MySQL DB:", error);
    // throw error; // Optionally re-throw or return specific error info
    return { success: false };
  } finally {
    if (connection) connection.release();
  }
}
