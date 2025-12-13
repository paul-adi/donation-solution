"use client";
import { create } from "zustand";

type WalletState = {
  address: string | null;
  chainId: string | null;
  setAddress: (addr: string | null) => void;
  setChainId: (cid: string | null) => void;
};

export const useWalletStore = create<WalletState>((set) => ({
  address: null,
  chainId: null,
  setAddress: (address) => set({ address }),
  setChainId: (chainId) => set({ chainId }),
}));
