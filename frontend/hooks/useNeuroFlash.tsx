'use client';
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { ethers } from "ethers";

import { NeuroFlashLedgerABI } from "@/abi/NeuroFlashLedgerABI";
import { NeuroFlashLedgerAddresses } from "@/abi/NeuroFlashLedgerAddresses";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import type { FhevmInstance } from "@/fhevm/fhevmTypes";
import type { GenericStringStorage } from "@/fhevm/GenericStringStorage";

export type ExposureSetting = "shielded" | "encrypted" | "revealed";

type NeuroFlashContractInfo = {
  abi: typeof NeuroFlashLedgerABI.abi;
  address?: `0x${string}`;
  chainId?: number;
  chainName?: string;
};

export type PulseTelemetry = {
  average: number;
  best: number;
  worst: number;
  deviation: number;
};

export type RecordOptions = {
  rounds: number[];
  protocolMode: number;
  exposure: ExposureSetting;
  programId?: bigint;
  frameRate?: number;
};

export type RecordResultPayload = {
  pulseId?: number;
  txHash?: string;
  payloadHash: string;
  artifactCID: string;
  payloadJSON: string;
  encryptionKey?: string;
  encryptionIv?: string;
  ciphertext?: string;
};

export type PulseSnapshot = {
  id: number;
  pilot: string;
  latency: number | null;
  exposure: ExposureSetting;
  sealedHandle: string;
  decryptedLatency?: number;
  submittedAt: number;
  rounds: number;
  programId: number;
  audited: boolean;
  emblemTokenId?: number;
};

export type ProgramDescriptor = {
  id: number;
  curator: string;
  manifestCID: string;
  windowStart: number;
  windowEnd: number | null;
  rulesDigest: string;
};

export type ScheduleProgramOptions = {
  manifestCID: string;
  windowStart?: number | Date;
  windowEnd?: number | Date;
  rulesDigest: string;
};

function exposureToUint8(exposure: ExposureSetting): number {
  switch (exposure) {
    case "shielded":
      return 0;
    case "encrypted":
      return 1;
    case "revealed":
      return 2;
    default:
      return 0;
  }
}

function exposureFromUint8(value: number): ExposureSetting {
  if (value === 2) return "revealed";
  if (value === 1) return "encrypted";
  return "shielded";
}

function getContractByChainId(chainId: number | undefined): NeuroFlashContractInfo {
  if (!chainId) {
    return { abi: NeuroFlashLedgerABI.abi };
  }

  const entry = NeuroFlashLedgerAddresses[chainId.toString() as keyof typeof NeuroFlashLedgerAddresses];

  if (!entry || !("address" in entry) || entry.address === ethers.ZeroAddress) {
    return { abi: NeuroFlashLedgerABI.abi, chainId };
  }

  return {
    address: entry.address as `0x${string}`,
    chainId: entry.chainId ?? chainId,
    chainName: entry.chainName,
    abi: NeuroFlashLedgerABI.abi,
  };
}

function toBase64(array: Uint8Array): string {
  let binary = "";
  array.forEach((value) => {
    binary += String.fromCharCode(value);
  });
  return btoa(binary);
}

async function encryptPayload(payload: string): Promise<{ key: string; iv: string; ciphertext: string }>
{
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const rawKey = crypto.getRandomValues(new Uint8Array(32));
  const ivBytes = crypto.getRandomValues(new Uint8Array(12));

  const cryptoKey = await crypto.subtle.importKey("raw", rawKey, { name: "AES-GCM" }, false, ["encrypt"]);
  const cipherBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv: ivBytes }, cryptoKey, data);

  const ciphertext = toBase64(new Uint8Array(cipherBuffer));
  const key = toBase64(rawKey);
  const iv = toBase64(ivBytes);

  return { key, iv, ciphertext };
}

function computeTelemetry(rounds: number[]): PulseTelemetry {
  if (rounds.length === 0) {
    return { average: 0, best: 0, worst: 0, deviation: 0 };
  }
  const sum = rounds.reduce((acc, value) => acc + value, 0);
  const average = sum / rounds.length;
  const best = Math.min(...rounds);
  const worst = Math.max(...rounds);
  const variance = rounds.reduce((acc, value) => acc + Math.pow(value - average, 2), 0) / rounds.length;
  const deviation = Math.sqrt(variance);
  return { average, best, worst, deviation };
}

function fingerprintDevice(frameRate?: number) {
  if (typeof navigator === "undefined") {
    return {
      userAgent: "unknown",
      language: "unknown",
      platform: "unknown",
      hardwareConcurrency: 0,
      deviceMemory: 0,
      screen: { width: 0, height: 0, pixelRatio: 0 },
      frameRate,
    };
  }
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    hardwareConcurrency: navigator.hardwareConcurrency ?? 0,
    deviceMemory: (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 0,
    screen: {
      width: window.screen?.width ?? 0,
      height: window.screen?.height ?? 0,
      pixelRatio: window.devicePixelRatio ?? 0,
    },
    frameRate,
  };
}

export const useNeuroFlash = (parameters: {
  instance: FhevmInstance | undefined;
  fhevmDecryptionSignatureStorage: GenericStringStorage;
  eip1193Provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<(ethersSigner: ethers.JsonRpcSigner | undefined) => boolean>;
}) => {
  const {
    instance,
    fhevmDecryptionSignatureStorage,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
  } = parameters;

  const [message, setMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [records, setRecords] = useState<PulseSnapshot[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [decryptingIds, setDecryptingIds] = useState<Set<number>>(new Set());
  const [programs, setPrograms] = useState<ProgramDescriptor[]>([]);
  const [isRefreshingPrograms, setIsRefreshingPrograms] = useState<boolean>(false);

  const contractInfo = useMemo(() => {
    const info = getContractByChainId(chainId);
    if (!info.address) {
      setMessage(`NeuroFlashLedger deployment not found on this chain (chainId=${chainId}).`);
    }
    return info;
  }, [chainId]);

  const contractInterface = useMemo(() => new ethers.Interface(contractInfo.abi), [contractInfo.abi]);

  const readonlyContract = useMemo(() => {
    if (!contractInfo.address || !ethersReadonlyProvider) {
      return undefined;
    }
    return new ethers.Contract(contractInfo.address, contractInfo.abi, ethersReadonlyProvider);
  }, [contractInfo.address, contractInfo.abi, ethersReadonlyProvider]);

  const recordsRef = useRef<PulseSnapshot[]>([]);
  useEffect(() => {
    recordsRef.current = records;
  }, [records]);

  const refreshRecords = useCallback(async () => {
    if (!readonlyContract) return;
    try {
      setIsRefreshing(true);
      const total: bigint = await readonlyContract.pulseCount();
      const totalNumber = Number(total);
      const fetchCount = Math.min(10, totalNumber);
      const ids = Array.from({ length: fetchCount }, (_, i) => totalNumber - i).filter((id) => id > 0);

      const fetched = await Promise.all(
        ids.map(async (id) => {
          const view = await readonlyContract.viewPulse(id);
          const sealed = await readonlyContract.sealedPulseValue(id);
          return {
            id: Number(id),
            pilot: view.pilot as string,
            latency: view.latencyMs === 0n ? null : Number(view.latencyMs),
            exposure: exposureFromUint8(Number(view.exposure)),
            sealedHandle: sealed as string,
            submittedAt: Number(view.submittedAt),
            rounds: Number(view.rounds),
            programId: Number(view.programId),
            audited: Boolean(view.validated),
            emblemTokenId:
              view.emblemTokenId && view.emblemTokenId > 0n ? Number(view.emblemTokenId) : undefined,
          } satisfies PulseSnapshot;
        })
      );
      setRecords(fetched);
    } catch (error) {
      console.error(error);
      setMessage("Unable to sync the latest NeuroFlash records.");
    } finally {
      setIsRefreshing(false);
    }
  }, [readonlyContract]);

  useEffect(() => {
    refreshRecords();
  }, [refreshRecords]);

  const refreshPrograms = useCallback(async () => {
    if (!readonlyContract) return;
    try {
      setIsRefreshingPrograms(true);
      const total: bigint = await readonlyContract.programCount();
      const totalNumber = Number(total);
      const fetchCount = Math.min(8, totalNumber);
      const ids = Array.from({ length: fetchCount }, (_, i) => totalNumber - i).filter((id) => id > 0);

      const viewProgramFn = readonlyContract.getFunction("viewProgram");
      const fetched = await Promise.all(
        ids.map(async (id) => {
          const raw = await viewProgramFn(id);
          return {
            id,
            curator: raw.curator as string,
            manifestCID: raw.manifestCID as string,
            windowStart: Number(raw.windowStart),
            windowEnd: raw.windowEnd ? Number(raw.windowEnd) : null,
            rulesDigest: raw.rulesDigest as string,
          } satisfies ProgramDescriptor;
        })
      );
      setPrograms(fetched);
    } catch (error) {
      console.error(error);
    } finally {
      setIsRefreshingPrograms(false);
    }
  }, [readonlyContract]);

  useEffect(() => {
    refreshPrograms();
  }, [refreshPrograms]);

  useEffect(() => {
    if (!readonlyContract) return;
    const handlePulseRecorded = async () => {
      await refreshRecords();
    };
    readonlyContract.on("PulseRecorded", handlePulseRecorded);
    return () => {
      readonlyContract.off("PulseRecorded", handlePulseRecorded);
    };
  }, [readonlyContract, refreshRecords]);

  useEffect(() => {
    if (!readonlyContract) return;
    const handleProgramScheduled = async () => {
      await refreshPrograms();
    };
    readonlyContract.on("ProgramScheduled", handleProgramScheduled);
    return () => {
      readonlyContract.off("ProgramScheduled", handleProgramScheduled);
    };
  }, [readonlyContract, refreshPrograms]);

  const recordPulse = useCallback(
    async (options: RecordOptions): Promise<RecordResultPayload | undefined> => {
      if (!instance || !ethersSigner || !contractInfo.address) {
        setMessage("FHEVM or signer is not ready.");
        return undefined;
      }

      if (!options.rounds.length) {
        setMessage("Complete at least one valid test round first.");
        return undefined;
      }

      setIsSubmitting(true);
      try {
        const telemetry = computeTelemetry(options.rounds);
        const addr = await ethersSigner.getAddress();
        const timestamp = Date.now();
        const device = fingerprintDevice(options.frameRate);
        const payload = {
          brand: "NeuroFlash",
          wallet: addr,
          chainId,
          timestamp,
          protocolMode: options.protocolMode,
          rounds: options.rounds,
          telemetry,
          exposure: options.exposure,
          device,
        };

        const payloadJSON = JSON.stringify(payload);
        const payloadHash = ethers.keccak256(ethers.toUtf8Bytes(payloadJSON));
        const deviceHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(device)));

        const roundsCount = BigInt(options.rounds.length);
        const averageRounded = Math.round(telemetry.average);
        const latencyValue = options.exposure === "revealed" ? BigInt(averageRounded) : 0n;
        const programId = options.programId ?? 0n;

        const input = instance.createEncryptedInput(contractInfo.address, addr as `0x${string}`);
        input.add64(BigInt(averageRounded));
        const encrypted = await input.encrypt();

        let artifactCID = "";
        let encryptionArtifacts: { ciphertext: string; key: string; iv: string } | undefined;

        if (options.exposure === "revealed") {
          artifactCID = `ipfs://open-${payloadHash.slice(2, 10)}`;
        } else if (options.exposure === "encrypted") {
          const enc = await encryptPayload(payloadJSON);
          encryptionArtifacts = enc;
          artifactCID = `ipfs://sealed-${ethers.keccak256(ethers.toUtf8Bytes(enc.ciphertext)).slice(2, 10)}`;
        } else {
          if (typeof window !== "undefined") {
            try {
              window.localStorage.setItem(`neuroflash:${payloadHash}`, payloadJSON);
            } catch (error) {
              console.warn("Unable to cache Shielded payload locally", error);
            }
          }
        }

        const contract = readonlyContract
          ? readonlyContract.connect(ethersSigner)
          : new ethers.Contract(contractInfo.address, contractInfo.abi, ethersSigner);

        const tx = await (contract as any).recordPulse({
          payloadHash,
          artifactCID,
          latencyMs: latencyValue,
          protocolMode: options.protocolMode,
          exposure: exposureToUint8(options.exposure),
          programId,
          deviceFingerprint: deviceHash,
          rounds: roundsCount,
          sealedLatencyInput: encrypted.handles[0],
          sealedProof: encrypted.inputProof,
        });

        setMessage(`Broadcasting transaction… ${tx.hash}`);
        const receipt = await tx.wait();
        setMessage(`NeuroFlash record published on-chain, tx hash ${tx.hash}`);

        let pulseId: number | undefined;
        for (const log of receipt.logs ?? []) {
          try {
            const parsed = contractInterface.parseLog(log);
            if (parsed?.name === "PulseRecorded") {
              pulseId = Number(parsed.args.pulseId ?? parsed.args[0]);
            }
          } catch {
            // ignore parsing failures
          }
        }

        await refreshRecords();

        return {
          pulseId,
          txHash: tx.hash,
          payloadHash,
          artifactCID,
          payloadJSON,
          encryptionKey: encryptionArtifacts?.key,
          encryptionIv: encryptionArtifacts?.iv,
          ciphertext: encryptionArtifacts?.ciphertext,
        };
      } catch (error) {
        console.error(error);
        setMessage("Submission failed; please try again shortly.");
        return undefined;
      } finally {
        setIsSubmitting(false);
      }
    },
    [instance, ethersSigner, contractInfo.address, contractInfo.abi, chainId, readonlyContract, refreshRecords, contractInterface]
  );

  const decryptPulse = useCallback(
    async (pulseId: number) => {
      const current = recordsRef.current.find((item) => item.id === pulseId);
      if (!current || !instance || !ethersSigner || !contractInfo.address) {
        return;
      }
      if (current.decryptedLatency !== undefined) {
        return;
      }
      if (decryptingIds.has(pulseId)) {
        return;
      }

      setDecryptingIds((prev) => new Set(prev).add(pulseId));

      try {
        const signature = await FhevmDecryptionSignature.loadOrSign(
          instance,
          [contractInfo.address],
          ethersSigner,
          fhevmDecryptionSignatureStorage
        );

        if (!signature) {
          setMessage("Unable to generate decryption signature.");
          return;
        }

        const decryptedMap = await instance.userDecrypt(
          [{ handle: current.sealedHandle, contractAddress: contractInfo.address }],
          signature.privateKey,
          signature.publicKey,
          signature.signature,
          signature.contractAddresses,
          signature.userAddress,
          signature.startTimestamp,
          signature.durationDays
        );

        const decryptedValue = decryptedMap[current.sealedHandle];
        if (decryptedValue === undefined) {
          setMessage("Decryption returned no value.");
          return;
        }

        const latency = Number(decryptedValue);
        setRecords((prev) =>
          prev.map((item) => (item.id === pulseId ? { ...item, decryptedLatency: latency } : item))
        );
      } finally {
        setDecryptingIds((prev) => {
          const copy = new Set(prev);
          copy.delete(pulseId);
          return copy;
        });
      }
    },
    [contractInfo.address, decryptingIds, ethersSigner, fhevmDecryptionSignatureStorage, instance]
  );

  const loadPulse = useCallback(
    async (pulseId: number): Promise<PulseSnapshot | null> => {
      if (!readonlyContract) return null;
      try {
        const view = await readonlyContract.viewPulse(pulseId);
        const sealed = await readonlyContract.sealedPulseValue(pulseId);
        const mapped: PulseSnapshot = {
          id: pulseId,
          pilot: view.pilot as string,
          latency: view.latencyMs === 0n ? null : Number(view.latencyMs),
          exposure: exposureFromUint8(Number(view.exposure)),
          sealedHandle: sealed as string,
          submittedAt: Number(view.submittedAt),
          rounds: Number(view.rounds),
          programId: Number(view.programId),
          audited: Boolean(view.validated),
          emblemTokenId:
            view.emblemTokenId && view.emblemTokenId > 0n ? Number(view.emblemTokenId) : undefined,
        };
        setRecords((prev) => {
          const exists = prev.some((item) => item.id === pulseId);
          if (exists) {
            return prev.map((item) => (item.id === pulseId ? { ...item, ...mapped } : item));
          }
          return [...prev, mapped].sort((a, b) => b.id - a.id);
        });
        return mapped;
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    [readonlyContract]
  );

  const scheduleProgram = useCallback(
    async (options: ScheduleProgramOptions) => {
      if (!contractInfo.address || !ethersSigner) {
        setMessage("Wallet or network is not ready.");
        return undefined;
      }
      try {
        const normalize = (value?: number | Date) => {
          if (!value) return 0n;
          if (value instanceof Date) {
            return BigInt(Math.floor(value.getTime() / 1000));
          }
          return BigInt(Math.floor(value / 1000));
        };
        const contract = new ethers.Contract(contractInfo.address, contractInfo.abi, ethersSigner);
        const tx = await contract.scheduleProgram(
          options.manifestCID,
          normalize(options.windowStart),
          normalize(options.windowEnd),
          options.rulesDigest
        );
        setMessage("Program scheduling transaction sent.");
        await tx.wait();
        setMessage("Program registered successfully.");
        await refreshPrograms();
        return tx.hash;
      } catch (error) {
        console.error(error);
        setMessage("Failed to create program; check permissions.");
        return undefined;
      }
    },
    [contractInfo.address, contractInfo.abi, ethersSigner, refreshPrograms]
  );

  const requestCuratorAccess = useCallback(async () => {
    if (!contractInfo.address || !ethersSigner) {
      setMessage("Wallet or network is unavailable.");
      return undefined;
    }
    try {
      const contract = new ethers.Contract(contractInfo.address, contractInfo.abi, ethersSigner);
      const role: string = await contract.CURATOR_ROLE();
      const address = await ethersSigner.getAddress();
      const tx = await contract.grantRole(role, address);
      setMessage("CURATOR_ROLE request sent, awaiting confirmation…");
      await tx.wait();
      setMessage("Curator role granted successfully.");
      return tx.hash;
    } catch (error) {
      console.error(error);
      setMessage("Failed to request curator role; ensure this account has admin privileges.");
      return undefined;
    }
  }, [contractInfo.address, contractInfo.abi, ethersSigner]);

  const canSubmit = useMemo(() => {
    return Boolean(instance && ethersSigner && contractInfo.address && !isSubmitting);
  }, [instance, ethersSigner, contractInfo.address, isSubmitting]);

  return {
    contractAddress: contractInfo.address,
    isDeployed: Boolean(contractInfo.address && contractInfo.address !== ethers.ZeroAddress),
    canSubmit,
    recordPulse,
    isSubmitting,
    message,
    records,
    refreshRecords,
    decryptPulse,
    decryptingIds,
    isRefreshing,
    programs,
    refreshPrograms,
    scheduleProgram,
    isRefreshingPrograms,
    loadPulse,
    requestCuratorAccess,
  } as const;
};
