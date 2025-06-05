
"use client";

import React, { useState, useEffect } from 'react';
import type { Bookmark, Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Eye, EyeOff } from 'lucide-react';
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

interface EditBookmarkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateBookmark: (bookmark: Bookmark) => void;
  bookmarkToEdit: Bookmark;
  categories: Category[];
}

const EditBookmarkDialog: React.FC<EditBookmarkDialogProps> = ({
  isOpen,
  onClose,
  onUpdateBookmark,
  bookmarkToEdit,
  categories,
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [isPrivate, setIsPrivate] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && bookmarkToEdit) {
      setName(bookmarkToEdit.name);
      setUrl(bookmarkToEdit.url);
      setDescription(bookmarkToEdit.description || '');
      setCategoryId(bookmarkToEdit.categoryId);
      setIsPrivate(bookmarkToEdit.isPrivate || false);
    }
  }, [isOpen, bookmarkToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim() || !categoryId) {
      toast({ title: "错误", description: "名称、网址和分类为必填项。", variant: "destructive" });
      return;
    }
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch (_) {
      toast({ title: "无效的URL", description: "请输入有效的URL。", variant: "destructive" });
      return;
    }

    onUpdateBookmark({ 
        ...bookmarkToEdit, 
        name, 
        url: url.startsWith('http') ? url : `https://${url}`, 
        categoryId, 
        description, 
        isPrivate 
    });
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>编辑书签</DialogTitle>
          <DialogDescription>
            修改书签的详细信息。完成后点击保存。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                名称*
              </Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="例如：谷歌新闻"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-url" className="text-right">
                网址*
              </Label>
              <Input
                id="edit-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="col-span-3"
                placeholder="例如：https://news.google.com"
                type="url"
                required
              />
            </div>
             <div className="grid grid-cols-4 items-start gap-4"> 
              <Label htmlFor="edit-description" className="text-right pt-2"> 
                描述
              </Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                placeholder="可选的网站描述或副标题"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-category" className="text-right">
                分类*
              </Label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="选择一个分类" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-privacyButton" className="text-right">
                可见性
              </Label>
              <div className="col-span-3">
                <Button
                  id="edit-privacyButton"
                  type="button"
                  variant="outline"
                  onClick={() => setIsPrivate(!isPrivate)}
                  className="flex items-center w-full justify-start text-sm"
                  aria-label={isPrivate ? '设为公开书签' : '设为私密书签'}
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

export default EditBookmarkDialog;
