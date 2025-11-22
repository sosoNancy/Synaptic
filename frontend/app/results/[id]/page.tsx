'use client';

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { useNeuroFlashApp } from "@/components/neuroflash/NeuroFlashProvider";
import type { PulseSnapshot } from "@/hooks/useNeuroFlash";

export default function PulseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const pulseId = Number(params?.id ?? "0");
  const { neuroflash } = useNeuroFlashApp();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<PulseSnapshot | null>(null);

  const cached = useMemo(() => neuroflash.records.find((item) => item.id === pulseId), [neuroflash.records, pulseId]);

  useEffect(() => {
    if (!pulseId || Number.isNaN(pulseId)) {
      router.replace("/leaderboard");
      return;
    }

    const load = async () => {
      setLoading(true);
      if (cached) {
        setDetail(cached);
        setLoading(false);
        return;
      }
      const fetched = await neuroflash.loadPulse(pulseId);
      setDetail(fetched);
      setLoading(false);
    };

    load();
  }, [cached, neuroflash, pulseId, router]);

  if (loading) {
    return <div className="glass-card px-8 py-10 text-center text-white/70">Loading pulse details…</div>;
  }

  if (!detail) {
    return <div className="glass-card px-8 py-10 text-center text-white/70">Pulse #{pulseId} was not found. It may be pending or already cleared.</div>;
  }

  const isDecrypting = neuroflash.decryptingIds.has(detail.id);
  const displayScore =
    detail.exposure === "revealed"
      ? `${detail.latency} ms`
      : detail.decryptedLatency !== undefined
        ? `${detail.decryptedLatency} ms`
        : "🔐 Encrypted";

  return (
    <div className="space-y-12">
      <section className="glass-card px-8 py-8 text-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Synaptic Pulse Details · #{detail.id}</h1>
            <p className="text-sm text-white/70">Submitted at: {new Date(detail.submittedAt * 1000).toLocaleString()}</p>
            <p className="text-sm text-white/70">Pilot: {detail.pilot.slice(0, 6)}…{detail.pilot.slice(-4)}</p>
          </div>
          <Link
            href="/leaderboard"
            className="rounded-full border border-white/25 px-5 py-2 text-sm text-white/75 transition hover:border-white/45 hover:text-white"
          >
            Back to Leaderboard
          </Link>
        </div>

        <div className="mt-8 grid gap-4 text-sm md:grid-cols-2">
          <InfoRow label="Average Latency" value={displayScore} />
          <InfoRow label="Exposure Level" value={exposureLabel(detail.exposure)} />
          <InfoRow label="Rounds Played" value={`${detail.rounds}`} />
          <InfoRow label="Program" value={detail.programId ? `#${detail.programId}` : "Unassigned"} />
          <InfoRow label="Audit Status" value={detail.audited ? "Audited" : "Pending"} />
          <InfoRow label="Emblem Token" value={detail.emblemTokenId ? `Emblem #${detail.emblemTokenId}` : "Not awarded"} />
        </div>

        {detail.exposure !== "revealed" && (
          <div className="mt-8 rounded-2xl border border-white/15 bg-white/6 p-6 text-sm text-white/75">
            <p className="font-semibold text-white">Encrypted Data Notice</p>
            <p className="mt-2">
              This Synaptic Pulse is stored as Fully Homomorphic Encryption ciphertext. Submitters or authorized analysts can request decryption with the button below.
            </p>
            <button
              disabled={isDecrypting}
              onClick={() => neuroflash.decryptPulse(detail.id)}
              className="mt-4 rounded-full border border-[#7fd5ff]/50 px-4 py-2 text-sm text-[#b6ecff] transition hover:border-[#91deff] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {detail.decryptedLatency !== undefined ? "Decrypted" : isDecrypting ? "Decrypting…" : "Decrypt Pulse"}
            </button>
          </div>
        )}
      </section>

      <section className="glass-card px-8 py-7 text-white/75">
        <h2 className="text-xl font-semibold text-white">Exports & Proofs</h2>
        <p className="mt-3 text-sm">
          · Retrieve JSON payloads from browser storage or the IPFS manifest.
          <br />· Contract event logs provide immutable on-chain evidence; record the txHash for reference.
          <br />· Curators may award NeuroFlash Emblems as long-term recognition for outstanding performance.
        </p>
      </section>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/7 px-6 py-5">
      <p className="text-xs uppercase tracking-[0.3em] text-white/50">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function exposureLabel(exposure: string) {
  if (exposure === "revealed") return "Revealed";
  if (exposure === "encrypted") return "Sealed";
  return "Private";
}

