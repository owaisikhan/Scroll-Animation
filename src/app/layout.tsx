import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import "./globals.css";
import { brand } from "@/lib/content";

const grotesk = Inter_Tight({
  variable: "--font-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `${brand.name} — See what your team knows`,
  description:
    "Ask a question and get the answer out of whichever tool it was buried in.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${grotesk.variable} antialiased`}>
      <body className="text-paper">{children}</body>
    </html>
  );
}
