
"use client";

import React, { useState, useEffect } from 'react';
import type { Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react'; // Removed unused icon imports
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { iconMap as globalIconMap, availableIcons as globalAvailableIcons } from './AppSidebar'; 

interface EditCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateCategory: (category: Category) => void;
  categoryToEdit: Category;
}

const EditCategoryDialog: React.FC<EditCategoryDialogProps> = ({
  isOpen,
  onClose,
  onUpdateCategory,
  categoryToEdit,
}) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string>(globalAvailableIcons[0].value);
  const [isPrivate, setIsPrivate] = useState(false);
  const [priority, setPriority] = useState<number>(0); // Added priority state
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && categoryToEdit) {
      setName(categoryToEdit.name);
      setIcon(categoryToEdit.icon || globalAvailableIcons[0].value);
      setIsPrivate(categoryToEdit.isPrivate || false);
      setPriority(categoryToEdit.priority || 0); // Initialize priority
    }
  }, [isOpen, categoryToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "错误", description: "分类名称不能为空。", variant: "destructive" });
      return;
    }
    
    onUpdateCategory({ 
        ...categoryToEdit, 
        name: name.trim(), 
        icon, 
        isPrivate,
        priority: Number(priority) || 0 // Ensure priority is a number
    });
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>编辑分类</DialogTitle>
          <DialogDescription>
            修改分类的详细信息。完成后点击保存。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-cat-name" className="text-right">
                名称*
              </Label>
              <Input
                id="edit-cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="分类名称"
                required
                disabled={categoryToEdit?.name === '通用书签' && categoryToEdit?.icon === 'Folder'} 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-cat-icon" className="text-right">
                图标
              </Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger className="col-span-3 h-9 text-sm">
                  <div className="flex items-center gap-2">
                      {React.createElement(globalIconMap[icon] || globalIconMap['Default'], {className: "h-4 w-4"})}
                      <SelectValue placeholder="选择图标" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-[200px]">
                    {globalAvailableIcons.map(iconItem => (
                      <SelectItem key={iconItem.value} value={iconItem.value} className="text-xs">
                        <div className="flex items-center gap-2">
                          <iconItem.IconComponent className="h-4 w-4" />
                          <span>{iconItem.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-cat-priority" className="text-right">
                权重
              </Label>
              <Input
                id="edit-cat-priority"
                type="number"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value, 10))}
                className="col-span-3"
                placeholder="数字越大越靠前"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-cat-privacyButton" className="text-right">
                可见性
              </Label>
              <div className="col-span-3">
                <Button
                  id="edit-cat-privacyButton"
                  type="button"
                  variant="outline"
                  onClick={() => setIsPrivate(!isPrivate)}
                  className="flex items-center w-full justify-start text-sm h-9"
                  aria-label={isPrivate ? '设为公开分类' : '设为私密分类'}
                  disabled={categoryToEdit?.name === '通用书签' && categoryToEdit?.icon === 'Folder'}
                >
                  {isPrivate ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                  {isPrivate ? '私密 (仅管理员可见)' : '公开 (所有人可见)'}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>取消</Button>
            <Button type="submit">保存更改</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCategoryDialog;

