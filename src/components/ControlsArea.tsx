
"use client";

import React from 'react';
import type { Category } from '@/types';
import CategoryControls from './CategoryControls';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

interface ControlsAreaProps {
  categories: Category[];
  onAddCategory: (name: string) => void;
  onToggleVisibility: (id: string) => void;
  onDeleteCategory: (id: string) => void;
  onOpenAddBookmarkDialog: () => void;
}

const ControlsArea: React.FC<ControlsAreaProps> = ({
  categories,
  onAddCategory,
  onToggleVisibility,
  onDeleteCategory,
  onOpenAddBookmarkDialog,
}) => {
  return (
    <section className="flex flex-col md:flex-row items-start gap-4">
      <CategoryControls
        categories={categories}
        onAddCategory={onAddCategory}
        onToggleVisibility={onToggleVisibility}
        onDeleteCategory={onDeleteCategory}
      />
      <Button onClick={onOpenAddBookmarkDialog} variant="default" size="default" className="shadow-sm self-start md:self-start mt-0 md:mt-1.5"> 
        <PlusCircle className="mr-2 h-4 w-4" /> 添加新书签
      </Button>
    </section>
  );
};

export default ControlsArea;
