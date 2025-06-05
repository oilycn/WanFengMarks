"use client";

import React, { useState } from 'react';
import type { Bookmark, Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface AddBookmarkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBookmark: (bookmark: Omit<Bookmark, 'id'>) => void;
  categories: Category[];
}

const AddBookmarkDialog: React.FC<AddBookmarkDialogProps> = ({
  isOpen,
  onClose,
  onAddBookmark,
  categories,
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [categoryId, setCategoryId] = useState<string>(categories.find(c => c.id === 'default')?.id || categories[0]?.id || '');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim() || !categoryId) {
      toast({ title: "Error", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    // Basic URL validation
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch (_) {
      toast({ title: "Invalid URL", description: "Please enter a valid URL.", variant: "destructive" });
      return;
    }

    onAddBookmark({ name, url: url.startsWith('http') ? url : `https://${url}`, categoryId });
    toast({ title: "Bookmark Added", description: `"${name}" has been added.` });
    setName('');
    setUrl('');
    // setCategoryId(categories[0]?.id || ''); // Reset to first category or default
    onClose();
  };
  
  React.useEffect(() => {
    if (isOpen && (categories.length > 0 && !categoryId)) {
         setCategoryId(categories.find(c => c.id === 'default')?.id || categories[0]?.id || '');
    }
  }, [isOpen, categories, categoryId]);


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Bookmark</DialogTitle>
          <DialogDescription>
            Enter the details for your new bookmark. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Google News"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="url" className="text-right">
                URL
              </Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="col-span-3"
                placeholder="e.g., https://news.google.com"
                type="url"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a category" />
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
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Bookmark</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddBookmarkDialog;
