
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, KeyRound, Database, AlertTriangle } from 'lucide-react';
import { setInitialAdminPasswordAction, isSetupCompleteAction } from '@/actions/authActions';

export default function SetupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Prevent access if setup is already complete
    async function checkExistingSetup() {
      try {
        const setupComplete = await isSetupCompleteAction();
        if (setupComplete) {
          toast({ title: "配置已完成", description: "应用已配置，将跳转到主页。" });
          router.push('/');
        }
      } catch (err) {
        console.error("Error checking setup status on setup page:", err);
        // Allow to proceed if check fails, maybe server is not fully ready for this check yet.
      }
    }
    checkExistingSetup();
  }, [router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!adminPassword || !confirmPassword) {
      setError("管理员密码和确认密码不能为空。");
      return;
    }
    if (adminPassword !== confirmPassword) {
      setError("两次输入的密码不一致。");
      return;
    }
    if (adminPassword.length < 6) {
      setError("管理员密码长度至少为6位。");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await setInitialAdminPasswordAction(adminPassword);
      if (result.success) {
        toast({
          title: "配置成功",
          description: "管理员密码已设置。正在跳转到主应用...",
        });
        // localStorage.setItem('wanfeng_setup_complete_v1', 'true'); // Client flag, server is source of truth
        router.push('/');
      } else {
        setError(result.error || "设置管理员密码失败，请重试。");
        toast({
          title: "配置失败",
          description: result.error || "无法保存管理员密码。",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Setup error:", err);
      const errorMessage = err instanceof Error ? err.message : "发生未知错误。";
      setError(`配置过程中发生错误: ${errorMessage}`);
      toast({
        title: "配置错误",
        description: `无法完成初始配置: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-sky-100 dark:from-slate-900 dark:to-sky-900 p-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck size={32} />
          </div>
          <CardTitle className="text-2xl">欢迎使用 晚风Marks</CardTitle>
          <CardDescription>首次运行，请完成初始配置。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="flex items-center text-lg font-semibold text-foreground">
                <KeyRound className="mr-2 h-5 w-5 text-primary" />
                设置管理员密码
              </h3>
              <div className="space-y-2">
                <Label htmlFor="adminPassword">管理员密码</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="至少6位字符"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">确认管理员密码</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入密码"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-1 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-amber-700 dark:text-amber-300">
                <div className="flex items-center font-medium">
                    <Database className="mr-2 h-5 w-5 flex-shrink-0" />
                    数据库说明
                </div>
                <p className="text-xs ">
                    当前版本使用服务器内存进行书签和分类的临时存储。
                    管理员密码也将存储在服务器内存中。
                    <strong>重启服务器后，所有数据（包括此密码）将会丢失。</strong>
                    后续版本将支持连接到持久化数据库。
                </p>
            </div>


            {error && (
              <div className="mt-4 flex items-center rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                <AlertTriangle className="mr-2 h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? '正在保存...' : '保存配置并启动'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-xs text-muted-foreground">
           &copy; {new Date().getFullYear()} 晚风Marks. 初始配置.
        </CardFooter>
      </Card>
    </div>
  );
}
