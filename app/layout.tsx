// app/layout.tsx
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import type { Metadata } from "next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

export const metadata: Metadata = {
  verification: {
    other: {
      "msvalidate.01": "F92AC11091A9F71912C4635E1FCF1FDE"
    }
  }
};


export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="bg-white" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
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

      <body
        className={`${inter.variable} font-sans min-h-dvh bg-white text-slate-900 antialiased`}
      >
        {children}
        
      </body>
    </html>
  );
}
