import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { AppNavbar } from "@/components/layout/AppNavbar";

export const metadata: Metadata = {
  title: "NeuroFlash Ledger | Synaptic Pulse DApp",
  description:
    "NeuroFlash Ledger leverages Zama FHEVM to deliver encrypted reaction speed trials, on-chain pulse archives, and emblem proofs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-[#05070e] text-white antialiased">
        <div className="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(circle_at_top,_rgba(120,80,255,0.18),transparent_55%),radial-gradient(circle_at_bottom,_rgba(20,180,255,0.16),transparent_50%)]" />
        <div className="pointer-events-none fixed inset-0 -z-10 bg-texture-noise opacity-[0.08] mix-blend-soft-light" />
        <Providers>
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 pb-20 pt-10 md:px-8">
            <AppNavbar />
            <main className="flex-1">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}


