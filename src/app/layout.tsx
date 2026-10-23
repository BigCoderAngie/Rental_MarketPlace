import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter 400 to 800 (one variable font file), as in the build kit.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "RentLoop",
  description: "Inventory, bookings and calendar for Namibian hire businesses",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets env(safe-area-inset-bottom) report the iPhone home bar, so the tab bar can sit above it.
  viewportFit: "cover",
  // The browser bar matches the white header (--card in globals.css).
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-scroll-behavior lets Next.js turn off the smooth scrolling (globals.css) while it changes pages.
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
