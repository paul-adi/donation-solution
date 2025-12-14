// Header.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import WalletButton from "./WalletButton";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-sky-400 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image src="/usdcseed.png" width={36} height={36} alt="SEED" />
            <span className="font-bold text-white">SEED</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-3">
            <NavLink href="/about">About</NavLink>
            <NavLink href="/create-campaign">Create Campaign</NavLink>
            <NavLink href="/withdrawal">Withdrawal</NavLink>
            <NavLink href="/donate" primary>
              Donate
            </NavLink>
          </nav>

          {/* Right */}
          <div className="flex items-center gap-3">
            <WalletButton />
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden text-white text-2xl"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {open && (
          <div className="md:hidden pb-4 flex flex-col gap-2">
            <MobileLink href="/about">About</MobileLink>
            <MobileLink href="/create-campaign">Create Campaign</MobileLink>
            <MobileLink href="/withdrawal">Withdrawal</MobileLink>
            <MobileLink href="/donate" primary>
              Donate
            </MobileLink>
          </div>
        )}
      </div>
    </header>
  );
}

function NavLink({
  href,
  children,
  primary,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition
        ${
          primary
            ? "bg-orange-500 text-white hover:bg-orange-600"
            : "bg-white/90 text-gray-700 hover:bg-white"
        }`}
    >
      {children}
    </Link>
  );
}

function MobileLink({
  href,
  children,
  primary,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`px-4 py-3 rounded-lg text-sm font-medium
        ${
          primary
            ? "bg-orange-500 text-white"
            : "bg-white text-gray-700"
        }`}
    >
      {children}
    </Link>
  );
}
