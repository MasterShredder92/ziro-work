import { jsx as _jsx } from "react/jsx-runtime";
import { Inter } from "next/font/google";
import "./globals.css";
import defaultSiteMetadata from "@/lib/seo/metadata";
const inter = Inter({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-inter",
    preload: true,
});
export const metadata = defaultSiteMetadata;
export default function RootLayout({ children, }) {
    return (_jsx("html", { lang: "en", className: `h-full ${inter.variable}`, children: _jsx("body", { suppressHydrationWarning: true, className: "h-full bg-[var(--z-bg)] text-[var(--z-fg)] antialiased", children: children }) }));
}
