
"use client";

import React, { useState } from 'react';
import type { Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label'; // Label might not be needed for the new button style
import { PlusCircle, Trash2, LogIn, Folder, Briefcase, BookOpen, Film, Gamepad2, GraduationCap, Headphones, Heart, Home, Image, Lightbulb, List, Lock, MapPin, MessageSquare, Music, Newspaper, Package, Palette, Plane, PlayCircle, Save, ShoppingBag, ShoppingCart, Smartphone, Sparkles, Star, ThumbsUp, PenTool, TrendingUp, Tv2, User, Video, Wallet, Wrench, Youtube, Zap, Settings, GripVertical, Settings2, Eye, EyeOff, PenLine } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";

export const availableIcons: { name: string; value: string; IconComponent: React.ElementType }[] = [
  { name: '文件夹', value: 'Folder', IconComponent: Folder },
  { name: '公文包', value: 'Briefcase', IconComponent: Briefcase },
  { name: '书本', value: 'BookOpen', IconComponent: BookOpen },
  { name: '电影', value: 'Film', IconComponent: Film },
  { name: '游戏', value: 'Gamepad2', IconComponent: Gamepad2 },
  { name: '毕业帽', value: 'GraduationCap', IconComponent: GraduationCap },
  { name: '耳机', value: 'Headphones', IconComponent: Headphones },
  { name: '爱心', value: 'Heart', IconComponent: Heart },
  { name: '主页', value: 'Home', IconComponent: Home },
  { name: '图片', value: 'Image', IconComponent: Image },
  { name: '灯泡', value: 'Lightbulb', IconComponent: Lightbulb },
  { name: '列表', value: 'List', IconComponent: List },
  { name: '锁', value: 'Lock', IconComponent: Lock },
  { name: '地图钉', value: 'MapPin', IconComponent: MapPin },
  { name: '消息', value: 'MessageSquare', IconComponent: MessageSquare },
  { name: '音乐', value: 'Music', IconComponent: Music },
  { name: '报纸', value: 'Newspaper', IconComponent: Newspaper },
  { name: '包裹', value: 'Package', IconComponent: Package },
  { name: '调色板', value: 'Palette', IconComponent: Palette },
  { name: '飞机', value: 'Plane', IconComponent: Plane },
  { name: '播放', value: 'PlayCircle', IconComponent: PlayCircle },
  { name: '保存', value: 'Save', IconComponent: Save },
  { name: '购物袋', value: 'ShoppingBag', IconComponent: ShoppingBag },
  { name: '购物车', value: 'ShoppingCart', IconComponent: ShoppingCart },
  { name: '手机', value: 'Smartphone', IconComponent: Smartphone },
  { name: '闪光', value: 'Sparkles', IconComponent: Sparkles },
  { name: '星星', value: 'Star', IconComponent: Star },
  { name: '点赞', value: 'ThumbsUp', IconComponent: ThumbsUp },
  { name: '钢笔工具', value: 'PenTool', IconComponent: PenTool },
  { name: '趋势', value: 'TrendingUp', IconComponent: TrendingUp },
  { name: '电视', value: 'Tv2', IconComponent: Tv2 },
  { name: '用户', value: 'User', IconComponent: User },
  { name: '视频', value: 'Video', IconComponent: Video },
  { name: '钱包', value: 'Wallet', IconComponent: Wallet },
  { name: '扳手', value: 'Wrench', IconComponent: Wrench },
  { name: 'YouTube', value: 'Youtube', IconComponent: Youtube },
  { name: '闪电', value: 'Zap', IconComponent: Zap },
  { name: '设置', value: 'Settings', IconComponent: Settings },
  { name: '拖动点', value: 'GripVertical', IconComponent: GripVertical },
  { name: '齿轮', value: 'Settings2', IconComponent: Settings2 },
  { name: '眼睛', value: 'Eye', IconComponent: Eye },
  { name: '闭眼', value: 'EyeOff', IconComponent: EyeOff },
];

export const iconMap: { [key: string]: React.ElementType } = Object.fromEntries(
  availableIcons.map(icon => [icon.value, icon.IconComponent])
);
iconMap['Default'] = Folder;


interface AppSidebarProps {
  categories: Category[];
  onAddCategory: (name: string, icon?: string, isPrivate?: boolean) => void;
  onDeleteCategory: (id: string) => void;
  onEditCategory: (category: Category) => void; 
  isAdminAuthenticated: boolean;
  activeCategory: string | null;
  setActiveCategory: (id: string | null) => void;
  onShowPasswordDialog: () => void;
}

const AppSidebar: React.FC<AppSidebarProps> = ({
  categories,
  onAddCategory,
  onDeleteCategory,
  onEditCategory,
  isAdminAuthenticated,
  activeCategory,
  setActiveCategory,
  onShowPasswordDialog,
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState<string>(availableIcons[0].value);
  const [newCategoryIsPrivate, setNewCategoryIsPrivate] = useState(false);
  const { toast } = useToast();

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      toast({ title: "错误", description: "分类名称不能为空。", variant: "destructive" });
      return;
    }
    onAddCategory(newCategoryName.trim(), newCategoryIcon, newCategoryIsPrivate);
    setNewCategoryName('');
    setNewCategoryIcon(availableIcons[0].value); 
    setNewCategoryIsPrivate(false);
    toast({ title: "分类已添加", description: `"${newCategoryName.trim()}" 已成功添加。` });
  };

  const handleDelete = (categoryId: string, categoryName: string) => {
    onDeleteCategory(categoryId);
    toast({ title: "分类已删除", description: `"${categoryName}" 及其所有书签已被删除。`, variant: "destructive" });
  };

  return (
    <aside className="w-60 md:w-64 bg-card/60 backdrop-blur-md border-r flex flex-col h-full shadow-lg">
      <ScrollArea className="flex-grow pt-3">
        <nav className="p-3 space-y-1">
          <Button
            variant={activeCategory === 'all' || categories.length === 0 ? 'secondary' : 'ghost'}
            className={`w-full justify-start text-sm ${activeCategory === 'all' || categories.length === 0 ? 'font-semibold': ''}`}
            onClick={() => setActiveCategory('all')}
          >
            <List className="mr-2 h-4 w-4" />
            全部书签
          </Button>
          {categories.map((category) => {
            const IconComponent = iconMap[category.icon || 'Default'] || iconMap['Default'];
            return (
              <div key={category.id} className="group relative">
                <Button
                  variant={activeCategory === category.id ? 'secondary' : 'ghost'}
                  className={`w-full justify-start text-sm truncate pr-16 ${activeCategory === category.id ? 'font-semibold': ''}`} 
                  onClick={() => setActiveCategory(category.id)}
                  title={category.name}
                >
                  <IconComponent className="mr-2 h-4 w-4 flex-shrink-0" /> 
                  <span className="truncate">{category.name}</span>
                  {category.isPrivate && <EyeOff className="ml-auto h-3.5 w-3.5 text-muted-foreground flex-shrink-0" title="私密分类" />}
                </Button>
                {isAdminAuthenticated && category.id !== 'default' && (
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-foreground/70 hover:text-foreground h-6 w-6 p-0.5 mr-0.5"
                      onClick={() => onEditCategory(category)}
                      aria-label={`编辑分类 ${category.name}`}
                    >
                      <PenLine className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive/70 hover:text-destructive h-6 w-6 p-0.5">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>确定删除分类 "{category.name}"?</AlertDialogTitle>
                          <AlertDialogDescription>
                            此操作将删除该分类及其下的所有书签。此操作无法撤销。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(category.id, category.name)} className="bg-destructive hover:bg-destructive/90">
                            删除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </ScrollArea>
      
      <div className="p-3 border-t mt-auto space-y-3"> {/* Increased space-y for better separation */}
        {isAdminAuthenticated && (
          <form onSubmit={handleAddCategorySubmit} className="space-y-2">
            <div className="flex items-center space-x-2">
              <Select value={newCategoryIcon} onValueChange={setNewCategoryIcon}>
                <SelectTrigger className="flex-1 h-9 text-sm justify-start" aria-label="选择分类图标">
                   <div className="flex items-center gap-2 truncate">
                      {React.createElement(iconMap[newCategoryIcon] || iconMap['Default'], {className: "h-4 w-4 flex-shrink-0"})}
                      <SelectValue placeholder="选择图标" />
                   </div>
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-[200px]">
                    {availableIcons.map(icon => (
                      <SelectItem key={icon.value} value={icon.value} className="text-xs">
                        <div className="flex items-center gap-2">
                          <icon.IconComponent className="h-4 w-4" />
                          <span>{icon.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>

              <Button
                  type="button"
                  variant="outline"
                  onClick={() => setNewCategoryIsPrivate(!newCategoryIsPrivate)}
                  className="flex-1 flex items-center justify-start text-sm h-9"
                  aria-label={newCategoryIsPrivate ? '设为公开分类' : '设为私密分类'}
              >
                  {newCategoryIsPrivate ? <EyeOff className="mr-2 h-4 w-4 flex-shrink-0" /> : <Eye className="mr-2 h-4 w-4 flex-shrink-0" />}
                  <span className="truncate">
                    {newCategoryIsPrivate ? '私密' : '公开'}
                  </span>
              </Button>
            </div>

            <Input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="新分类名称"
              className="h-9 text-sm"
            />
            
            <Button type="submit" className="w-full h-9 text-sm bg-primary hover:bg-primary/90">
              <PlusCircle className="mr-2 h-4 w-4" /> 添加分类
            </Button>
          </form>
        )}
        {!isAdminAuthenticated && (
          <Button onClick={onShowPasswordDialog} variant="outline" className="w-full shadow-sm h-9 text-sm">
            <LogIn className="mr-2 h-4 w-4" /> 进入管理模式
          </Button>
        )}
      </div>
    </aside>
  );
};

export default AppSidebar;
