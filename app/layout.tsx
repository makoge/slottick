// app/layout.tsx
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import SupportWidget from "@/app/components/SupportWidget";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#cbd5e1", // slate-300
};

export const metadata: Metadata = {
  verification: {
    other: {
      "msvalidate.01": "F92AC11091A9F71912C4635E1FCF1FDE",
    },
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} bg-slate-300`}
      suppressHydrationWarning
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />

        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-820F0S27JW"
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-820F0S27JW');
          `}
        </Script>
      </head>

      <body className="min-h-dvh bg-slate-300 font-sans text-slate-900 antialiased selection:bg-lime-200 selection:text-lime-950">
        {children}
        {/* Global Floating AI Support Widget */}
        <SupportWidget />
      </body>
    </html>
  );
}
