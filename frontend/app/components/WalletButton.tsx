//WalletButton.tsx
"use client";

import { useEffect, useState, useRef } from "react";

function shortAddress(addr: string) {
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

export default function WalletButton() {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // check metamask plugin availability on browser
    const ethereum = (window as any)?.ethereum;
    if (!ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (!accounts || accounts.length === 0) setAddress(null);
      else setAddress(accounts[0]);
    };
    const handleChainChanged = (cid: string) => setChainId(cid);

    ethereum.on?.("accountsChanged", handleAccountsChanged);
    ethereum.on?.("chainChanged", handleChainChanged);

    // init
    (async () => {
      try {
        const accounts = await ethereum.request({ method: "eth_accounts" });
        if (accounts?.length) setAddress(accounts[0]);
        const cid = await ethereum.request({ method: "eth_chainId" });
        setChainId(cid);
      } catch (e: any) {
        // ignore
      }
    })();

    return () => {
      ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
      ethereum.removeListener?.("chainChanged", handleChainChanged);
    };
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  async function connect() {
    setError(null);
    try {
      const ethereum = (window as any)?.ethereum;
      if (!ethereum) throw new Error("MetaMask not detected");
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      setAddress(accounts[0]);
      const cid = await ethereum.request({ method: "eth_chainId" });
      setChainId(cid);
      setOpen(false);
    } catch (e: any) {
      setError(e?.message ?? "Failed to connect");
    }
  }

  function disconnect() {
    // UI-only disconnect
    setAddress(null);
    setChainId(null);
    setOpen(false);
  }

  async function switchToSepolia() {
    setError(null);
    try {
      const ethereum = (window as any)?.ethereum;
      if (!ethereum) throw new Error("MetaMask not detected");
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xAA36A7" }],
      });
      setOpen(false);
    } catch (err: any) {
      if (err?.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0xAA36A7",
                chainName: "Sepolia Testnet",
                nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                rpcUrls: ["https://sepolia.infura.io/v3/"],
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
              },
            ],
          });
        } catch (addErr: any) {
          setError(addErr?.message ?? "Failed to add Sepolia");
        }
      } else {
        setError(err?.message ?? "Failed to switch chain");
      }
    }
  }

  async function switchToMainnet() {
    setError(null);
    try {
      const ethereum = (window as any)?.ethereum;
      if (!ethereum) throw new Error("MetaMask not detected");
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x1" }],
      });
      setOpen(false);
    } catch (err: any) {
      if (err?.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x1",
                chainName: "Ethereum Mainnet",
                nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                rpcUrls: ["https://mainnet.infura.io/v3/"],
                blockExplorerUrls: ["https://etherscan.io"],
              },
            ],
          });
        } catch (addErr: any) {
          setError(addErr?.message ?? "Failed to add Mainnet");
        }
      } else {
        setError(err?.message ?? "Failed to switch chain");
      }
    }
  }

  return (
    <div ref={ref} className="wallet-root">
      {!address ? (
        <button className="wallet-btn" onClick={connect}>
          Connect Wallet
        </button>
      ) : (
        <div style={{ position: "relative" }}>
          <button
            className="wallet-btn wallet-connected"
            onClick={() => setOpen((s) => !s)}
            aria-expanded={open}
          >
            <span className="dot" />
            {shortAddress(address)}
            <span className="chev">▾</span>
          </button>

          {open && (
            <div className="wallet-menu">
              <div className="menu-row">
                <div>
                  <strong>Address</strong>
                </div>
                <div className="mono">{shortAddress(address)}</div>
              </div>

              <div className="menu-row">
                <div>
                  <strong>Chain</strong>
                </div>
                <div className="mono">{chainId ?? "unknown"}</div>
              </div>

              <button className="menu-btn" onClick={switchToSepolia}>
                Switch to Sepolia
              </button>

              <button className="menu-btn" onClick={switchToMainnet}>
                Switch to Mainnet
              </button>

              <button className="menu-btn ghost" onClick={disconnect}>
                Disconnect
              </button>

              {error && <div className="menu-error">{error}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
