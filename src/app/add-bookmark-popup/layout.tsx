
// Minimal layout for the popup page
import type { Metadata } from 'next';
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
  // The root layout (src/app/layout.tsx) provides the <html> and <body> tags.
  // This nested layout should just return its children.
  // The styles for the popup's content area (like the semi-transparent background)
  // are handled in src/app/add-bookmark-popup/page.tsx
  return <>{children}</>;
}
