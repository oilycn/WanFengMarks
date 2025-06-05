
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, KeyRound, Database, AlertTriangle, Server } from 'lucide-react';
import { setInitialAdminConfigAction, isSetupCompleteAction } from '@/actions/authActions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const databaseTypes = [
  { value: 'temporary', label: '临时存储 (用于测试)' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mongodb', label: 'MongoDB' },
];

const dbConfigPlaceholders: Record<string, Array<{ name: string; label: string; placeholder: string }>> = {
  mysql: [
    { name: 'host', label: '主机', placeholder: 'localhost' },
    { name: 'port', label: '端口', placeholder: '3306' },
    { name: 'user', label: '用户名', placeholder: 'root' },
    { name: 'password', label: '密码', placeholder: '数据库密码' },
    { name: 'database', label: '数据库名', placeholder: 'wanfeng_marks' },
  ],
  postgresql: [
    { name: 'host', label: '主机', placeholder: 'localhost' },
    { name: 'port', label: '端口', placeholder: '5432' },
    { name: 'user', label: '用户名', placeholder: 'postgres' },
    { name: 'password', label: '密码', placeholder: '数据库密码' },
    { name: 'database', label: '数据库名', placeholder: 'wanfeng_marks' },
  ],
  mongodb: [
    { name: 'connectionString', label: '连接字符串', placeholder: 'mongodb://localhost:27017/wanfeng_marks' },
  ],
};


export default function SetupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedDbType, setSelectedDbType] = useState<string>(databaseTypes[0].value);
  const [dbConfig, setDbConfig] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only run this check if not currently submitting.
    // The form's onSubmit handler will navigate upon successful submission.
    if (isSubmitting) {
      console.log("SetupPage: isSubmitting is true, skipping useEffect check.");
      return;
    }

    let active = true;
    async function checkExistingSetup() {
      console.log("SetupPage: checkExistingSetup running.");
      try {
        const setupComplete = await isSetupCompleteAction();
        console.log("SetupPage: setupComplete result from server:", setupComplete);
        if (active && setupComplete) {
          console.log("SetupPage: Setup already complete, redirecting to /");
          // No toast here, as this is an automatic redirect on load
          router.push('/');
        } else if (active) {
          console.log("SetupPage: Setup not complete, staying on page.");
        }
      } catch (err) {
        if (active) {
          console.error("SetupPage: Error checking setup status on setup page:", err);
        }
      }
    }
    checkExistingSetup();
    return () => { 
      active = false; 
      console.log("SetupPage: useEffect cleanup.");
    };
  }, [router, isSubmitting]); // Added isSubmitting, removed toast from deps

  const handleDbConfigChange = (fieldName: string, value: string) => {
    setDbConfig(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    console.log("SetupPage: handleSubmit initiated.");

    if (!adminPassword || !confirmPassword) {
      setError("管理员密码和确认密码不能为空。");
      console.log("SetupPage: Validation error - passwords empty.");
      return;
    }
    if (adminPassword !== confirmPassword) {
      setError("两次输入的密码不一致。");
      console.log("SetupPage: Validation error - passwords do not match.");
      return;
    }
    
    setIsSubmitting(true);
    console.log("SetupPage: isSubmitting set to true.");
    try {
      const result = await setInitialAdminConfigAction(adminPassword, selectedDbType);
      console.log("SetupPage: setInitialAdminConfigAction result:", result);
      if (result.success) {
        toast({
          title: "配置成功",
          description: "管理员密码已设置。正在跳转到主应用...",
        });
        console.log("SetupPage: Setup successful, redirecting to /");
        router.push('/');
      } else {
        setError(result.error || "设置管理员密码失败，请重试。");
        toast({
          title: "配置失败",
          description: result.error || "无法保存管理员密码。",
          variant: "destructive",
        });
        console.log("SetupPage: Setup failed:", result.error);
      }
    } catch (err) {
      console.error("SetupPage: handleSubmit error:", err);
      const errorMessage = err instanceof Error ? err.message : "发生未知错误。";
      setError(`配置过程中发生错误: ${errorMessage}`);
      toast({
        title: "配置错误",
        description: `无法完成初始配置: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      console.log("SetupPage: isSubmitting set to false.");
    }
  };

  const currentDbPlaceholders = dbConfigPlaceholders[selectedDbType] || [];

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
                  placeholder="输入您的管理员密码"
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

            <div className="space-y-4">
              <h3 className="flex items-center text-lg font-semibold text-foreground">
                <Server className="mr-2 h-5 w-5 text-primary" />
                选择数据存储方式
              </h3>
              <div className="space-y-2">
                <Label htmlFor="dbType">数据库类型</Label>
                <Select value={selectedDbType} onValueChange={setSelectedDbType} disabled={isSubmitting}>
                  <SelectTrigger id="dbType">
                    <SelectValue placeholder="选择数据库类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {databaseTypes.map(db => (
                      <SelectItem key={db.value} value={db.value}>
                        {db.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedDbType !== 'temporary' && currentDbPlaceholders.length > 0 && (
                <Card className="mt-4 bg-muted/50 p-4">
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-base">数据库配置 ({databaseTypes.find(db=>db.value === selectedDbType)?.label})</CardTitle>
                    <CardDescription className="text-xs">
                      注意：以下字段仅为UI占位符，实际的数据库连接和配置需手动在后端实现。
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 space-y-3">
                    {currentDbPlaceholders.map(field => (
                      <div key={field.name} className="space-y-1">
                        <Label htmlFor={`db-${field.name}`} className="text-xs">{field.label}</Label>
                        <Input
                          id={`db-${field.name}`}
                          type={field.name.includes('password') ? 'password' : 'text'}
                          placeholder={field.placeholder}
                          value={dbConfig[field.name] || ''}
                          onChange={(e) => handleDbConfigChange(field.name, e.target.value)}
                          disabled // These are placeholders for now
                          className="bg-background/50"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-1 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-amber-700 dark:text-amber-300">
              <div className="flex items-center font-medium">
                <Database className="mr-2 h-5 w-5 flex-shrink-0" />
                重要说明
              </div>
              <p className="text-xs">
                如果您选择 "临时存储"，所有数据（书签、分类、管理员密码）将存储在服务器内存中，并在服务器重启后丢失。
                对于 MySQL, PostgreSQL, 或 MongoDB，您需要自行在后端代码中实现数据库连接和操作逻辑。当前选择这些选项不会自动配置数据库。
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
