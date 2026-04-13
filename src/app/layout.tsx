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
      <body className="h-full bg-[#080808] text-[#e0e0e0] antialiased">
        {children}
      </body>
    </html>
  );
}
