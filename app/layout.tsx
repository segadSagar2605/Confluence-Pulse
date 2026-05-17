import type { Metadata } from "next";
import "./globals.css";
import TopNav from "@/components/layout/TopNav";
import Sidebar from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "Confluence Pulse — AI Knowledge Intelligence",
  description: "Trusted teamwork intelligence for Platform Engineering",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-confluence-text antialiased">
        <TopNav />
        <div className="flex h-screen pt-12">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-white">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
