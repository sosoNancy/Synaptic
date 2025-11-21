'use client';

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import { useNeuroFlashApp } from "@/components/neuroflash/NeuroFlashProvider";
import type { ExposureSetting, RecordOptions } from "@/hooks/useNeuroFlash";

type Phase = "idle" | "arming" | "ready" | "finished";

type ModeProfile = {
  label: string;
  description: string;
  rounds: number;
  protocol: number;
  gradient: string;
};

const MODE_PROFILES: ModeProfile[] = [
  {
    label: "Rapid Single",
    description: "One extreme reaction trial, perfect for warm-up",
    rounds: 1,
    protocol: 1,
    gradient: "from-[#74d4ff]/80 via-[#5faef8]/70 to-[#826bff]/80",
  },
  {
    label: "Neural Five",
    description: "Tournament-ready baseline with balanced stability",
    rounds: 5,
    protocol: 2,
    gradient: "from-[#ff7ad6]/80 via-[#a47bff]/75 to-[#6cd7ff]/80",
  },
  {
    label: "Endurance Ten",
    description: "Research-grade long run to observe variance",
    rounds: 10,
    protocol: 3,
    gradient: "from-[#71f2cf]/80 via-[#3ecfaa]/70 to-[#6cc7ff]/80",
  },
];

const EXPOSURE_CHOICES: { value: ExposureSetting; label: string; helper: string }[] = [
  { value: "revealed", label: "Revealed", helper: "Average latency stored on-chain as plaintext" },
  { value: "encrypted", label: "Sealed", helper: "On-chain ciphertext plus AES artifact" },
  { value: "shielded", label: "Private", helper: "Hash commitment only; raw JSON stays local" },
];

export function ReactionTester({ initialEventId }: { initialEventId?: number }) {
  const {
    neuroflash,
    meta: { connect, isConnected },
  } = useNeuroFlashApp();

  const [modeIndex, setModeIndex] = useState(1);
  const activeMode = MODE_PROFILES[modeIndex];
  const [exposure, setExposure] = useState<ExposureSetting>("revealed");
  const [phase, setPhase] = useState<Phase>("idle");
  const [roundIndex, setRoundIndex] = useState(0);
  const [roundTimes, setRoundTimes] = useState<number[]>([]);
  const [prompt, setPrompt] = useState("Tap the center to start the flash pulse");
  const [frameRate, setFrameRate] = useState<number | undefined>();
  const [earlyPenalty, setEarlyPenalty] = useState(false);
  const [lastTx, setLastTx] = useState<string | undefined>(undefined);
  const [linkedProgram, setLinkedProgram] = useState<number | null>(initialEventId ?? null);

  const startRef = useRef<number>(0);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (initialEventId !== undefined) {
      setLinkedProgram(initialEventId);
    }
  }, [initialEventId]);

  useEffect(() => {
    let frameId: number;
    let frames = 0;
    let start = performance.now();
    const track = (timestamp: number) => {
      frames += 1;
      if (timestamp - start >= 1000) {
        setFrameRate(frames);
        frames = 0;
        start = timestamp;
      }
      frameId = requestAnimationFrame(track);
    };
    frameId = requestAnimationFrame(track);
    return () => cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => () => timerRef.current && clearTimeout(timerRef.current), []);

  const telemetry = useMemo(() => {
    if (!roundTimes.length) {
      return { average: 0, best: 0, worst: 0, deviation: 0 };
    }
    const sum = roundTimes.reduce((acc, v) => acc + v, 0);
    const average = sum / roundTimes.length;
    const best = Math.min(...roundTimes);
    const worst = Math.max(...roundTimes);
    const deviation = Math.sqrt(roundTimes.reduce((acc, num) => acc + Math.pow(num - average, 2), 0) / roundTimes.length);
    return {
      average: Math.round(average),
      best,
      worst,
      deviation: Math.round(deviation),
    };
  }, [roundTimes]);

  const resetTester = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setRoundIndex(0);
    setRoundTimes([]);
    setPhase("idle");
    setPrompt("Tap the center to start the flash pulse");
    setEarlyPenalty(false);
  };

  const scheduleRound = () => {
    setPhase("arming");
    const delay = Math.floor(Math.random() * 2200) + 1000;
    setPrompt("Ready… stay focused");
    timerRef.current = window.setTimeout(() => {
      startRef.current = performance.now();
      setPhase("ready");
      setPrompt("Flash! Tap now!");
    }, delay);
  };

  const completeRound = (delta: number) => {
    const updated = [...roundTimes, delta];
    setRoundTimes(updated);

    if (roundIndex + 1 >= activeMode.rounds) {
      setPhase("finished");
      setPrompt("Test complete, publish it on-chain.");
      setRoundIndex(activeMode.rounds);
    } else {
      setRoundIndex((idx) => idx + 1);
      scheduleRound();
      setPrompt(`Reaction #${roundIndex + 1}: ${delta} ms`);
    }
  };

  const handleConsoleTap = () => {
    if (!isConnected) {
      connect();
      return;
    }
    if (phase === "idle") {
      resetTester();
      scheduleRound();
      return;
    }
    if (phase === "arming") {
      setEarlyPenalty(true);
      setPrompt("Too fast! Wait for the flash cue.");
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        setEarlyPenalty(false);
        scheduleRound();
      }, 900);
      return;
    }
    if (phase === "ready") {
      const delta = Math.round(performance.now() - startRef.current);
      completeRound(delta);
      return;
    }
    if (phase === "finished") {
      resetTester();
      scheduleRound();
    }
  };

  const submitPulse = async () => {
    if (!neuroflash.canSubmit || !roundTimes.length) return;
    const options: RecordOptions = {
      rounds: roundTimes,
      protocolMode: activeMode.protocol,
      exposure,
      frameRate,
      programId: linkedProgram ? BigInt(linkedProgram) : undefined,
    };
    const result = await neuroflash.recordPulse(options);
    if (result?.txHash) {
      setLastTx(result.txHash);
    }
  };

  const programLabel =
    linkedProgram !== null
      ? neuroflash.programs.find((p) => p.id === linkedProgram)?.manifestCID || `Program #${linkedProgram}`
      : "Unassigned";

  const padGradient =
    phase === "ready"
      ? "from-[#71f2cf]/85 via-[#4dd9ff]/80 to-[#6b8bff]/85"
      : phase === "arming"
        ? "from-[#ffb86c]/80 via-[#ff7aa5]/70 to-[#a57bff]/75"
        : "from-white/10 via-white/6 to-white/10";

  return (
    <section className="grid gap-10 xl:grid-cols-[1.8fr_1.2fr]">
      <div className="space-y-7">
        <div className="glass-card px-7 py-7">
          <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-white">NeuroFlash Flash Console</h2>
              <p className="text-sm text-white/70">
                Randomized delays keep reactions unpredictable; averages are FHE-encrypted on-chain for controlled disclosure.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 text-xs text-white/70">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2">
                Frame rate: {frameRate ?? "--"} fps
              </span>
              <label className="flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2">
                <span>Linked program:</span>
                <select
                  value={linkedProgram ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setLinkedProgram(value ? Number(value) : null);
                  }}
                  className="rounded-xl border border-white/20 bg-[#0f1628]/85 px-2 py-1 text-xs text-white focus:border-[#7fd5ff] focus:outline-none"
                >
                  <option value="">No program</option>
                  {neuroflash.programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      #{program.id} · {program.manifestCID || 'No CID'}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </header>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {MODE_PROFILES.map((profile, index) => {
              const active = index === modeIndex;
              return (
                <button
                  key={profile.protocol}
                  onClick={() => {
                    setModeIndex(index);
                    resetTester();
                  }}
                  className={`relative overflow-hidden rounded-2xl border px-4 py-4 text-left transition ${
                    active ? 'border-white/60 text-white shadow-[0_24px_60px_-36px_rgba(126,176,255,0.9)]' : 'border-white/12 text-white/70 hover:border-white/25 hover:text-white'
                  }`}
                >
                  <span className={`absolute inset-0 -z-10 bg-gradient-to-br ${profile.gradient} ${active ? 'opacity-90' : 'opacity-0'} transition`} />
                  <span className="text-xs uppercase tracking-[0.3em] text-white/60">Protocol {profile.protocol}</span>
                  <span className="mt-3 block text-lg font-semibold">{profile.label}</span>
                  <span className="mt-1 block text-xs text-white/60">{profile.description}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {EXPOSURE_CHOICES.map((choice) => {
              const active = choice.value === exposure;
              return (
                <button
                  key={choice.value}
                  onClick={() => setExposure(choice.value)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    active
                      ? 'border-[#7fd5ff] bg-[#7fd5ff]/20 text-white shadow-[0_16px_40px_-32px_rgba(108,209,255,0.8)]'
                      : 'border-white/12 text-white/70 hover:border-white/25 hover:text-white'
                  }`}
                >
                  <span className="text-sm font-semibold">{choice.label}</span>
                  <span className="mt-1 block text-xs text-white/55">{choice.helper}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div
          role="button"
          onClick={handleConsoleTap}
          className={`relative flex h-[21rem] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[32px] border bg-gradient-to-br ${padGradient} transition`}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={prompt}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.28 }}
              className="px-6 text-3xl font-semibold text-white text-center drop-shadow"
            >
              {prompt}
            </motion.span>
          </AnimatePresence>
          <AnimatePresence>
            {earlyPenalty && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                className="absolute bottom-10 rounded-full bg-red-500/85 px-5 py-2 text-xs font-medium text-white"
              >
                Triggered too early, recalibrating
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <MetricCard label="Average Reaction" value={telemetry.average ? `${telemetry.average} ms` : "--"} />
          <MetricCard label="Best Result" value={telemetry.best ? `${telemetry.best} ms` : "--"} />
          <MetricCard label="Slowest Result" value={telemetry.worst ? `${telemetry.worst} ms` : "--"} />
          <MetricCard label="Variance (σ)" value={telemetry.deviation ? `${telemetry.deviation} ms` : "--"} />
        </div>

        <div className="glass-card px-7 py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">Pulse Summary</h3>
              <p className="text-sm text-white/65">
                Recorded {roundTimes.length} / {activeMode.rounds} rounds · Program: {programLabel}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={resetTester}
                className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/70 transition hover:border-white/30 hover:text-white"
              >
                Reset
              </button>
              <button
                onClick={submitPulse}
                disabled={!roundTimes.length || phase !== "finished" || !neuroflash.canSubmit || neuroflash.isSubmitting}
                className="relative overflow-hidden rounded-full px-6 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
              >
                <span className="absolute inset-0 -z-10 bg-gradient-to-r from-[#8ad2ff] via-[#b391ff] to-[#ff98e5] opacity-95 transition hover:scale-105" />
                {neuroflash.isSubmitting ? "Submitting…" : "Publish Pulse"}
              </button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/70">
            {roundTimes.map((value, index) => (
              <span key={index} className="rounded-full border border-white/15 bg-white/8 px-3 py-1 text-white">
                #{index + 1} {value} ms
              </span>
            ))}
          </div>
          {neuroflash.message && <p className="mt-4 text-sm text-[#8edcff]">{neuroflash.message}</p>}
          {lastTx && (
            <p className="mt-2 text-xs text-white/55">Latest tx hash: {lastTx}</p>
          )}
        </div>
      </div>

      <aside className="space-y-6">
        <div className="glass-card px-6 py-6 text-white">
          <h3 className="text-xl font-semibold">How to Operate</h3>
          <ul className="mt-4 space-y-3 text-sm text-white/70">
            <li>• Random delay plus flash cues defeat scripting and keep outcomes unpredictable.</li>
            <li>• Browser logs frame rate and device fingerprint to aid audits and research reproducibility.</li>
            <li>• Revealed / Sealed / Private modes let you control how widely results are shared.</li>
            <li>• After publishing you can fetch proofs from the leaderboard or grant curator decryption.</li>
          </ul>
        </div>

        <div className="glass-card px-6 py-6 text-white">
          <h3 className="text-lg font-semibold">Exposure Recommendations</h3>
          <div className="mt-4 space-y-4 text-sm text-white/70">
            <div>
              <p className="font-semibold text-white">Revealed</p>
              <p className="mt-1">Great for competitive leaderboards where everyone can verify the score.</p>
            </div>
            <div>
              <p className="font-semibold text-white">Sealed</p>
              <p className="mt-1">Keeps ciphertext on-chain with an AES artifact so trusted peers can unlock with a shared key.</p>
            </div>
            <div>
              <p className="font-semibold text-white">Private</p>
              <p className="mt-1">Writes only a hash proof, ideal for personal drills or sensitive datasets.</p>
            </div>
          </div>
        </div>
      </aside>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/12 bg-white/6 p-5 shadow-[0_20px_40px_-32px_rgba(106,166,255,0.7)]">
      <span className="text-xs uppercase tracking-[0.3em] text-white/55">{label}</span>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

