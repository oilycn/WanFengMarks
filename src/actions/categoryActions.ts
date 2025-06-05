
'use server';

import type { Category } from '@/types';
import { connectToDatabase, query } from '@/lib/mysql';
import type { RowDataPacket, OkPacket } from 'mysql2';
import { unstable_noStore as noStore } from 'next/cache';

interface CategoryRow extends RowDataPacket {
  id: number;
  name: string;
  icon: string;
  is_visible: boolean | number; // MySQL BOOLEAN can be 0 or 1
  is_private: boolean | number;
}

function mapDbRowToCategory(row: CategoryRow): Category {
  return {
    id: String(row.id),
    name: row.name,
    icon: row.icon || 'Folder',
    isVisible: Boolean(row.is_visible),
    isPrivate: Boolean(row.is_private),
  };
}

async function ensureDefaultCategory() {
  noStore();
  const defaultCategoryName = '通用书签';
  try {
    const existing = await query<CategoryRow[]>("SELECT id FROM categories WHERE name = ?", [defaultCategoryName]);
    if (existing.length === 0) {
      await query(
        "INSERT INTO categories (name, icon, is_visible, is_private) VALUES (?, ?, ?, ?)",
        [defaultCategoryName, 'Folder', true, false]
      );
      console.log(`Created default '${defaultCategoryName}' category in MySQL DB.`);
    }
  } catch (error) {
    console.error("Error ensuring default category in MySQL:", error);
    // If table doesn't exist yet, this might fail.
    // It should be created by the user manually as per instructions in mysql.ts
  }
}

export async function getCategoriesAction(): Promise<Category[]> {
  noStore();
  console.log('Server Action: getCategoriesAction called (MySQL)');
  try {
    await ensureDefaultCategory(); // Ensure default category exists
    const rows = await query<CategoryRow[]>("SELECT * FROM categories ORDER BY name ASC");
    return rows.map(mapDbRowToCategory);
  } catch (error) {
    console.error("Error fetching categories from MySQL DB:", error);
    // Attempt to return a minimal default if DB fails
    return [{ id: 'default-fallback-mysql', name: '通用书签 (错误)', isVisible: true, icon: 'Folder', isPrivate: false }];
  }
}

export async function addCategoryAction(name: string, icon?: string, isPrivate?: boolean): Promise<Category> {
  noStore();
  console.log('Server Action: addCategoryAction called with (MySQL):', { name, icon, isPrivate });
  try {
    const existingCategory = await query<CategoryRow[]>("SELECT id FROM categories WHERE name = ?", [name]);
    if (existingCategory.length > 0) {
      throw new Error('Category name already exists');
    }

    const result = await query<OkPacket>(
      "INSERT INTO categories (name, icon, is_visible, is_private) VALUES (?, ?, ?, ?)",
      [name, icon || 'Folder', true, isPrivate || false]
    );
    
    if (!result.insertId) {
        throw new Error('Failed to insert category into MySQL DB.');
    }
    
    return {
      id: String(result.insertId),
      name,
      icon: icon || 'Folder',
      isVisible: true,
      isPrivate: isPrivate || false,
    };
  } catch (error) {
    console.error("Error adding category to MySQL DB:", error);
    throw error; 
  }
}

export async function updateCategoryAction(categoryToUpdate: Category): Promise<Category> {
  noStore();
  console.log('Server Action: updateCategoryAction called with (MySQL):', categoryToUpdate);
  const { id, name, icon, isVisible, isPrivate } = categoryToUpdate;
  try {
    // Check for name collision if name is being changed
    if (name) {
        const existingCategoryWithSameName = await query<CategoryRow[]>(
            "SELECT id FROM categories WHERE name = ? AND id != ?",
            [name, id]
        );
        if (existingCategoryWithSameName.length > 0) {
            throw new Error('Another category with this name already exists');
        }
    }
    
    // Prevent changing name or privacy of '通用书签' category
    const currentCategoryResult = await query<CategoryRow[]>("SELECT name, icon FROM categories WHERE id = ?", [id]);
    if (currentCategoryResult.length > 0) {
        const currentCategory = currentCategoryResult[0];
        if (currentCategory.name === '通用书签' && currentCategory.icon === 'Folder') {
            if (name && name !== '通用书签') {
                console.warn("Attempt to change name of '通用书签' category (MySQL) blocked.");
                categoryToUpdate.name = '通用书签'; // Revert name change
            }
            if (isPrivate === true) {
                console.warn("Attempt to make '通用书签' category private (MySQL) blocked.");
                categoryToUpdate.isPrivate = false; // Revert privacy change
            }
        }
    }

    await query(
      "UPDATE categories SET name = ?, icon = ?, is_visible = ?, is_private = ? WHERE id = ?",
      [categoryToUpdate.name, categoryToUpdate.icon || 'Folder', categoryToUpdate.isVisible, categoryToUpdate.isPrivate || false, id]
    );
    
    return categoryToUpdate; // Return the updated object as passed in, assuming success
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

    // Bookmarks associated with this category will be handled by ON DELETE SET NULL (or ON DELETE CASCADE) in DB schema
    // Or could be explicitly updated here to move to a default category before deleting.
    // For now, relying on DB constraint. The `deleteBookmarksByCategoryIdAction` in `bookmarkActions.ts` is more explicit.

    const result = await query<OkPacket>("DELETE FROM categories WHERE id = ?", [categoryId]);
    if (result.affectedRows === 0) {
      console.warn(`Category with ID ${categoryId} (MySQL) not found for deletion, or already deleted.`);
    }
    
    await ensureDefaultCategory(); // Ensure default category still exists or is recreated if somehow deleted

    return { id: categoryId };
  } catch (error) {
    console.error("Error deleting category from MySQL DB:", error);
    throw error;
  }
}
