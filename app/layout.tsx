import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Who Wrote It?",
  description: "Human or AI? You have one sentence to find out.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-arena-bg font-display antialiased">
        {children}
      </body>
    </html>
  );
}
