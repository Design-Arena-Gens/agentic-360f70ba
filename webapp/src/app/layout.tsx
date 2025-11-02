import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Agentic Social Command Center",
  description:
    "Private AI agent that discovers trends, creates content, and automates cross-platform publishing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} bg-slate-950 text-slate-100 antialiased`}
      >
        <div className="min-h-screen bg-grid-slate-900/40">
          <div className="pointer-events-none fixed inset-0 -z-10 select-none opacity-60">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(37,99,235,0.09),_transparent)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(236,72,153,0.06),_transparent)]" />
          </div>
          {children}
        </div>
      </body>
    </html>
  );
}
