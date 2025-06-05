
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { availableIcons, iconMap } from './AppSidebar'; // Assuming these are exported
import { useToast } from "@/hooks/use-toast";

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: {
    currentPassword?: string;
    newPassword?: string;
    logoText?: string;
    logoIcon?: string;
  }) => Promise<void>;
  currentLogoText: string;
  currentLogoIconName: string;
  adminPasswordPresent: boolean; 
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  currentLogoText,
  currentLogoIconName,
  adminPasswordPresent,
}) => {
  const { toast } = useToast();

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Logo state
  const [logoText, setLogoText] = useState(currentLogoText);
  const [logoIcon, setLogoIcon] = useState(currentLogoIconName);
  
  const [isSubmitting, setIsSubmitting] = useState(false);


  useEffect(() => {
    if (isOpen) {
      // Reset states when dialog opens
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordError(null);
      setLogoText(currentLogoText);
      setLogoIcon(currentLogoIconName);
      setIsSubmitting(false);
    }
  }, [isOpen, currentLogoText, currentLogoIconName]);

  const handlePasswordSave = async () => {
    setPasswordError(null);
    if (newPassword && newPassword !== confirmNewPassword) {
      setPasswordError("新密码和确认密码不匹配。");
      return false;
    }
    if (newPassword && newPassword.length < 6) {
      setPasswordError("新密码长度至少为6位。");
      return false;
    }
    if (adminPasswordPresent && newPassword && !currentPassword) {
      setPasswordError("请输入当前密码以设置新密码。");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const isPasswordSectionValid = await handlePasswordSave();
    if (!isPasswordSectionValid && newPassword) { // Only block if new password was attempted and failed
        setIsSubmitting(false);
        return;
    }
    
    const settingsToSave: {
        currentPassword?: string;
        newPassword?: string;
        logoText?: string;
        logoIcon?: string;
    } = {};

    if (newPassword) {
        settingsToSave.currentPassword = currentPassword;
        settingsToSave.newPassword = newPassword;
    }
    if (logoText !== currentLogoText || logoIcon !== currentLogoIconName) {
        settingsToSave.logoText = logoText;
        settingsToSave.logoIcon = logoIcon;
    }

    if (Object.keys(settingsToSave).length === 0) {
        toast({ title: "无更改", description: "未检测到任何更改。" });
        setIsSubmitting(false);
        onClose();
        return;
    }

    try {
      await onSave(settingsToSave);
      // onClose will be called by the parent component on successful save through its own logic
    } catch (error: any) {
      // Errors should be handled by the onSave implementation and shown as toasts there
      console.error("Error during onSave in SettingsDialog", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedIconObject = availableIcons.find(icon => icon.value === logoIcon);
  const selectedIconDisplayName = selectedIconObject?.name || "选择图标";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => {if(isSubmitting) e.preventDefault();}}>
        <DialogHeader>
          <DialogTitle>应用设置</DialogTitle>
          <DialogDescription>
            管理您的应用偏好设置。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="password">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="password">密码安全</TabsTrigger>
              <TabsTrigger value="appearance">站点外观</TabsTrigger>
            </TabsList>
            <TabsContent value="password" className="py-4 space-y-4">
              {adminPasswordPresent && (
                <div className="space-y-1">
                  <Label htmlFor="currentPassword">当前密码</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="如果您要更改密码，请输入当前密码"
                    disabled={isSubmitting}
                  />
                </div>
              )}
               {!adminPasswordPresent && newPassword && (
                 <p className="text-xs text-muted-foreground">由于当前未设置密码，首次设置密码无需输入“当前密码”。</p>
               )}
              <div className="space-y-1">
                <Label htmlFor="newPassword">新密码</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={adminPasswordPresent ? "留空则不更改" : "设置您的管理员密码"}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="confirmNewPassword">确认新密码</Label>
                <Input
                  id="confirmNewPassword"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="再次输入新密码"
                  disabled={isSubmitting || !newPassword}
                />
              </div>
              {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
            </TabsContent>
            <TabsContent value="appearance" className="py-4 space-y-4">
              <div className="space-y-1">
                <Label htmlFor="logoText">Logo 文本</Label>
                <Input
                  id="logoText"
                  value={logoText}
                  onChange={(e) => setLogoText(e.target.value)}
                  placeholder="例如：我的书签站"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="logoIcon">Logo 图标</Label>
                 <Select value={logoIcon} onValueChange={setLogoIcon} disabled={isSubmitting}>
                    <SelectTrigger id="logoIcon">
                       <div className="flex items-center gap-2">
                          {React.createElement(iconMap[logoIcon] || iconMap['Default'], {className: "h-4 w-4 flex-shrink-0"})}
                          <SelectValue placeholder="选择图标">{selectedIconDisplayName}</SelectValue>
                       </div>
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-[200px]">
                        {availableIcons.map(iconItem => (
                          <SelectItem key={iconItem.value} value={iconItem.value}>
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
            </TabsContent>
          </Tabs>
          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                取消
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '正在保存...' : '保存设置'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;

    