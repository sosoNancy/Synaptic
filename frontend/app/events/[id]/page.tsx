'use client';

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo } from "react";

import { useNeuroFlashApp } from "@/components/neuroflash/NeuroFlashProvider";

export default function ProgramDetailPage() {
  const { neuroflash } = useNeuroFlashApp();
  const { refreshPrograms, refreshRecords, programs, records } = neuroflash;
  const params = useParams<{ id: string }>();
  const programId = Number(params?.id ?? "0");

  useEffect(() => {
    refreshPrograms();
    refreshRecords();
  }, [refreshPrograms, refreshRecords]);

  const program = useMemo(() => programs.find((item) => item.id === programId), [programs, programId]);
  const programRecords = useMemo(
    () => records.filter((item) => item.programId === programId).sort((a, b) => b.id - a.id),
    [records, programId]
  );

  if (!program) {
    return (
      <div className="glass-card px-8 py-10 text-center text-white/70">
        Program #{programId} was not found. Confirm the ID and refresh to try again.
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <section className="glass-card px-8 py-8 text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Synaptic Program · #{program.id}</h1>
            <p className="text-sm text-white/70">
              Curator：{program.curator.slice(0, 6)}…{program.curator.slice(-4)}
            </p>
            <p className="text-sm text-white/70">
              Window: {program.windowStart ? new Date(program.windowStart * 1000).toLocaleString() : "Not set"} —{" "}
              {program.windowEnd ? new Date(program.windowEnd * 1000).toLocaleString() : "Open"}
            </p>
          </div>
          <Link
            href={`/test?programId=${program.id}`}
            className="relative overflow-hidden rounded-full px-6 py-2 text-sm font-semibold text-white"
          >
            <span className="absolute inset-0 -z-10 bg-gradient-to-r from-[#72d7ff] via-[#9c8aff] to-[#ff9ef2] opacity-95 transition hover:scale-105" />
            Join Program & Submit Pulse
          </Link>
        </div>
        <p className="mt-4 text-xs text-white/60 break-all">CID: {program.manifestCID || "N/A"}</p>
        <p className="mt-2 text-xs text-white/60 break-all">rulesDigest: {program.rulesDigest}</p>
      </section>

      <section className="glass-card px-8 py-8 text-white">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Linked Synaptic Pulses ({programRecords.length})</h2>
          <button
            onClick={() => refreshRecords()}
            className="rounded-full border border-white/20 px-4 py-2 text-xs text-white/70 transition hover:border-white/35 hover:text-white"
          >
            Refresh
          </button>
        </div>
        <div className="mt-5 space-y-4">
          {programRecords.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/18 bg-white/6 px-4 py-6 text-center text-sm text-white/65">
              No pulses have been submitted for this program yet. Be the first explorer.
            </p>
          ) : (
            programRecords.map((pulse) => (
              <Link
                key={pulse.id}
                href={`/results/${pulse.id}`}
                className="flex flex-col gap-2 rounded-2xl border border-white/12 bg-white/7 px-5 py-4 text-sm text-white/75 transition hover:border-[#7fd5ff]/40 hover:text-white"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="font-semibold text-white">Pulse #{pulse.id}</span>
                  <span className={`rounded-full border px-3 py-1 text-xs ${badgeTone(pulse.exposure)}`}>
                    {exposureLabel(pulse.exposure)}
                  </span>
                </div>
                <p className="text-xs text-white/60">
                  Pilot: {pulse.pilot.slice(0, 6)}…{pulse.pilot.slice(-4)} · {new Date(pulse.submittedAt * 1000).toLocaleString()}
                </p>
                <p className="text-xs text-white/60">
                  Result:
                  {pulse.exposure === "revealed"
                    ? `${pulse.latency ?? '--'} ms`
                    : pulse.decryptedLatency !== undefined
                      ? `${pulse.decryptedLatency} ms`
                      : '🔐 Encrypted'}
                </p>
              </Link>
            ))
          )}
        </div>
      </section>
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

