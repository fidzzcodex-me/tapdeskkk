import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
});
const body = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "tapdesk — DevTools untuk halaman yang sedang kamu uji",
  description:
    "Panel developer mengambang: console, network, dan info, di-inject langsung ke halaman yang kamu tes sendiri.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${display.variable} ${body.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="bg-paper text-ink font-body dark:bg-surface dark:text-paper transition-colors">
        {children}
      </body>
    </html>
  );
}
