import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

/** Humaan uses Maison Neue; Inter is the closest available match for web. */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Campaign Creative Review",
  description: "Q4 creative review and campaign KPI hub for FreePrints apps",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
