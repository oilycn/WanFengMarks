
// Minimal layout for the popup page
import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"; // Ensure Toaster is available for this layout
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
      <body className="font-body antialiased bg-transparent"> 
        {/* bg-transparent helps if the parent page is styled with backdrop-blur */}
        {children}
        {/* Toaster might be better inside the page component if it's self-contained with its own logic */}
      </body>
    </html>
  );
}

    