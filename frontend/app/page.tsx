'use client';

import Link from "next/link";

import { useNeuroFlashApp } from "@/components/neuroflash/NeuroFlashProvider";

const STAT_ACCENTS = [
  "from-[#74d4ff] to-[#4cbfff]",
  "from-[#9f8dff] to-[#6d5bff]",
  "from-[#6ff2cf] to-[#3ec6a8]",
  "from-[#ffb9f5] to-[#fe8dc9]",
];

export default function HomePage() {
  const { meta, neuroflash, fhevm, mode } = useNeuroFlashApp();
  const recent = neuroflash.records.slice(0, 4);
  const spotlight = neuroflash.programs.slice(0, 3);

  return (
    <div className="space-y-16">
      <Hero metaConnected={meta.isConnected} onConnect={async () => { meta.connect(); }} stats={{ neuroflash, fhevm, mode }} />

      <section className="grid gap-10 lg:grid-cols-[2fr_1fr]">
        <div className="glass-card space-y-6 px-8 py-7">
          <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="section-title">Latest Synaptic Pulses</h2>
              <p className="section-subtitle">Showcases the most recent NeuroFlashLedger reaction entries.</p>
            </div>
            <Link href="/leaderboard" className="text-sm text-[#8fc9ff] transition hover:text-white">
              Browse Leaderboard →
            </Link>
          </header>

          {recent.length === 0 ? (
            <EmptyState message="No records yet. Complete a flash drill to light up your first pulse." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {recent.map((pulse) => (
                <Link
                  key={pulse.id}
                  href={`/results/${pulse.id}`}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-white/75 transition hover:border-[#86d9ff]/40"
                >
                  <span className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(126,196,255,0.35),transparent_55%)] opacity-0 transition group-hover:opacity-100" />
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/45">
                    <span>Pulse #{pulse.id}</span>
                    <span className={`rounded-full border px-3 py-1 text-[11px] font-medium ${badgeTone(pulse.exposure)}`}>
                      {exposureLabel(pulse.exposure)}
                    </span>
                  </div>
                  <p className="mt-4 text-2xl font-semibold text-white">
                    {pulse.exposure === "revealed"
                      ? `${pulse.latency ?? '--'} ms`
                      : pulse.decryptedLatency !== undefined
                        ? `${pulse.decryptedLatency} ms`
                        : '🔐 Encrypted'}
                  </p>
                  <p className="mt-2 text-xs text-white/55">
                    {new Date(pulse.submittedAt * 1000).toLocaleString()} · {pulse.pilot.slice(0, 6)}…{pulse.pilot.slice(-4)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <aside className="glass-card space-y-5 px-6 py-6">
          <header className="flex items-center justify-between text-white">
            <h2 className="text-xl font-semibold">Program Radar</h2>
            <Link href="/events" className="text-xs text-[#d4b7ff] transition hover:text-white">
              Manage Programs →
            </Link>
          </header>
          {spotlight.length === 0 ? (
            <EmptyState message="No programs yet. Curators can launch new events or studies." />
          ) : (
            <div className="space-y-4">
              {spotlight.map((program) => (
                <div key={program.id} className="rounded-2xl border border-white/10 bg-white/6 p-4 text-xs text-white/70">
                  <div className="flex items-center justify-between">
                    <span className="uppercase tracking-[0.35em] text-white/45">Program #{program.id}</span>
                    <span>{program.curator.slice(0, 6)}…{program.curator.slice(-4)}</span>
                  </div>
                  <p className="mt-2 text-[11px] text-white/50">
                    Window: {program.windowStart ? new Date(program.windowStart * 1000).toLocaleString() : 'Not set'} — {program.windowEnd ? new Date(program.windowEnd * 1000).toLocaleString() : 'Open'}
                  </p>
                  <p className="mt-2 break-all text-[11px] text-white/45">CID: {program.manifestCID || 'N/A'}</p>
                </div>
              ))}
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

function Hero({
  metaConnected,
  onConnect,
  stats,
}: {
  metaConnected: boolean;
  onConnect: () => Promise<void>;
  stats: { neuroflash: ReturnType<typeof useNeuroFlashApp>['neuroflash']; fhevm: ReturnType<typeof useNeuroFlashApp>['fhevm']; mode: ReturnType<typeof useNeuroFlashApp>['mode'] };
}) {
  const { neuroflash, fhevm, mode } = stats;
  const statValues = [
    { title: "Operating Mode", value: mode === "mock" ? "Local FHE Mock" : "Relayer" },
    { title: "FHEVM Status", value: fhevm.status === "error" ? "Error" : fhevm.status },
    { title: "Pulse Entries", value: `${neuroflash.records.length} records` },
    { title: "Programs", value: `${neuroflash.programs.length} items` },
  ];

  return (
    <section className="relative overflow-hidden rounded-[36px] border border-white/12 bg-[linear-gradient(135deg,rgba(44,67,115,0.7),rgba(28,32,60,0.8))] px-10 py-12">
      <div className="absolute inset-0 opacity-80" style={{ background: "radial-gradient(circle at 15% 20%, rgba(132,203,255,0.35), transparent 50%), radial-gradient(circle at 80% 15%, rgba(200,129,255,0.35), transparent 55%)" }} />
      <div className="relative grid gap-12 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-7 text-white">
          <span className="badge">NeuroFlash Atlas</span>
          <h1 className="text-4xl font-semibold leading-snug md:text-5xl">Build Your Neuro Response Ledger</h1>
          <p className="text-base text-white/75 md:w-4/5">
            NeuroFlash Ledger brings reaction trials into the age of fully homomorphic encryption. Train, record, authorize decryption, and issue emblems with verifiable latency data.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/test"
              className="group relative overflow-hidden rounded-full px-7 py-3 text-sm font-semibold text-white"
            >
              <span className="absolute inset-0 -z-10 bg-gradient-to-r from-[#74d4ff] via-[#8d8eff] to-[#ff9cf7] opacity-95 transition group-hover:scale-105" />
              Start Flash Training
            </Link>
            <Link
              href="/leaderboard"
              className="rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white/75 transition hover:border-white/45 hover:text-white"
            >
              View Pulse Leaderboard
            </Link>
          </div>
        </div>

        <div className="glass-card grid gap-4 rounded-3xl border border-white/15 bg-white/10 p-6 text-white/80">
          {statValues.map((stat, index) => (
            <StatCard key={stat.title} title={stat.title} value={stat.value} accent={STAT_ACCENTS[index % STAT_ACCENTS.length]} />
          ))}
          {!metaConnected && (
            <button
              onClick={onConnect}
              className="mt-2 w-full rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/35 hover:text-white"
            >
              Connect MetaMask to unlock the full experience
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function StatCard({ title, value, accent }: { title: string; value: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/8 p-4 shadow-[0_18px_35px_-28px_rgba(143,199,255,0.6)]">
      <p className="text-xs uppercase tracking-[0.35em] text-white/50">{title}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
      <div className={`mt-4 h-[3px] w-20 rounded-full bg-gradient-to-r ${accent}`} />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 px-5 py-14 text-center text-sm text-white/60">
      {message}
    </div>
  );
}

function exposureLabel(exposure: string) {
  if (exposure === "revealed") return "Revealed";
  if (exposure === "encrypted") return "Sealed";
  return "Private";
}

function badgeTone(exposure: string) {
  if (exposure === "revealed") return "border-emerald-300/70 text-emerald-200 bg-emerald-400/15";
  if (exposure === "encrypted") return "border-cyan-300/70 text-cyan-200 bg-cyan-300/12";
  return "border-white/25 text-white/55 bg-white/10";
}
