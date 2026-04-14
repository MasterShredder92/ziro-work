import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ziro Work — Agent Command Center",
  description: "AI-powered agent command center for Ziro Work",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="h-full bg-[#080808] text-[#d4d4d4] antialiased">
        {children}
      </body>
    </html>
  );
}
