
'use server';

import type { Category } from '@/types';

// --- In-memory store (for demonstration - will reset on server restart) ---
let serverCategories: Category[] = [
  { id: 'default', name: '通用书签', isVisible: true, icon: 'Folder', isPrivate: false },
  { id: 'news', name: '新闻资讯', isVisible: true, icon: 'Newspaper', isPrivate: false },
  { id: 'dev', name: '开发工具', isVisible: true, icon: 'Wrench', isPrivate: false },
  { id: 'entertainment', name: '影音娱乐', isVisible: true, icon: 'Film', isPrivate: true }, // Example private
];
// --- End in-memory store ---

// Simulate network delay
const simulateDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

export async function getCategoriesAction(): Promise<Category[]> {
  console.log('Server Action: getCategoriesAction called');
  await simulateDelay();
  return JSON.parse(JSON.stringify(serverCategories));
}

export async function addCategoryAction(name: string, icon?: string, isPrivate?: boolean): Promise<Category> {
  console.log('Server Action: addCategoryAction called with:', { name, icon, isPrivate });
  await simulateDelay();
  
  if (serverCategories.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
    throw new Error('Category name already exists');
  }

  const newCategory: Category = {
    id: Date.now().toString() + Math.random().toString(36).substring(2, 9), // Server generates ID
    name,
    icon: icon || 'Folder',
    isVisible: true, // New categories are visible by default
    isPrivate: isPrivate || false,
  };
  serverCategories.push(newCategory);
  return JSON.parse(JSON.stringify(newCategory));
}

export async function updateCategoryAction(categoryToUpdate: Category): Promise<Category> {
  console.log('Server Action: updateCategoryAction called with:', categoryToUpdate);
  await simulateDelay();

  if (serverCategories.some(cat => cat.id !== categoryToUpdate.id && cat.name.toLowerCase() === categoryToUpdate.name.toLowerCase())) {
    throw new Error('Another category with this name already exists');
  }

  const index = serverCategories.findIndex(cat => cat.id === categoryToUpdate.id);
  if (index !== -1) {
    // 'default' category's name and privacy cannot be changed on the client, enforce server-side too for placeholder
    if (serverCategories[index].id === 'default') {
        categoryToUpdate.name = serverCategories[index].name; // Keep original name
        categoryToUpdate.isPrivate = false; // Default is always public
    }
    serverCategories[index] = {
        ...categoryToUpdate,
        icon: categoryToUpdate.icon || 'Folder',
        isPrivate: categoryToUpdate.isPrivate || false,
    };
    return JSON.parse(JSON.stringify(serverCategories[index]));
  }
  throw new Error('Category not found for update');
}

export async function deleteCategoryAction(categoryId: string): Promise<{ id: string }> {
  console.log('Server Action: deleteCategoryAction called for ID:', categoryId);
  
  if (categoryId === 'default') {
    throw new Error("The 'default' category cannot be deleted.");
  }
  await simulateDelay();
  const initialLength = serverCategories.length;
  serverCategories = serverCategories.filter(cat => cat.id !== categoryId);
  if (serverCategories.length === initialLength) {
    // throw new Error('Category not found for deletion'); // Or just succeed silently
    console.warn(`Category with ID ${categoryId} not found for deletion, but operation considered successful.`);
  }
  // Ensure 'default' category always exists (if accidentally removed or during init)
  if (!serverCategories.some(cat => cat.id === 'default')) {
    serverCategories.unshift({ id: 'default', name: '通用书签', isVisible: true, icon: 'Folder', isPrivate: false });
  }
  return { id: categoryId };
}

// Helper to ensure default category on server start (if needed, typically DB handles this)
if (!serverCategories.find(c => c.id === 'default')) {
    serverCategories.unshift({ id: 'default', name: '通用书签', isVisible: true, icon: 'Folder', isPrivate: false });
}
