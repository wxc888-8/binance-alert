import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: '币安合约预警系统',
  description: '实时加密货币价格监控与预警',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} bg-[#F5F7FA] text-slate-900`}>
        {children}
      </body>
    </html>
  );
}
