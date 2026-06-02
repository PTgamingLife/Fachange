import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FaChange — AI 臉部評分與保養分析',
  description:
    'AI 驅動的臉部評分系統，分析輪廓、五官比例、對稱性、膚況與視覺年輕度，並提供個人化保養方案。',
  keywords: '臉部分析, AI評分, 保養推薦, 醫美建議, 顏值評分',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body className="bg-navy-900 text-white antialiased">{children}</body>
    </html>
  );
}
