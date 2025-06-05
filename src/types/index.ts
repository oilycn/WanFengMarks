export interface Bookmark {
  id: string;
  name: string;
  url: string;
  categoryId: string;
  icon?: string; // Optional: for custom icons or specific Lucide icon names
}

export interface Category {
  id: string;
  name: string;
  isVisible: boolean;
}
