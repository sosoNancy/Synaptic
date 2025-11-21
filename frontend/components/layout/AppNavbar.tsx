'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

import { useNeuroFlashApp } from "@/components/neuroflash/NeuroFlashProvider";

const NAV_ITEMS = [
  { href: "/", label: "Command Center" },
  { href: "/test", label: "Flash Training" },
  { href: "/leaderboard", label: "Pulse Leaderboard" },
  { href: "/events", label: "Programs" },
];

function truncateAddress(value: string) {
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

export function AppNavbar() {
  const pathname = usePathname();
  const { meta, fhevm, mode } = useNeuroFlashApp();
  const isConnected = meta.isConnected && meta.accounts && meta.accounts.length > 0;
  const address = meta.accounts?.[0] ?? "";

  return (
    <header className="glass-card sticky top-0 z-40 flex items-center justify-between gap-6 px-7 py-4">
      <Link href="/" className="flex items-center gap-3">
        <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#54d6ff] via-[#7d7bff] to-[#ca6bff] shadow-lg">
          <Image src="/zama-logo.svg" alt="Zama" width={28} height={28} className="opacity-85" priority />
        </div>
        <div className="leading-snug">
          <p className="text-xs uppercase tracking-[0.42em] text-white/70">NeuroFlash</p>
          <p className="text-lg font-semibold text-white">Synaptic Atlas</p>
        </div>
      </Link>

      <nav className="hidden items-center gap-2 text-sm text-white/70 md:flex">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative overflow-hidden rounded-full px-4 py-2 font-medium transition ${
                active ? 'text-white' : 'hover:text-white'
              }`}
            >
              <span
                className={`absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-[#77d4ff]/70 via-[#9d8bff]/70 to-[#f1a1ff]/70 opacity-0 transition group-hover:opacity-80 ${
                  active ? 'opacity-90 shadow-[0_12px_30px_-18px_rgba(145,122,255,0.7)]' : ''
                }`}
              />
              <span className="relative tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 text-xs text-white/80">
        <NetworkBadge mode={mode} chainId={meta.chainId} />
        <StatusBadge status={fhevm.status} error={fhevm.error} />
        {isConnected ? (
          <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            {truncateAddress(address)}
          </div>
        ) : (
          <button
            onClick={meta.connect}
            className="group relative overflow-hidden rounded-full px-6 py-2 text-sm font-semibold text-white"
          >
            <span className="absolute inset-0 -z-10 bg-gradient-to-r from-[#76d9ff] via-[#8d8bff] to-[#f59cf9] opacity-90 transition group-hover:scale-105" />
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  );
}

function NetworkBadge({
  mode,
  chainId,
}: {
  mode: "mock" | "relayer";
  chainId: number | undefined;
}) {
  const label =
    mode === "mock"
      ? "Local FHE Mock"
      : chainId === 11155111
        ? "Sepolia Relayer"
        : "Relayer Network";
  return (
    <span className="hidden items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1 text-white/70 lg:inline-flex">
      <span className="inline-flex h-2 w-2 rounded-full bg-sky-300" />
      {label}
    </span>
  );
}

function StatusBadge({
  status,
  error,
}: {
  status: string;
  error: Error | undefined;
}) {
  const isError = status === "error" || Boolean(error);
  return (
    <span
      className={`hidden items-center gap-2 rounded-full border px-4 py-1 text-white/80 lg:inline-flex ${
        isError ? 'border-red-400/70 bg-red-500/25' : 'border-emerald-400/60 bg-emerald-400/20'
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${isError ? 'bg-red-300' : 'bg-emerald-300'}`} />
      {isError ? 'FHEVM Error' : `FHEVM ${status}`}
    </span>
  );
}

