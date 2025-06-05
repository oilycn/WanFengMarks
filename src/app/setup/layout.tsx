
import type { Metadata } from 'next';
import '../globals.css'; // Essential global styles

export const metadata: Metadata = {
  title: '初始配置 - 晚风Marks',
  description: '首次运行配置您的晚风Marks应用。',
};

export default function SetupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // This layout should just return its children.
  // The root layout (src/app/layout.tsx) provides the <html> and <body> tags.
  return <>{children}</>;
}
