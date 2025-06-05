
'use server';

import type { Category } from '@/types';
import { connectToDatabase, query } from '@/lib/mysql';
import type { RowDataPacket, OkPacket, PoolConnection } from 'mysql2/promise';
import { unstable_noStore as noStore } from 'next/cache';

interface CategoryRow extends RowDataPacket {
  id: number;
  name: string;
  icon: string;
  is_visible: boolean | number; // MySQL BOOLEAN can be 0 or 1
  is_private: boolean | number;
  priority: number;
}

interface MaxPriorityRow extends RowDataPacket {
  max_priority: number | null;
}

function mapDbRowToCategory(row: CategoryRow): Category {
  return {
    id: String(row.id),
    name: row.name,
    icon: row.icon || 'Folder',
    isVisible: Boolean(row.is_visible),
    isPrivate: Boolean(row.is_private),
    priority: row.priority || 0,
  };
}

async function ensureDefaultCategory(connection?: PoolConnection) {
  noStore();
  const defaultCategoryName = '通用书签';
  const execQuery = connection ? connection.query.bind(connection) : query;
  try {
    const existing = await execQuery<CategoryRow[]>("SELECT id FROM categories WHERE name = ?", [defaultCategoryName]);
    if (existing.length === 0) {
      await execQuery(
        "INSERT INTO categories (name, icon, is_visible, is_private, priority) VALUES (?, ?, ?, ?, ?)",
        [defaultCategoryName, 'Folder', true, false, 1] // Default category gets priority 1
      );
      console.log(`Created default '${defaultCategoryName}' category in MySQL DB with priority 1.`);
    }
  } catch (error) {
    console.error("Error ensuring default category in MySQL:", error);
  }
}

export async function getCategoriesAction(): Promise<Category[]> {
  noStore();
  console.log('Server Action: getCategoriesAction called (MySQL)');
  try {
    await ensureDefaultCategory();
    const rows = await query<CategoryRow[]>("SELECT * FROM categories ORDER BY priority DESC, name ASC");
    return rows.map(mapDbRowToCategory);
  } catch (error) {
    console.error("Error fetching categories from MySQL DB:", error);
    return [{ id: 'default-fallback-mysql', name: '通用书签 (错误)', isVisible: true, icon: 'Folder', isPrivate: false, priority: 0 }];
  }
}

export async function addCategoryAction(name: string, icon?: string, isPrivate?: boolean): Promise<Category> {
  noStore();
  console.log('Server Action: addCategoryAction called with (MySQL):', { name, icon, isPrivate });
  let connection: PoolConnection | null = null;
  try {
    connection = await connectToDatabase();
    await connection.beginTransaction();

    const existingCategory = await connection.query<CategoryRow[]>("SELECT id FROM categories WHERE name = ?", [name]);
    if (existingCategory[0].length > 0) {
      throw new Error('Category name already exists');
    }

    const [maxPriorityResult] = await connection.query<MaxPriorityRow[]>("SELECT MAX(priority) as max_priority FROM categories");
    const nextPriority = (maxPriorityResult[0]?.max_priority || 0) + 1;

    const [result] = await connection.query<OkPacket>(
      "INSERT INTO categories (name, icon, is_visible, is_private, priority) VALUES (?, ?, ?, ?, ?)",
      [name, icon || 'Folder', true, isPrivate || false, nextPriority]
    );

    if (!result.insertId) {
        throw new Error('Failed to insert category into MySQL DB.');
    }
    await connection.commit();
    return {
      id: String(result.insertId),
      name,
      icon: icon || 'Folder',
      isVisible: true,
      isPrivate: isPrivate || false,
      priority: nextPriority,
    };
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error adding category to MySQL DB:", error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

export async function updateCategoryAction(categoryToUpdate: Category): Promise<Category> {
  noStore();
  console.log('Server Action: updateCategoryAction called with (MySQL):', categoryToUpdate);
  const { id, name, icon, isVisible, isPrivate, priority } = categoryToUpdate; // priority included
  try {
    if (name) {
        const existingCategoryWithSameName = await query<CategoryRow[]>(
            "SELECT id FROM categories WHERE name = ? AND id != ?",
            [name, id]
        );
        if (existingCategoryWithSameName.length > 0) {
            throw new Error('Another category with this name already exists');
        }
    }

    const currentCategoryResult = await query<CategoryRow[]>("SELECT name, icon FROM categories WHERE id = ?", [id]);
    if (currentCategoryResult.length > 0) {
        const currentCategory = currentCategoryResult[0];
        if (currentCategory.name === '通用书签' && currentCategory.icon === 'Folder') {
            if (name && name !== '通用书签') {
                categoryToUpdate.name = '通用书签';
            }
            if (isPrivate === true) {
                categoryToUpdate.isPrivate = false;
            }
        }
    }

    await query(
      "UPDATE categories SET name = ?, icon = ?, is_visible = ?, is_private = ?, priority = ? WHERE id = ?",
      [categoryToUpdate.name, categoryToUpdate.icon || 'Folder', categoryToUpdate.isVisible, categoryToUpdate.isPrivate || false, priority, id]
    );

    return categoryToUpdate;
  } catch (error) {
    console.error("Error updating category in MySQL DB:", error);
    throw error;
  }
}

export async function deleteCategoryAction(categoryId: string): Promise<{ id: string }> {
  noStore();
  console.log('Server Action: deleteCategoryAction called for ID (MySQL):', categoryId);
  try {
    const categoryToDeleteResult = await query<CategoryRow[]>("SELECT name, icon FROM categories WHERE id = ?", [categoryId]);
    if (categoryToDeleteResult.length > 0) {
        const categoryToDelete = categoryToDeleteResult[0];
        if (categoryToDelete.name === '通用书签' && categoryToDelete.icon === 'Folder') {
          throw new Error("The '通用书签' (default) category cannot be deleted.");
        }
    }

    const result = await query<OkPacket>("DELETE FROM categories WHERE id = ?", [categoryId]);
    if (result.affectedRows === 0) {
      console.warn(`Category with ID ${categoryId} (MySQL) not found for deletion, or already deleted.`);
    }

    await ensureDefaultCategory();

    return { id: categoryId };
  } catch (error) {
    console.error("Error deleting category from MySQL DB:", error);
    throw error;
  }
}

export async function updateCategoriesOrderAction(orderedCategoryIds: string[]): Promise<{ success: boolean }> {
  noStore();
  console.log('Server Action: updateCategoriesOrderAction called with (MySQL):', orderedCategoryIds);
  if (!orderedCategoryIds || orderedCategoryIds.length === 0) {
    return { success: true }; // No order to update
  }

  let connection: PoolConnection | null = null;
  try {
    connection = await connectToDatabase();
    await connection.beginTransaction();

    const totalItems = orderedCategoryIds.length;
    for (let i = 0; i < totalItems; i++) {
      const categoryId = orderedCategoryIds[i];
      const priority = totalItems - 1 - i; // Highest priority for the first item in the array
      await connection.query("UPDATE categories SET priority = ? WHERE id = ?", [priority, Number(categoryId)]);
    }

    await connection.commit();
    console.log('Categories order updated successfully.');
    return { success: true };
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error updating categories order in MySQL DB:", error);
    // throw error; // Optionally re-throw or return specific error info
    return { success: false };
  } finally {
    if (connection) connection.release();
  }
}
