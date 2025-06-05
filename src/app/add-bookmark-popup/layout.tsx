
// Minimal layout for the popup page
import type { Metadata } from 'next';
// import { Toaster } from "@/components/ui/toaster"; // Toaster not needed here
import '../globals.css'; // Essential global styles

export const metadata: Metadata = {
  title: '添加书签 - 晚风Marks',
  description: '快速添加书签到您的晚风Marks仪表盘。',
};

export default function PopupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        {/* Minimal head content */}
      </head>
      <body className="font-body antialiased bg-background"> 
        {/* Changed bg-transparent to bg-background */}
        {children}
      </body>
    </html>
  );
}
