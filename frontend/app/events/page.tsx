'use client';

import { useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";

import { useNeuroFlashApp } from "@/components/neuroflash/NeuroFlashProvider";
import type { ProgramDescriptor } from "@/hooks/useNeuroFlash";

export default function ProgramsPage() {
  const { neuroflash } = useNeuroFlashApp();
  const [manifestCID, setManifestCID] = useState("");
  const [rules, setRules] = useState("");
  const [windowStart, setWindowStart] = useState<string>("");
  const [windowEnd, setWindowEnd] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!rules) return;
    try {
      setIsSubmitting(true);
      const rulesDigest = ethers.keccak256(ethers.toUtf8Bytes(rules));
      const startTimestamp = windowStart ? new Date(windowStart) : undefined;
      const endTimestamp = windowEnd ? new Date(windowEnd) : undefined;
      await neuroflash.scheduleProgram({
        manifestCID,
        rulesDigest,
        windowStart: startTimestamp,
        windowEnd: endTimestamp,
      });
      setManifestCID("");
      setRules("");
      setWindowStart("");
      setWindowEnd("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-12">
      <section className="rounded-[28px] border border-white/12 bg-gradient-to-br from-[#1f1b39]/85 via-[#161b2b]/85 to-[#0b111c]/90 p-8 text-white">
        <h1 className="text-3xl font-semibold">Program Curation</h1>
        <p className="mt-2 text-sm text-white/70">
          Curators can create Synaptic Programs, define scheduling windows, and pin rule digests. Players select a program when submitting pulses for research or competitions.
        </p>
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-4 text-sm text-white/70 lg:flex-row lg:items-center lg:justify-between">
          <p>If your account is not yet a curator, send an authorization request (requires an administrator to approve).</p>
          <button
            onClick={async () => {
              try {
                setIsRequesting(true);
                await neuroflash.requestCuratorAccess();
              } finally {
                setIsRequesting(false);
              }
            }}
            disabled={isRequesting}
            className="rounded-full border border-fuchsia-300/40 px-5 py-2 text-xs text-fuchsia-100 transition hover:border-fuchsia-100 hover:text-fuchsia-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRequesting ? "Requesting…" : "Request Curator Access"}
          </button>
        </div>
        <form onSubmit={submitForm} className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-xs uppercase tracking-[0.3em] text-white/45">Program Manifest CID</label>
            <input
              value={manifestCID}
              onChange={(e) => setManifestCID(e.target.value)}
              placeholder="ipfs://..."
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-cyan-300 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-white/45">Start Time</label>
            <input
              type="datetime-local"
              value={windowStart}
              onChange={(e) => setWindowStart(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-cyan-300 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-white/45">End Time</label>
            <input
              type="datetime-local"
              value={windowEnd}
              onChange={(e) => setWindowEnd(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-cyan-300 focus:outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs uppercase tracking-[0.3em] text-white/45">Program Rules / Validation Notes</label>
            <textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              rows={4}
              placeholder="Example: submit average of 5 rounds; include camera recording link, etc."
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-cyan-300 focus:outline-none"
              required
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="relative overflow-hidden rounded-full px-6 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="absolute inset-0 -z-10 bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 opacity-90 transition hover:scale-105" />
              {isSubmitting ? "Creating…" : "Create Program"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-[28px] border border-white/12 bg-[#0f1525]/85 p-8 text-white">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Registered Synaptic Programs</h2>
          <button
            onClick={() => neuroflash.refreshPrograms()}
            disabled={neuroflash.isRefreshingPrograms}
            className="rounded-full border border-white/15 px-4 py-2 text-xs text-white/70 transition hover:border-white/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {neuroflash.isRefreshingPrograms ? "Refreshing…" : "Refresh"}
          </button>
        </div>
        <div className="mt-6 space-y-4">
          {neuroflash.programs.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-6 text-center text-sm text-white/60">
              No Synaptic Programs have been created yet.
            </p>
          ) : (
            neuroflash.programs.map((program) => <ProgramCard key={program.id} program={program} />)
          )}
        </div>
      </section>
    </div>
  );
}

function ProgramCard({ program }: { program: ProgramDescriptor }) {
  const start = program.windowStart ? new Date(program.windowStart * 1000).toLocaleString() : "Not set";
  const end = program.windowEnd ? new Date(program.windowEnd * 1000).toLocaleString() : "Open";
  return (
    <div className="rounded-2xl border border-white/12 bg-white/5 p-5 text-sm text-white/75">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs uppercase tracking-[0.3em] text-white/45">Program #{program.id}</span>
        <span className="rounded-full border border-white/12 bg-white/5 px-3 py-1 text-xs text-white/60">
          Curator：{program.curator.slice(0, 6)}…{program.curator.slice(-4)}
        </span>
      </div>
      <p className="mt-3 text-xs text-white/55">Window: {start} — {end}</p>
      <p className="mt-3 break-all text-xs text-white/50">CID: {program.manifestCID || "N/A"}</p>
      <p className="mt-2 break-all text-xs text-white/50">rulesDigest: {program.rulesDigest}</p>
      <Link
        href={`/events/${program.id}`}
        className="mt-4 inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1 text-xs text-white/70 transition hover:border-white/35 hover:text-white"
      >
        View Details →
      </Link>
    </div>
  );
}

