
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, KeyRound, Database, AlertTriangle, Server, CheckCircle, XCircle, RefreshCw, RotateCcw } from 'lucide-react';
import { 
  setInitialAdminConfigAction, 
  isSetupCompleteAction,
  testMySQLConnectionAction,
  initializeMySQLDatabaseAction,
  resetSetupStateAction
} from '@/actions/authActions';
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

type SetupStep = 'initial' | 'testingConnection' | 'connectionFailed' | 'connectionSuccess' | 'initializingDb' | 'dbInitFailed' | 'dbInitSuccess' | 'passwordSetup' | 'submittingConfig';

export default function SetupPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [currentStep, setCurrentStep] = useState<SetupStep>('initial');
  const [isLoading, setIsLoading] = useState(false); // General loading state for async operations
  const [feedbackMessage, setFeedbackMessage] = useState<{type: 'error' | 'success' | 'info', message: string} | null>(null);
  const [isCheckingInitialSetup, setIsCheckingInitialSetup] = useState(true);

  const checkExistingSetup = useCallback(async () => {
    setIsCheckingInitialSetup(true);
    console.log("SetupPage: checkExistingSetup running.");
    try {
      const setupComplete = await isSetupCompleteAction();
      console.log("SetupPage: setupComplete result from server:", setupComplete);
      if (setupComplete) {
        console.log("SetupPage: Setup already complete, redirecting to /");
        router.push('/');
      } else {
        console.log("SetupPage: Setup not complete, proceeding with setup steps.");
        setCurrentStep('initial'); 
      }
    } catch (err) {
      console.error("SetupPage: Error checking setup status on setup page:", err);
      setFeedbackMessage({ type: 'error', message: "无法检查现有配置状态，请确保数据库可访问或稍后重试。" });
      setCurrentStep('initial'); 
    } finally {
      setIsCheckingInitialSetup(false);
    }
  }, [router]);

  useEffect(() => {
    checkExistingSetup();
  }, [checkExistingSetup]);

  const handleTestConnection = async () => {
    setIsLoading(true);
    setCurrentStep('testingConnection');
    setFeedbackMessage(null);
    const result = await testMySQLConnectionAction();
    if (result.success) {
      setFeedbackMessage({ type: 'success', message: result.message || '数据库连接成功！' });
      setCurrentStep('connectionSuccess');
    } else {
      setFeedbackMessage({ type: 'error', message: result.error || '数据库连接测试失败。请检查您的 .env.local 文件中的 MYSQL_CONNECTION_STRING 是否正确，并且数据库服务正在运行。' });
      setCurrentStep('connectionFailed');
    }
    setIsLoading(false);
  };

  const handleInitializeDatabase = async () => {
    setIsLoading(true);
    setCurrentStep('initializingDb');
    setFeedbackMessage(null);
    const result = await initializeMySQLDatabaseAction();
    if (result.success) {
      setFeedbackMessage({ type: 'success', message: result.message || '数据库初始化成功！现在可以设置管理员密码。' });
      setCurrentStep('dbInitSuccess'); 
    } else {
      setFeedbackMessage({ type: 'error', message: result.error || '数据库初始化失败。请检查数据库用户权限和日志。' });
      setCurrentStep('dbInitFailed');
    }
    setIsLoading(false);
  };

  const handleSubmitAdminConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMessage(null);

    if (!adminPassword || !confirmPassword) {
      setFeedbackMessage({type: 'error', message: "管理员密码和确认密码不能为空。"});
      return;
    }
    if (adminPassword !== confirmPassword) {
      setFeedbackMessage({type: 'error', message: "两次输入的密码不一致。"});
      return;
    }
    
    setIsLoading(true);
    setCurrentStep('submittingConfig');
    try {
      const result = await setInitialAdminConfigAction(adminPassword);
      if (result.success) {
        toast({
          title: "配置成功",
          description: "初始配置已保存。正在跳转到主页...",
        });
        router.push('/');
      } else {
        setFeedbackMessage({type: 'error', message: result.error || "设置管理员配置失败，请重试。"});
        setCurrentStep('dbInitSuccess'); 
      }
    } catch (err) {
      console.error("SetupPage: handleSubmitAdminConfig error:", err);
      const errorMessage = err instanceof Error ? err.message : "发生未知错误。";
      setFeedbackMessage({type: 'error', message: `配置过程中发生错误: ${errorMessage}`});
      setCurrentStep('dbInitSuccess'); 
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSetup = async () => {
    setIsLoading(true);
    setFeedbackMessage(null);
    const result = await resetSetupStateAction();
    if (result.success) {
      toast({ title: "配置已重置", description: result.message });
      setCurrentStep('initial');
      setAdminPassword('');
      setConfirmPassword('');
      // Re-run checkExistingSetup to ensure UI reflects reset state correctly
      await checkExistingSetup(); 
    } else {
      toast({ title: "重置失败", description: result.error, variant: "destructive" });
      setFeedbackMessage({ type: 'error', message: result.error || "重置配置失败。" });
    }
    setIsLoading(false);
  };


  if (isCheckingInitialSetup) {
    return (
       <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-sky-100 dark:from-slate-900 dark:to-sky-900 p-4">
        <div className="flex items-center space-x-2 text-foreground">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <p className="text-lg">正在检查配置状态...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-sky-100 dark:from-slate-900 dark:to-sky-900 p-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck size={32} />
          </div>
          <CardTitle className="text-2xl">欢迎使用 晚风Marks</CardTitle>
          <CardDescription>首次运行，请完成 MySQL 数据库配置。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {feedbackMessage && (
            <div className={`flex items-center rounded-md border p-3 text-sm font-medium
              ${feedbackMessage.type === 'error' ? 'border-destructive/50 bg-destructive/10 text-destructive' : ''}
              ${feedbackMessage.type === 'success' ? 'border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-300' : ''}
              ${feedbackMessage.type === 'info' ? 'border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-300' : ''}
            `}>
              {feedbackMessage.type === 'error' && <AlertTriangle className="mr-2 h-4 w-4 flex-shrink-0" />}
              {feedbackMessage.type === 'success' && <CheckCircle className="mr-2 h-4 w-4 flex-shrink-0" />}
              {feedbackMessage.message}
            </div>
          )}

          
          <div className="space-y-4">
            <h3 className="flex items-center text-lg font-semibold text-foreground">
              <Server className="mr-2 h-5 w-5 text-primary" />
              1. MySQL 数据库连接
            </h3>
            <Card className="bg-muted/50 p-4">
              <CardContent className="p-0 space-y-3 text-xs">
                <p>MySQL 连接参数必须在项目根目录的 <code className="font-mono bg-gray-200 dark:bg-gray-700 p-0.5 rounded text-xs">.env.local</code> 文件中通过 <code className="font-mono bg-gray-200 dark:bg-gray-700 p-0.5 rounded text-xs">MYSQL_CONNECTION_STRING</code> 环境变量预先配置好。</p>
                <p>格式为: <br />
                  <code className="block whitespace-pre-wrap font-mono bg-gray-200 dark:bg-gray-700 p-1 rounded text-[0.7rem] leading-tight">
                    MYSQL_CONNECTION_STRING="mysql://your_user:your_password@your_host:your_port/your_database"
                  </code>
                </p>
                <p className="font-semibold mt-2">请确保您的 MySQL 服务器正在运行并且 <code className="font-mono bg-gray-200 dark:bg-gray-700 p-0.5 rounded text-xs">.env.local</code> 文件已正确配置 <code className="font-mono bg-gray-200 dark:bg-gray-700 p-0.5 rounded text-xs">MYSQL_CONNECTION_STRING</code>。</p>
              </CardContent>
            </Card>
            <Button 
              onClick={handleTestConnection} 
              className="w-full" 
              disabled={isLoading || currentStep === 'connectionSuccess' || currentStep === 'dbInitSuccess' || currentStep === 'passwordSetup' || currentStep === 'submittingConfig'}
            >
              {isLoading && currentStep === 'testingConnection' && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              {currentStep === 'connectionSuccess' || currentStep === 'dbInitSuccess' || currentStep === 'passwordSetup' || currentStep === 'submittingConfig' ? <CheckCircle className="mr-2 h-4 w-4" /> : null}
              测试数据库连接
            </Button>
          </div>

          
          {(currentStep === 'connectionSuccess' || currentStep === 'initializingDb' || currentStep === 'dbInitFailed' || currentStep === 'dbInitSuccess' || currentStep === 'passwordSetup' || currentStep === 'submittingConfig') && (
            <div className="space-y-4 border-t pt-4 mt-4">
              <h3 className="flex items-center text-lg font-semibold text-foreground">
                <Database className="mr-2 h-5 w-5 text-primary" />
                2. 初始化数据库表
              </h3>
              <p className="text-xs text-muted-foreground">
                此操作将在您的 MySQL 数据库中创建应用所需的表结构（如果它们尚不存在）。如果表已存在但缺少列（如 'priority'），此步骤可能不会自动添加它们，您可能需要手动 <code className="font-mono bg-gray-200 dark:bg-gray-700 p-0.5 rounded text-xs">ALTER TABLE</code> 或通过下方的“重置配置”按钮后重新执行此步骤。
              </p>
              <Button 
                onClick={handleInitializeDatabase} 
                className="w-full"
                disabled={isLoading || currentStep !== 'connectionSuccess' && currentStep !== 'dbInitFailed' }
              >
                {isLoading && currentStep === 'initializingDb' && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                 {(currentStep === 'dbInitSuccess' || currentStep === 'passwordSetup' || currentStep === 'submittingConfig') ? <CheckCircle className="mr-2 h-4 w-4" /> : null}
                初始化数据库 (建表)
              </Button>
            </div>
          )}
          
          
          {(currentStep === 'dbInitSuccess' || currentStep === 'passwordSetup' || currentStep === 'submittingConfig') && (
            <form onSubmit={handleSubmitAdminConfig} className="space-y-6 border-t pt-4 mt-4">
              <div>
                <h3 className="flex items-center text-lg font-semibold text-foreground mb-3">
                  <KeyRound className="mr-2 h-5 w-5 text-primary" />
                  3. 设置管理员密码
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
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2 mt-3">
                  <Label htmlFor="confirmPassword">确认管理员密码</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="再次输入密码"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || currentStep !== 'dbInitSuccess' && currentStep !== 'passwordSetup'}>
                {isLoading && currentStep === 'submittingConfig' ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                保存配置并启动
              </Button>
            </form>
          )}

          {/* Reset Setup Button */}
           <div className="border-t pt-4 mt-6">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full" disabled={isLoading}>
                            <RotateCcw className="mr-2 h-4 w-4" /> 重置应用配置
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>确定要重置应用配置吗？</AlertDialogTitle>
                        <AlertDialogDescription>
                            此操作将清除当前的管理员密码和设置完成状态。您将需要重新进行完整的设置流程，包括数据库初始化。这对于解决因旧的数据库表结构（例如缺少 'priority' 列）导致的问题可能很有用。此操作不会删除您的书签或分类数据，但会允许重新运行数据库初始化步骤（该步骤使用 'CREATE TABLE IF NOT EXISTS'，理论上是安全的）。
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleResetSetup}
                            disabled={isLoading}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                            确定重置
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <p className="text-xs text-muted-foreground mt-2">
                    如果您遇到“Unknown column 'priority'”之类的错误，或设置后仍被重定向到此页面，尝试重置配置并重新初始化数据库可能会解决问题。
                </p>
            </div>
        </CardContent>
        <CardFooter className="text-center text-xs text-muted-foreground">
           &copy; {new Date().getFullYear()} 晚风Marks. 初始配置.
        </CardFooter>
      </Card>
    </div>
  );
}

