import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Bangers } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./global.css";
import { Providers } from "./providers";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
const _bangers = Bangers({ subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  // ...
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
