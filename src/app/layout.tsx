
import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';

export const metadata: Metadata = {
  title: '晚风Marks 书签导航',
  description: '您的个性化书签仪表盘，集成时钟、天气和搜索功能。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        {/* 移除 Google Fonts 的直接链接，依赖 tailwind.config.ts 中的字体栈 */}
      </head>
      <body className="font-body antialiased selection:bg-primary selection:text-primary-foreground bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
