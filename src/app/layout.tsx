import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kodexa",
  description: "Your workplace has the answer. Just ask Kodexa for it.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
