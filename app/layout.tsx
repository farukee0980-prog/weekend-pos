import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";
import Providers from './providers';

const prompt = Prompt({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["latin", "thai"],
  variable: "--font-prompt",
  display: 'swap',
  fallback: ['system-ui', 'arial'],
});

export const metadata: Metadata = {
  title: "Freedom POS - ระบบขายหน้าร้าน",
  description: "ระบบ Point of Sale สำหรับร้านค้าขนาดเล็ก รองรับการขาย สมาชิก และพิมพ์ใบเสร็จผ่าน Bluetooth",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Freedom POS",
    startupImage: "/icon-512.png"
  },
  other: {
    "mobile-web-app-capable": "yes",
    "application-name": "Freedom POS",
    "msapplication-TileColor": "#1f2937",
    "theme-color": "#1f2937"
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="light" style={{ colorScheme: 'light' }}>
      <head>
        {/* PWA Meta Tags */}
        <meta name="application-name" content="Freedom POS" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Freedom POS" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#1f2937" />
        <meta name="theme-color" content="#1f2937" />
        <meta name="color-scheme" content="light" />
        
        {/* Icons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-192.png" />
        <link rel="shortcut icon" href="/icon-192.png" />
        
        {/* Permissions */}
        <meta httpEquiv="Permissions-Policy" content="bluetooth=*, camera=*, microphone=*" />
      </head>
      <body className={`${prompt.variable} font-sans antialiased bg-white text-gray-900`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
