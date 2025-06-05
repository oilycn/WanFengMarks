
export interface Bookmark {
  id: string;
  name: string;
  url:string;
  categoryId: string;
  description?: string; // 新增副标题/描述字段
  icon?: string; 
}

export interface Category {
  id: string;
  name: string;
  isVisible: boolean;
  icon?: string; // 可选：为分类添加图标 (Lucide icon name)
}
