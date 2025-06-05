
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
  { value: 'mysql', label: 'MySQL (推荐)' },
  // { value: 'postgresql', label: 'PostgreSQL' },
  // { value: 'mongodb', label: 'MongoDB' },
];

// Placeholders are mostly for show, actual config is via .env.local for MySQL
const dbConfigPlaceholders: Record<string, Array<{ name: string; label: string; placeholder: string }>> = {
  mysql: [
    { name: 'host', label: '主机 (来自 .env.local)', placeholder: 'process.env.MYSQL_HOST' },
    { name: 'port', label: '端口 (来自 .env.local)', placeholder: 'process.env.MYSQL_PORT' },
    { name: 'user', label: '用户名 (来自 .env.local)', placeholder: 'process.env.MYSQL_USER' },
    { name: 'database', label: '数据库名 (来自 .env.local)', placeholder: 'process.env.MYSQL_DATABASE' },
  ],
  // postgresql: [ // Keep for potential future expansion, but disabled for now
  //   { name: 'host', label: '主机', placeholder: 'localhost' },
  // ],
  // mongodb: [ // Keep for potential future expansion, but disabled for now
  //   { name: 'connectionString', label: '连接字符串', placeholder: 'mongodb://localhost:27017/wanfeng_marks' },
  // ],
};


export default function SetupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedDbType, setSelectedDbType] = useState<string>(databaseTypes[0].value); // Default to temporary
  const [dbConfig, setDbConfig] = useState<Record<string, string>>({}); // Not actively used for MySQL config, reads from .env
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
          router.push('/');
        } else if (active) {
          console.log("SetupPage: Setup not complete, staying on page.");
        }
      } catch (err) {
        if (active) {
          console.error("SetupPage: Error checking setup status on setup page:", err);
          // toast({ title: "错误", description: "检查配置状态失败。", variant: "destructive" });
        }
      }
    }
    checkExistingSetup();
    return () => { 
      active = false; 
      console.log("SetupPage: useEffect cleanup.");
    };
  }, [router, isSubmitting]); 

  const handleDbConfigChange = (fieldName: string, value: string) => {
    // This is mostly for show as MySQL config comes from .env.local
    setDbConfig(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    console.log("SetupPage: handleSubmit initiated.");

    if (selectedDbType !== 'temporary' && (!adminPassword || !confirmPassword)) {
      setError("管理员密码和确认密码不能为空。");
      console.log("SetupPage: Validation error - passwords empty for persistent DB.");
      return;
    }
    if (selectedDbType !== 'temporary' && adminPassword !== confirmPassword) {
      setError("两次输入的密码不一致。");
      console.log("SetupPage: Validation error - passwords do not match for persistent DB.");
      return;
    }
    
    setIsSubmitting(true);
    console.log("SetupPage: isSubmitting set to true.");
    try {
      // If 'temporary' is selected, password can be empty (or handled differently by authAction)
      const passwordToSet = selectedDbType === 'temporary' ? '' : adminPassword;
      const result = await setInitialAdminConfigAction(passwordToSet, selectedDbType);
      console.log("SetupPage: setInitialAdminConfigAction result:", result);

      if (result.success) {
        toast({
          title: "配置成功",
          description: `初始配置已保存。数据库类型: ${databaseTypes.find(db=>db.value === selectedDbType)?.label}. 正在跳转...`,
        });
        console.log("SetupPage: Setup successful, redirecting to /");
        router.push('/');
      } else {
        setError(result.error || "设置初始配置失败，请重试。");
        toast({
          title: "配置失败",
          description: result.error || "无法保存初始配置。",
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

              {selectedDbType === 'mysql' && (
                <Card className="mt-4 bg-muted/50 p-4">
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-base">MySQL 配置说明</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 space-y-3 text-xs">
                    <p>MySQL 连接参数 (主机, 端口, 用户名, 密码, 数据库名) 应在项目根目录的 <code className="font-mono bg-gray-200 dark:bg-gray-700 p-0.5 rounded">.env.local</code> 文件中配置。</p>
                    <p>例如: <br />
                      <code className="block whitespace-pre-wrap font-mono bg-gray-200 dark:bg-gray-700 p-1 rounded text-[0.7rem]">
                        MYSQL_HOST=localhost<br/>
                        MYSQL_PORT=3306<br/>
                        MYSQL_USER=your_user<br/>
                        MYSQL_PASSWORD=your_password<br/>
                        MYSQL_DATABASE=wanfeng_marks
                      </code>
                    </p>
                     <p className="font-semibold mt-2">重要：请确保在启动应用前，已在您的MySQL服务器中手动创建了所需的表。建表语句请参考 <code className="font-mono bg-gray-200 dark:bg-gray-700 p-0.5 rounded">src/lib/mysql.ts</code> 文件中的注释。</p>
                  </CardContent>
                </Card>
              )}
            </div>


            {selectedDbType !== 'temporary' && (
              <div className="space-y-4 border-t pt-4 mt-4">
                <h3 className="flex items-center text-lg font-semibold text-foreground">
                  <KeyRound className="mr-2 h-5 w-5 text-primary" />
                  设置管理员密码 (用于MySQL模式)
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="adminPassword">管理员密码</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="输入您的管理员密码"
                    required={selectedDbType !== 'temporary'}
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
                    required={selectedDbType !== 'temporary'}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            )}


            <div className="space-y-1 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-amber-700 dark:text-amber-300">
              <div className="flex items-center font-medium">
                <Database className="mr-2 h-5 w-5 flex-shrink-0" />
                重要说明
              </div>
              <p className="text-xs">
                如果您选择 "临时存储"，所有数据（书签、分类、管理员密码配置）将存储在服务器内存中，并在服务器重启后丢失 (无密码)。
                对于 MySQL 模式，您需要已配置 <code className="font-mono bg-gray-200 dark:bg-gray-700 p-0.5 rounded">.env.local</code> 文件并手动创建数据库表。
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
