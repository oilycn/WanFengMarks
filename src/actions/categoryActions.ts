
'use server';

import type { Category } from '@/types';
import { connectToDatabase, query } from '@/lib/mysql';
import type { RowDataPacket, OkPacket, PoolConnection } from 'mysql2/promise';

interface CategoryRow extends RowDataPacket {
  id: number;
  name: string;
  icon: string;
  is_visible: boolean | number;
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
  console.log('[CategoryAction][ensureDefaultCategory] ENTRY');
  const defaultCategoryName = '通用书签';
  const execQuery = connection ? connection.query.bind(connection) : query;
  try {
    const existing = await execQuery<CategoryRow[]>("SELECT id FROM categories WHERE name = ?", [defaultCategoryName]);
    if (existing.length === 0) {
      await execQuery(
        "INSERT INTO categories (name, icon, is_visible, is_private, priority) VALUES (?, ?, ?, ?, ?)",
        [defaultCategoryName, 'Folder', true, false, 1]
      );
      console.log(`[CategoryAction][ensureDefaultCategory] Created default '${defaultCategoryName}' category.`);
    }
    console.log('[CategoryAction][ensureDefaultCategory] SUCCESS_EXIT');
  } catch (error: any) {
    console.error("[CategoryAction][ensureDefaultCategory] ERROR_EXIT - Error ensuring default category. Message:", error.message, error);
  }
}

export async function getCategoriesAction(): Promise<Category[]> {
  console.log('[CategoryAction][getCategoriesAction] ENTRY');
  try {
    await ensureDefaultCategory();
    const rows = await query<CategoryRow[]>("SELECT * FROM categories ORDER BY priority DESC, name ASC");
    const categories = rows.map(mapDbRowToCategory);
    console.log(`[CategoryAction][getCategoriesAction] SUCCESS_EXIT - Fetched ${categories.length} categories.`);
    return categories;
  } catch (error: any) {
    console.error("[CategoryAction][getCategoriesAction] ERROR_EXIT - Error fetching categories. Message:", error.message, error);
    return [{ id: 'default-fallback-mysql', name: '通用书签 (错误)', isVisible: true, icon: 'Folder', isPrivate: false, priority: 0 }];
  }
}

export async function addCategoryAction(name: string, icon?: string, isPrivate?: boolean): Promise<Category> {
  console.log('[CategoryAction][addCategoryAction] ENTRY - Name:', name, 'Icon:', icon, 'IsPrivate:', isPrivate);
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
    const newCategory = {
      id: String(result.insertId),
      name,
      icon: icon || 'Folder',
      isVisible: true,
      isPrivate: isPrivate || false,
      priority: nextPriority,
    };
    console.log('[CategoryAction][addCategoryAction] SUCCESS_EXIT - Category added:', newCategory);
    return newCategory;
  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error("[CategoryAction][addCategoryAction] ERROR_EXIT - Error adding category. Message:", error.message, error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

export async function updateCategoryAction(categoryToUpdate: Category): Promise<Category> {
  console.log('[CategoryAction][updateCategoryAction] ENTRY - Category to update:', categoryToUpdate);
  const { id, name, icon, isVisible, isPrivate, priority } = categoryToUpdate;
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
        // Protect the default "通用书签" category from being renamed or made private if it's the one with icon 'Folder'
        if (currentCategory.name === '通用书签' && currentCategory.icon === 'Folder') {
            if (name && name !== '通用书签') {
                categoryToUpdate.name = '通用书签'; // Force name back
            }
            if (isPrivate === true) {
                categoryToUpdate.isPrivate = false; // Force public
            }
        }
    }

    await query(
      "UPDATE categories SET name = ?, icon = ?, is_visible = ?, is_private = ?, priority = ? WHERE id = ?",
      [categoryToUpdate.name, categoryToUpdate.icon || 'Folder', categoryToUpdate.isVisible, categoryToUpdate.isPrivate || false, priority, id]
    );
    console.log('[CategoryAction][updateCategoryAction] SUCCESS_EXIT - Category updated:', categoryToUpdate);
    return categoryToUpdate;
  } catch (error: any) {
    console.error("[CategoryAction][updateCategoryAction] ERROR_EXIT - Error updating category. Message:", error.message, error);
    throw error;
  }
}

export async function deleteCategoryAction(categoryId: string): Promise<{ id: string }> {
  console.log('[CategoryAction][deleteCategoryAction] ENTRY - Category ID:', categoryId);
  try {
    const categoryToDeleteResult = await query<CategoryRow[]>("SELECT name, icon FROM categories WHERE id = ?", [categoryId]);
    if (categoryToDeleteResult.length > 0) {
        const categoryToDelete = categoryToDeleteResult[0];
        if (categoryToDelete.name === '通用书签' && categoryToDelete.icon === 'Folder') { // Stricter check for default
          throw new Error("The default '通用书签' category cannot be deleted.");
        }
    } else {
        console.warn(`[CategoryAction][deleteCategoryAction] Category with ID ${categoryId} not found for deletion check.`);
    }

    const result = await query<OkPacket>("DELETE FROM categories WHERE id = ?", [categoryId]);
    if (result.affectedRows === 0) {
      console.warn(`[CategoryAction][deleteCategoryAction] Category with ID ${categoryId} not found for deletion, or already deleted.`);
    }

    await ensureDefaultCategory(); // Ensure a default category exists after potential deletion
    console.log('[CategoryAction][deleteCategoryAction] SUCCESS_EXIT - Category deleted (if existed and not default). ID:', categoryId);
    return { id: categoryId };
  } catch (error: any) {
    console.error("[CategoryAction][deleteCategoryAction] ERROR_EXIT - Error deleting category. Message:", error.message, error);
    throw error;
  }
}

export async function updateCategoriesOrderAction(orderedCategoryIds: string[]): Promise<{ success: boolean }> {
  console.log('[CategoryAction][updateCategoriesOrderAction] ENTRY - Ordered IDs:', orderedCategoryIds);
  if (!orderedCategoryIds || orderedCategoryIds.length === 0) {
    console.log('[CategoryAction][updateCategoriesOrderAction] SUCCESS_EXIT - No order to update.');
    return { success: true };
  }

  let connection: PoolConnection | null = null;
  try {
    connection = await connectToDatabase();
    await connection.beginTransaction();

    const totalItems = orderedCategoryIds.length;
    for (let i = 0; i < totalItems; i++) {
      const categoryId = orderedCategoryIds[i];
      const priority = totalItems - 1 - i;
      await connection.query("UPDATE categories SET priority = ? WHERE id = ?", [priority, Number(categoryId)]);
    }

    await connection.commit();
    console.log('[CategoryAction][updateCategoriesOrderAction] SUCCESS_EXIT - Categories order updated successfully.');
    return { success: true };
  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error("[CategoryAction][updateCategoriesOrderAction] ERROR_EXIT - Error updating categories order. Message:", error.message, error);
    return { success: false };
  } finally {
    if (connection) connection.release();
  }
}

    
