
'use server';

import type { Bookmark } from '@/types';
import { connectToDatabase, query } from '@/lib/mysql';
import type { RowDataPacket, OkPacket } from 'mysql2';
import { unstable_noStore as noStore } from 'next/cache';

interface BookmarkRow extends RowDataPacket {
  id: number;
  name: string;
  url: string;
  category_id: number | null; // Can be null if category is deleted and ON DELETE SET NULL
  description: string | null;
  is_private: boolean | number;
}

function mapDbRowToBookmark(row: BookmarkRow): Bookmark {
  return {
    id: String(row.id),
    name: row.name,
    url: row.url,
    categoryId: row.category_id ? String(row.category_id) : 'default', // Fallback to a default if category_id is null
    description: row.description || '',
    isPrivate: Boolean(row.is_private),
    // icon: row.icon, // Icons are usually derived or fetched, not stored directly for bookmarks in this schema
  };
}


export async function getBookmarksAction(): Promise<Bookmark[]> {
  noStore();
  console.log('Server Action: getBookmarksAction called (MySQL)');
  try {
    const rows = await query<BookmarkRow[]>("SELECT * FROM bookmarks ORDER BY created_at DESC");
    return rows.map(mapDbRowToBookmark);
  } catch (error) {
    console.error("Error fetching bookmarks from MySQL DB:", error);
    return [];
  }
}

export async function addBookmarkAction(bookmarkData: Omit<Bookmark, 'id'>): Promise<Bookmark> {
  noStore();
  console.log('Server Action: addBookmarkAction called with (MySQL):', bookmarkData);
  const { name, url, categoryId, description, isPrivate } = bookmarkData;

  // Check for duplicate URL
  try {
    const existingBookmarks = await query<BookmarkRow[]>("SELECT id FROM bookmarks WHERE url = ?", [url]);
    if (existingBookmarks.length > 0) {
      console.warn(`Attempt to add duplicate bookmark URL (MySQL): ${url}`);
      throw new Error('此书签网址已存在，请勿重复添加。');
    }

    const result = await query<OkPacket>(
      "INSERT INTO bookmarks (name, url, category_id, description, is_private) VALUES (?, ?, ?, ?, ?)",
      [name, url, categoryId === 'default' ? null : Number(categoryId), description || null, isPrivate || false]
    );

    if (!result.insertId) {
        throw new Error('Failed to insert bookmark into MySQL DB.');
    }

    return {
      id: String(result.insertId),
      ...bookmarkData
    };

  } catch (error) {
    console.error("Error adding bookmark to MySQL DB:", error);
    throw error;
  }
}

export async function updateBookmarkAction(bookmarkToUpdate: Bookmark): Promise<Bookmark> {
  noStore();
  console.log('Server Action: updateBookmarkAction called with (MySQL):', bookmarkToUpdate);
  const { id, name, url, categoryId, description, isPrivate } = bookmarkToUpdate;
  try {
    // Check if URL is being changed to an existing one (excluding the current bookmark)
    const existingBookmarks = await query<BookmarkRow[]>("SELECT id FROM bookmarks WHERE url = ? AND id != ?", [url, Number(id)]);
    if (existingBookmarks.length > 0) {
      console.warn(`Attempt to update bookmark to a duplicate URL (MySQL): ${url}`);
      throw new Error('此书签网址已存在于其他书签，请勿重复。');
    }

    await query(
      "UPDATE bookmarks SET name = ?, url = ?, category_id = ?, description = ?, is_private = ? WHERE id = ?",
      [name, url, categoryId === 'default' ? null : Number(categoryId), description || null, isPrivate || false, Number(id)]
    );

    return bookmarkToUpdate; // Return the updated object as passed in, assuming success
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
