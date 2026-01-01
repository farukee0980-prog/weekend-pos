import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";
import Providers from './providers';

const prompt = Prompt({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["latin", "thai"],
  variable: "--font-prompt",
});

export const metadata: Metadata = {
  title: "POS Freedome",
  description: "ระบบขายหน้าร้านสำหรับธุรกิจขนาดเล็ก",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="light" style={{ colorScheme: 'light' }}>
      <head>
        <meta name="color-scheme" content="light" />
      </head>
      <body className={`${prompt.variable} font-sans antialiased bg-white text-gray-900`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
