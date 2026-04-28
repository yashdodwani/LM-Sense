// Purpose: Root layout for the LM-Sense dashboard application.
// Wraps every page with the sidebar + topbar shell and imports Inter font from Google.

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LM-Sense — Bias Mitigation Dashboard",
  description:
    "Enterprise AI bias detection, debiasing pipeline configuration, and compliance audit dashboard for LM-Sense.",
  keywords: ["AI bias", "debiasing", "fairness", "LLM", "compliance", "audit"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex h-screen overflow-hidden bg-gray-50 font-sans antialiased">
        {/* Sidebar — fixed left panel */}
        <Sidebar />

        {/* Main content — offset for sidebar width */}
        <div className="flex flex-1 flex-col md:ml-60 transition-all duration-300">
          <Topbar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
