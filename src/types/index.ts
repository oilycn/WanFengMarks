
export interface Bookmark {
  id: string;
  name: string;
  url:string;
  categoryId: string;
  description?: string;
  icon?: string;
  isPrivate?: boolean;
  priority: number;
}

export interface Category {
  id: string;
  name: string;
  isVisible: boolean;
  icon?: string;
  isPrivate?: boolean;
  priority: number;
}
