
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, KeyRound, Database, AlertTriangle, Server, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { 
  setInitialAdminConfigAction, 
  isSetupCompleteAction,
  testMySQLConnectionAction,
  initializeMySQLDatabaseAction
} from '@/actions/authActions';

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
        setCurrentStep('initial'); // Start at the first actual setup step
      }
    } catch (err) {
      console.error("SetupPage: Error checking setup status on setup page:", err);
      setFeedbackMessage({ type: 'error', message: "无法检查现有配置状态，请确保数据库可访问或稍后重试。" });
      setCurrentStep('initial'); // Allow user to try to proceed if check fails
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
      setFeedbackMessage({ type: 'error', message: result.error || '数据库连接测试失败。' });
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
      setCurrentStep('dbInitSuccess'); // Transition to password setup phase
    } else {
      setFeedbackMessage({ type: 'error', message: result.error || '数据库初始化失败。' });
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
        setCurrentStep('dbInitSuccess'); // Go back to password step on failure
      }
    } catch (err) {
      console.error("SetupPage: handleSubmitAdminConfig error:", err);
      const errorMessage = err instanceof Error ? err.message : "发生未知错误。";
      setFeedbackMessage({type: 'error', message: `配置过程中发生错误: ${errorMessage}`});
      setCurrentStep('dbInitSuccess'); // Go back to password step
    } finally {
      setIsLoading(false);
    }
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
          {/* Feedback Message Display */}
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

          {/* Step 1: MySQL Configuration Info & Test Connection */}
          <div className="space-y-4">
            <h3 className="flex items-center text-lg font-semibold text-foreground">
              <Server className="mr-2 h-5 w-5 text-primary" />
              1. MySQL 数据库连接
            </h3>
            <Card className="bg-muted/50 p-4">
              <CardContent className="p-0 space-y-3 text-xs">
                <p>MySQL 连接参数 (主机, 端口, 用户名, 密码, 数据库名) 必须在项目根目录的 <code className="font-mono bg-gray-200 dark:bg-gray-700 p-0.5 rounded text-xs">.env.local</code> 文件中预先配置好。</p>
                <p>例如: <br />
                  <code className="block whitespace-pre-wrap font-mono bg-gray-200 dark:bg-gray-700 p-1 rounded text-[0.7rem] leading-tight">
                    MYSQL_HOST=localhost<br/>
                    MYSQL_PORT=3306<br/>
                    MYSQL_USER=your_user<br/>
                    MYSQL_PASSWORD=your_password<br/>
                    MYSQL_DATABASE=wanfeng_marks
                  </code>
                </p>
                <p className="font-semibold mt-2">请确保您的 MySQL 服务器正在运行并且 <code className="font-mono bg-gray-200 dark:bg-gray-700 p-0.5 rounded text-xs">.env.local</code> 文件已正确配置。</p>
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

          {/* Step 2: Initialize Database */}
          {(currentStep === 'connectionSuccess' || currentStep === 'initializingDb' || currentStep === 'dbInitFailed' || currentStep === 'dbInitSuccess' || currentStep === 'passwordSetup' || currentStep === 'submittingConfig') && (
            <div className="space-y-4 border-t pt-4 mt-4">
              <h3 className="flex items-center text-lg font-semibold text-foreground">
                <Database className="mr-2 h-5 w-5 text-primary" />
                2. 初始化数据库表
              </h3>
              <p className="text-xs text-muted-foreground">
                此操作将在您的 MySQL 数据库中创建应用所需的表结构（如果它们尚不存在）。
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
          
          {/* Step 3: Admin Password Setup */}
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
        </CardContent>
        <CardFooter className="text-center text-xs text-muted-foreground">
           &copy; {new Date().getFullYear()} 晚风Marks. 初始配置.
        </CardFooter>
      </Card>
    </div>
  );
}
