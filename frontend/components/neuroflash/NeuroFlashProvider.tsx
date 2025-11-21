"use client";

import { createContext, useContext, type ReactNode } from "react";

import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useNeuroFlash } from "@/hooks/useNeuroFlash";

type NeuroFlashContextValue = ReturnType<typeof useNeuroFlashContextValue>;

const NeuroFlashContext = createContext<NeuroFlashContextValue | undefined>(undefined);

function useNeuroFlashContextValue() {
  const meta = useMetaMaskEthersSigner();
  const { storage } = useInMemoryStorage();
  const fhevm = useFhevm({
    provider: meta.provider,
    chainId: meta.chainId,
    initialMockChains: meta.initialMockChains,
    enabled: true,
  });

  const neuroflash = useNeuroFlash({
    instance: fhevm.instance,
    fhevmDecryptionSignatureStorage: storage,
    eip1193Provider: meta.provider,
    chainId: meta.chainId,
    ethersSigner: meta.ethersSigner,
    ethersReadonlyProvider: meta.ethersReadonlyProvider,
    sameChain: meta.sameChain,
    sameSigner: meta.sameSigner,
  });

  const isMockNetwork =
    meta.chainId && Object.keys(meta.initialMockChains ?? {}).includes(String(meta.chainId));

  return {
    meta,
    fhevm,
    neuroflash,
    mode: isMockNetwork ? "mock" : "relayer",
  } as const;
}

export function NeuroFlashProvider({ children }: { children: ReactNode }) {
  const value = useNeuroFlashContextValue();
  return <NeuroFlashContext.Provider value={value}>{children}</NeuroFlashContext.Provider>;
}

export function useNeuroFlashApp() {
  const context = useContext(NeuroFlashContext);
  if (!context) {
    throw new Error("useNeuroFlashApp must be used within NeuroFlashProvider");
  }
  return context;
}

