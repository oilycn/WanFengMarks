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
    <section className="flex flex-col md:flex-row items-start gap-6 mb-6 md:mb-8">
      <CategoryControls
        categories={categories}
        onAddCategory={onAddCategory}
        onToggleVisibility={onToggleVisibility}
        onDeleteCategory={onDeleteCategory}
      />
      <Button onClick={onOpenAddBookmarkDialog} variant="default" size="lg" className="shadow-md self-start md:self-auto md:mt-[52px]"> {/* Approx CardHeader height + padding */}
        <PlusCircle className="mr-2 h-5 w-5" /> 添加新书签
      </Button>
    </section>
  );
};

export default ControlsArea;
