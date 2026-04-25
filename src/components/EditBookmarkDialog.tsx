
"use client";

import React, { useState, useEffect } from 'react';
import type { Bookmark, Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Eye, EyeOff, UploadCloud } from 'lucide-react';
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
  onUpdateBookmark: (bookmark: Bookmark) => void | Promise<void>;
  bookmarkToEdit: Bookmark;
  categories: Category[];
}

const getFullUrlWithScheme = (value: string): string => {
  if (!value.startsWith('http://') && !value.startsWith('https://')) {
    return `https://${value}`;
  }
  return value;
};

const getDefaultSiteIconUrl = (bookmarkUrl: string): string => {
  try {
    const parsed = new URL(getFullUrlWithScheme(bookmarkUrl));
    const hostWithPort = parsed.host.replace(/^www\./, '');
    const scheme = parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.protocol : 'https:';
    return `${scheme}//${hostWithPort}/favicon.ico`;
  } catch {
    return '';
  }
};

const getDuckDuckGoIconUrl = (bookmarkUrl: string): string => {
  try {
    const hostWithPort = new URL(getFullUrlWithScheme(bookmarkUrl)).host.replace(/^www\./, '');
    return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(hostWithPort)}.ico`;
  } catch {
    return '';
  }
};

const canLoadImage = (src: string, timeoutMs = 2500): Promise<boolean> =>
  new Promise((resolve) => {
    if (!src) {
      resolve(false);
      return;
    }
    const img = new Image();
    let settled = false;

    const finalize = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      img.onload = null;
      img.onerror = null;
      resolve(ok);
    };

    const timer = window.setTimeout(() => finalize(false), timeoutMs);
    img.onload = () => finalize(true);
    img.onerror = () => finalize(false);
    img.src = src;
  });

const resolvePreferredDefaultIconUrl = async (bookmarkUrl: string): Promise<string> => {
  const siteIcon = getDefaultSiteIconUrl(bookmarkUrl);
  const duckIcon = getDuckDuckGoIconUrl(bookmarkUrl);
  if (!siteIcon) {
    return duckIcon;
  }
  const siteOk = await canLoadImage(siteIcon);
  return siteOk ? siteIcon : (duckIcon || siteIcon);
};

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
  const [iconUrl, setIconUrl] = useState('');
  const [autoSuggestedIconUrl, setAutoSuggestedIconUrl] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isAutoUploadingIcon, setIsAutoUploadingIcon] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && bookmarkToEdit) {
      setName(bookmarkToEdit.name);
      setUrl(bookmarkToEdit.url);
      setDescription(bookmarkToEdit.description || '');
      const fallbackSiteIcon = getDefaultSiteIconUrl(bookmarkToEdit.url);
      setAutoSuggestedIconUrl(fallbackSiteIcon);
      setIconUrl(bookmarkToEdit.iconUrl || bookmarkToEdit.icon || fallbackSiteIcon);
      setCategoryId(bookmarkToEdit.categoryId);
      setIsPrivate(bookmarkToEdit.isPrivate || false);
      setIsAutoUploadingIcon(false);
    }
  }, [isOpen, bookmarkToEdit]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const shouldAutoFollow = !iconUrl || iconUrl === autoSuggestedIconUrl;

    const updateDefaultIcon = async () => {
      const nextSuggested = await resolvePreferredDefaultIconUrl(url);
      if (!nextSuggested || cancelled) return;
      setAutoSuggestedIconUrl(nextSuggested);
      if (shouldAutoFollow) {
        setIconUrl(nextSuggested);
      }
    };

    void updateDefaultIcon();
    return () => {
      cancelled = true;
    };
  }, [url, isOpen]);

  const handleUploadToWechatIcon = async () => {
    if (!name.trim() || !url.trim() || !categoryId) {
      toast({ title: "缺少必要信息", description: "请先填写名称、网址和分类。", variant: "destructive" });
      return;
    }
    let normalizedUrl = '';
    try {
      normalizedUrl = getFullUrlWithScheme(url.trim());
      new URL(normalizedUrl);
    } catch {
      toast({ title: "无效的URL", description: "请先填写有效的网址。", variant: "destructive" });
      return;
    }

    setIsAutoUploadingIcon(true);
    try {
      const response = await fetch('/api/icon-auto-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: normalizedUrl,
          iconUrl: iconUrl.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || '上传失败');
      }
      if (!data?.url || typeof data.url !== 'string') {
        throw new Error('上传成功但未返回可用 URL');
      }

      setIconUrl(data.url);
      setAutoSuggestedIconUrl('');
      await Promise.resolve(onUpdateBookmark({
        ...bookmarkToEdit,
        name: name.trim(),
        url: normalizedUrl,
        categoryId,
        description: description.trim(),
        iconUrl: data.url,
        icon: data.url,
        isPrivate,
      }));
    } catch (error: any) {
      toast({ title: "上传失败", description: error?.message || '自动上传图标失败。', variant: "destructive" });
    } finally {
      setIsAutoUploadingIcon(false);
    }
  };

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
    if (iconUrl.trim()) {
      try {
        new URL(iconUrl.trim());
      } catch (_) {
        toast({ title: "无效的图标URL", description: "请输入有效的图标 URL。", variant: "destructive" });
        return;
      }
    }

    onUpdateBookmark({ 
        ...bookmarkToEdit, 
        name: name.trim(), 
        url: url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`, 
        categoryId, 
        description: description.trim(),
        iconUrl: iconUrl.trim() || undefined,
        icon: iconUrl.trim() || undefined,
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
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="edit-icon-url" className="text-right pt-2">
                图标 URL
              </Label>
              <div className="col-span-3 space-y-2">
                <Input
                  id="edit-icon-url"
                  value={iconUrl}
                  onChange={(e) => setIconUrl(e.target.value)}
                  className="w-full"
                  placeholder="可选。留空则按书签网址自动抓取并上传图标"
                  type="url"
                  disabled={isAutoUploadingIcon}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUploadToWechatIcon}
                  disabled={isAutoUploadingIcon || !url.trim()}
                  className="w-full justify-center text-xs"
                >
                  <UploadCloud className="mr-1.5 h-3.5 w-3.5" />
                  {isAutoUploadingIcon ? '上传并保存中...' : '上传企业微信图床并保存'}
                </Button>
                <p className="text-xs text-muted-foreground">默认优先 `当前站点/favicon.ico`，若加载失败会自动切到 DuckDuckGo；上传后会改为数据库里的企业微信 URL。</p>
              </div>
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
            <Button type="button" variant="outline" onClick={onClose} disabled={isAutoUploadingIcon}>取消</Button>
            <Button type="submit" disabled={isAutoUploadingIcon}>保存更改</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditBookmarkDialog;
