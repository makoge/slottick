// app/layout.tsx
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="bg-white" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans min-h-dvh bg-white text-slate-900 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
