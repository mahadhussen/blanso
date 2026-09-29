"use client";

import Link from "next/link";
import { useState } from "react";

// Navigeringen. Desktop: samma rad som 1:1-kopian. Mobil och iPad stående (≤900px, styrt i
// globals.css): en hamburgare som fäller ut länkarna under headern.
const LINKS: { href: string; label: string }[] = [
  { href: "/s", label: "Stays" },
  { href: "/#map", label: "Destinations" },
  { href: "/host", label: "List your property" },
  { href: "/host/login", label: "Sign in" },
];

export function HeaderNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="b-nav b-nav-desktop" style={{ display: "flex", gap: 40 }}>
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} style={{ color: "var(--ink)" }}>
            {l.label}
          </Link>
        ))}
      </nav>

      <button
        type="button"
        className="b-nav-toggle"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>

      {open && (
        <nav className="b-nav b-nav-mobile" onClick={() => setOpen(false)}>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} style={{ color: "var(--ink)" }}>
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
