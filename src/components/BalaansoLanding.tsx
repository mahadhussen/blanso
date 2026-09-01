"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import "../app/landing.css";

// Landningssidan — 1:1-port av "Balaanso Landing.html" (designfacit).
// Markupen är prototypens, verbatim; endast länkarna är omskrivna till appens
// rutter. Skripten (reveal, 3/6/9, hjärtan, karuseller, kartan) är prototypens
// JS anpassad till React-livscykeln. Ändra utseende ENDAST via källfilen.

const HERO = `
<div class="bleed" style="position:relative;height:78vh;min-height:520px;overflow:hidden;">
  <img class="slide" src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=70" alt="">
  <img class="slide" src="https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1800&q=70" alt="">
  <img class="slide" src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1800&q=70" alt="">
  <img class="slide" src="https://images.unsplash.com/photo-1693902997450-7e912c0d3554?auto=format&fit=crop&w=1800&q=70" alt="">
  <div style="position:absolute;left:12px;bottom:10px;z-index:2;font-family:var(--font-label);font-size:10px;color:rgba(255,255,255,.75);">Photos: Sean Oulashin, Sara Dubler, Manuel Moreno, Kenny Murgor on Unsplash</div>
  <div style="position:absolute;inset:0;background:var(--scrim);"></div>
  <div style="position:absolute;left:0;right:0;bottom:0;padding:0 var(--page-pad) 56px;color:var(--paper);">
    <div style="font-family:var(--font-label);font-size:var(--text-label);font-weight:700;letter-spacing:var(--ls-label);text-transform:uppercase;margin-bottom:20px;">Stays in East Africa</div>
    <h1 style="font-family:var(--font-display);font-weight:300;font-size:var(--text-display);line-height:1.06;letter-spacing:2px;text-transform:uppercase;margin:0;max-width:16ch;">East Africa’s own place to book your stay</h1>
  </div>
</div>
<div data-reveal style="padding:var(--s-6) var(--page-pad);border-bottom:1px solid var(--hairline);">
  <div style="display:grid;grid-template-columns:1.3fr 1fr 1fr 1fr auto;gap:0;border:1px solid var(--ink);">
    <div style="padding:16px 20px;border-right:1px solid var(--hairline);"><div style="font-family:var(--font-label);font-size:var(--text-label);font-weight:700;letter-spacing:var(--ls-label-tight);text-transform:uppercase;color:var(--muted);">Destination</div><div style="font-size:18px;margin-top:6px;">Where to?</div></div>
    <div style="padding:16px 20px;border-right:1px solid var(--hairline);"><div style="font-family:var(--font-label);font-size:var(--text-label);font-weight:700;letter-spacing:var(--ls-label-tight);text-transform:uppercase;color:var(--muted);">Check-in</div><div style="font-size:18px;margin-top:6px;color:var(--faint);">Date</div></div>
    <div style="padding:16px 20px;border-right:1px solid var(--hairline);"><div style="font-family:var(--font-label);font-size:var(--text-label);font-weight:700;letter-spacing:var(--ls-label-tight);text-transform:uppercase;color:var(--muted);">Check-out</div><div style="font-size:18px;margin-top:6px;color:var(--faint);">Date</div></div>
    <div style="padding:16px 20px;border-right:1px solid var(--hairline);"><div style="font-family:var(--font-label);font-size:var(--text-label);font-weight:700;letter-spacing:var(--ls-label-tight);text-transform:uppercase;color:var(--muted);">Guests</div><div style="font-size:18px;margin-top:6px;">2</div></div>
    <a href="/s" style="background:var(--ink);color:var(--paper);font-family:var(--font-label);font-size:var(--text-label);font-weight:700;letter-spacing:var(--ls-label);text-transform:uppercase;padding:0 40px;display:flex;align-items:center;justify-content:center;">Search</a>
  </div>
</div>`;

interface Card {
  href: string;
  imgs: [string, string, string];
  cr: string;
  place: string;
  name: string;
  score: string;
  meta: string;
  price: string;
}

const U = (id: string, w: number) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;
const P = {
  oul: "photo-1507525428034-b723cf961d3e",
  dub: "photo-1540541338287-41700207dee6",
  mor: "photo-1566073771259-6a8506099945",
  mur: "photo-1693902997450-7e912c0d3554",
  joh: "photo-1551882547-ff40c63fe5fa",
  niy: "photo-1511283878565-0833bf39de9d",
  per: "photo-1522708323590-d24dbb6b0267",
};

// Kortinnehållet är prototypens, verbatim. Endast href pekar på riktiga boenden.
const CARDS: Card[] = [
  { href: "/rooms/zanzibar-stonetown-villa", imgs: [U(P.mor,900),U(P.per,900),U(P.oul,900)], cr: "Photos: M. Moreno, P. Perkins, S. Oulashin / Unsplash", place: "Zanzibar, Tanzania", name: "Villa in Stone Town", score: "9.2", meta: "Exceptional · 48 reviews", price: "From $120 / night · Free cancellation" },
  { href: "/rooms/lido-beach-suite-mogadishu", imgs: [U(P.dub,900),U(P.joh,900),U(P.oul,900)], cr: "Photos: S. Dubler, E. Johansson, S. Oulashin / Unsplash", place: "Mogadishu, Somalia", name: "Lido Beach Suite", score: "8.9", meta: "Excellent · 61 reviews", price: "From $85 / night · Free cancellation" },
  { href: "/rooms/nairobi-westlands-loft", imgs: [U(P.mur,900),U(P.per,900),U(P.niy,900)], cr: "Photos: K. Murgor, P. Perkins, m. niyomwungeri / Unsplash", place: "Nairobi, Kenya", name: "Design loft in Westlands", score: "9.0", meta: "Wonderful · 35 reviews", price: "From $95 / night · Free cancellation" },
  { href: "/rooms/mombasa-oldtown-riad", imgs: [U(P.per,900),U(P.mor,900),U(P.oul,900)], cr: "Photos: P. Perkins, M. Moreno, S. Oulashin / Unsplash", place: "Mombasa, Kenya", name: "Swahili house in Old Town", score: "8.7", meta: "Excellent · 29 reviews", price: "From $75 / night · Free cancellation" },
  { href: "/rooms/kampala-kololo-house", imgs: [U(P.joh,900),U(P.niy,900),U(P.per,900)], cr: "Photos: E. Johansson, m. niyomwungeri, P. Perkins / Unsplash", place: "Kampala, Uganda", name: "Kololo garden house", score: "8.8", meta: "Excellent · 41 reviews", price: "From $65 / night · Free cancellation" },
  { href: "/rooms/kigali-nyarutarama-flat", imgs: [U(P.niy,900),U(P.joh,900),U(P.mur,900)], cr: "Photos: m. niyomwungeri, E. Johansson, K. Murgor / Unsplash", place: "Kigali, Rwanda", name: "Apartment in Nyarutarama", score: "9.1", meta: "Wonderful · 22 reviews", price: "From $70 / night · Free cancellation" },
  { href: "/rooms/hargeisa-city-apartment", imgs: [U(P.mor,900),U(P.per,900),U(P.joh,900)], cr: "Photos: M. Moreno, P. Perkins, E. Johansson / Unsplash", place: "Hargeisa, Somaliland", name: "City guesthouse", score: "8.5", meta: "Very good · 18 reviews", price: "From $45 / night · Free cancellation" },
  { href: "/rooms/dar-masaki-apartment", imgs: [U(P.oul,900),U(P.dub,900),U(P.mor,900)], cr: "Photos: S. Oulashin, S. Dubler, M. Moreno / Unsplash", place: "Dar es Salaam, Tanzania", name: "Beach villa in Msasani", score: "9.3", meta: "Exceptional · 57 reviews", price: "From $110 / night · Free cancellation" },
  { href: "/rooms/addis-bole-residence", imgs: [U(P.mur,900),U(P.niy,900),U(P.oul,900)], cr: "Photos: K. Murgor, m. niyomwungeri, S. Oulashin / Unsplash", place: "Addis Ababa, Ethiopia", name: "Bole terrace apartment", score: "8.6", meta: "Excellent · 33 reviews", price: "From $60 / night · Free cancellation" },
];

const HEART_SVG = `<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.9-10-9.2C.4 8.4 2 4.5 5.7 4.1 8 3.8 9.9 5 12 7.2 14.1 5 16 3.8 18.3 4.1 22 4.5 23.6 8.4 22 11.8 19.5 16.1 12 21 12 21z"/></svg>`;

function cardHtml(c: Card): string {
  return `<a href="${c.href}" class="stay" style="color:var(--ink);">
  <div class="carousel">
    <div class="track"><img src="${c.imgs[0]}" alt=""><img src="${c.imgs[1]}" alt=""><img src="${c.imgs[2]}" alt=""></div>
    <button class="heart" aria-label="Save">${HEART_SVG}</button><div class="dots"><span class="on"></span><span></span><span></span></div>
    <div class="cr">${c.cr}</div>
  </div>
  <div style="font-family:var(--font-label);font-size:13px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--muted);margin-top:16px;">${c.place}</div>
  <div style="font-family:var(--font-display);font-weight:400;font-size:24px;margin-top:6px;">${c.name}</div>
  <div style="display:flex;align-items:center;gap:8px;margin-top:6px;font-family:var(--font-label);font-size:11px;"><span style="background:var(--ink);color:var(--paper);padding:3px 6px;font-weight:700;">${c.score}</span><span style="color:var(--muted);">${c.meta}</span></div>
  <div style="font-size:var(--text-body);color:var(--ink-2);margin-top:4px;">${c.price}</div>
</a>`;
}

const MQ_CITIES: [string, string][] = [
  ["Mogadishu", P.dub], ["Hargeisa", P.joh], ["Zanzibar", P.mor], ["Nairobi", P.mur],
  ["Kigali", P.niy], ["Kampala", P.per], ["Mombasa", P.oul], ["Dar es Salaam", P.dub],
  ["Addis Ababa", P.mur], ["Djibouti", P.oul], ["Berbera", P.mor], ["Juba", P.niy],
];

function mqHtml(): string {
  const card = ([name, img]: [string, string]) =>
    `<a href="#map" class="mq-card" style="width:380px;height:300px;"><img src="${U(img, 900)}" alt=""><span class="nm" style="font-size:24px;left:20px;bottom:18px;">${name}</span></a>`;
  const all = [...MQ_CITIES, ...MQ_CITIES].map(card).join("");
  return `<div class="mq"><div class="mq-track">${all}</div></div>`;
}

const SECTIONS = `
<div data-reveal style="padding:var(--s-7) var(--page-pad) var(--s-6);">
  <div style="font-family:var(--font-label);font-size:var(--text-label);font-weight:700;letter-spacing:var(--ls-label);text-transform:uppercase;color:var(--muted);text-align:center;">Featured stays</div>
  <h2 style="font-family:var(--font-display);font-weight:300;font-size:var(--text-h2);letter-spacing:1px;text-align:center;margin:16px 0 0;">From coast to highlands</h2>
</div>
<div data-reveal style="padding:0 var(--page-pad) 24px;display:flex;justify-content:center;gap:0;font-family:var(--font-label);font-size:var(--text-label);font-weight:700;letter-spacing:var(--ls-label-tight);text-transform:uppercase;">
  <span style="align-self:center;color:var(--muted);margin-right:14px;">View</span>
  <button class="count-opt on" data-n="3">3</button><button class="count-opt" data-n="6">6</button><button class="count-opt" data-n="9">9</button>
</div>
<div data-reveal style="padding:0 var(--page-pad) 64px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:36px 32px;">${CARDS.map(cardHtml).join("")}</div>
<div data-reveal style="border-top:1px solid var(--hairline);padding:var(--s-7) var(--page-pad) var(--s-4);">
  <div style="font-family:var(--font-label);font-size:var(--text-label);font-weight:700;letter-spacing:var(--ls-label);text-transform:uppercase;color:var(--muted);">Trending destinations</div>
  <h2 style="font-family:var(--font-display);font-weight:300;font-size:var(--text-h2);letter-spacing:1px;margin:14px 0 0;">Where travellers are booking now</h2>
</div>
<div data-reveal style="padding:32px 0 72px;">${mqHtml()}</div>
<div data-reveal style="border-top:1px solid var(--hairline);padding:var(--s-7) var(--page-pad) var(--s-4);">
  <div style="font-family:var(--font-label);font-size:var(--text-label);font-weight:700;letter-spacing:var(--ls-label);text-transform:uppercase;color:var(--muted);">The map</div>
  <h2 style="font-family:var(--font-display);font-weight:300;font-size:var(--text-h2);letter-spacing:1px;margin:14px 0 0;">Every stay across East Africa</h2>
</div>
<div data-reveal style="padding:var(--s-5) var(--page-pad) var(--s-8);">
  <div id="map" style="height:520px;border:1px solid var(--hairline);"></div>
</div>
<div data-reveal style="border-top:1px solid var(--hairline);padding:var(--s-8) var(--page-pad);">
  <div style="display:grid;grid-template-columns:1.1fr 1fr;gap:48px;align-items:center;">
    <div>
      <div style="font-family:var(--font-label);font-size:var(--text-label);font-weight:700;letter-spacing:var(--ls-label);text-transform:uppercase;color:var(--muted);">For hotel owners</div>
      <h2 style="font-family:var(--font-display);font-weight:300;font-size:44px;line-height:1.1;margin:14px 0 0;">Own a hotel in Somalia or East Africa? List it on Balaanso.</h2>
      <p style="font-size:var(--text-body);line-height:1.6;color:var(--ink-2);margin:18px 0 26px;max-width:46ch;">Create your listing, set your own prices and availability, and reach guests booking across the region. No setup fees — you pay only per completed booking.</p>
      <a href="/host" style="display:inline-block;background:var(--ink);color:var(--paper);font-family:var(--font-label);font-size:var(--text-label);font-weight:700;letter-spacing:var(--ls-label);text-transform:uppercase;padding:16px 36px;">List your property</a>
    </div>
    <div style="display:grid;gap:0;border:1px solid var(--ink);">
      <div style="padding:22px 26px;border-bottom:1px solid var(--hairline);display:flex;gap:18px;align-items:baseline;"><span style="font-family:var(--font-display);font-size:28px;">1</span><div><div style="font-family:var(--font-label);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Create your listing</div><div style="font-size:15px;color:var(--muted);margin-top:4px;">Photos, rooms and amenities — live in minutes.</div></div></div>
      <div style="padding:22px 26px;border-bottom:1px solid var(--hairline);display:flex;gap:18px;align-items:baseline;"><span style="font-family:var(--font-display);font-size:28px;">2</span><div><div style="font-family:var(--font-label);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Set prices &amp; availability</div><div style="font-size:15px;color:var(--muted);margin-top:4px;">You stay in control of rates, seasons and rules.</div></div></div>
      <div style="padding:22px 26px;display:flex;gap:18px;align-items:baseline;"><span style="font-family:var(--font-display);font-size:28px;">3</span><div><div style="font-family:var(--font-label);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Get bookings &amp; paid</div><div style="font-size:15px;color:var(--muted);margin-top:4px;">Secure payouts, guest messaging and reviews.</div></div></div>
    </div>
  </div>
</div>`;

const HTML = HERO + SECTIONS;

// Kartans data — prototypens, verbatim. Länkarna pekar på riktiga rutter.
const CITY_HREF: Record<string, string> = {
  Mogadishu: "/s?destination=Mogadishu",
  Hargeisa: "/rooms/hargeisa-city-apartment",
  Berbera: "/s",
  Djibouti: "/rooms/djibouti-marina-studio",
  "Addis Ababa": "/rooms/addis-bole-residence",
  Nairobi: "/rooms/nairobi-westlands-loft",
  Mombasa: "/rooms/mombasa-oldtown-riad",
  Zanzibar: "/rooms/zanzibar-stonetown-villa",
  "Dar es Salaam": "/rooms/dar-masaki-apartment",
  Kigali: "/rooms/kigali-nyarutarama-flat",
  Kampala: "/rooms/kampala-kololo-house",
  Juba: "/s",
};

export function BalaansoLanding() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let disposed = false;
    let map: import("leaflet").Map | null = null;
    const cleanups: (() => void)[] = [];

    // Reveal (prototypens skript, verbatim)
    const revealEl = (el: Element) => el.classList.add("in");
    try {
      const io = new IntersectionObserver(
        (es) => es.forEach((e) => { if (e.isIntersecting) { revealEl(e.target); io.unobserve(e.target); } }),
        { threshold: 0.15 },
      );
      root.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
      cleanups.push(() => io.disconnect());
    } catch {}
    const fallback = () => {
      root.querySelectorAll("[data-reveal]:not(.in)").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) revealEl(el);
      });
    };
    window.addEventListener("scroll", fallback, { passive: true });
    window.addEventListener("load", fallback);
    fallback();
    const t1 = setTimeout(() => root.querySelectorAll("[data-reveal]:not(.in)").forEach(revealEl), 1200);
    cleanups.push(() => { window.removeEventListener("scroll", fallback); window.removeEventListener("load", fallback); clearTimeout(t1); });

    // Stagger-delays (prototypens skript)
    root.querySelectorAll("[data-reveal]").forEach((sec) => {
      sec.querySelectorAll<HTMLElement>(".stay,.dest").forEach((k, i) => {
        k.style.transitionDelay = i * 0.12 + "s";
        const im = k.querySelector<HTMLElement>("img");
        if (im) im.style.transitionDelay = 0.15 + i * 0.12 + "s";
      });
    });

    // 3/6/9-väljaren (prototypens skript)
    const stays = root.querySelectorAll<HTMLElement>(".stay");
    function setCount(n: number) {
      stays.forEach((el, i) => { el.style.display = i < n ? "" : "none"; });
      root!.querySelectorAll(".count-opt").forEach((b) =>
        b.classList.toggle("on", +(b.getAttribute("data-n") ?? 0) === n),
      );
      try { localStorage.setItem("blanso-stay-count", String(n)); } catch {}
    }
    root.querySelectorAll(".count-opt").forEach((b) => {
      const h = () => setCount(+(b.getAttribute("data-n") ?? 3));
      b.addEventListener("click", h);
      cleanups.push(() => b.removeEventListener("click", h));
    });
    let saved = 3;
    try { saved = parseInt(localStorage.getItem("blanso-stay-count") ?? "3") || 3; } catch {}
    setCount(saved);

    // Hjärtan (prototypens skript)
    let favs: number[] = [];
    try { favs = JSON.parse(localStorage.getItem("blanso-favs") ?? "[]"); } catch {}
    root.querySelectorAll(".heart").forEach((b, idx) => {
      if (favs.indexOf(idx) > -1) b.classList.add("fav");
      const h = (e: Event) => {
        e.preventDefault(); e.stopPropagation();
        b.classList.toggle("fav");
        const i = favs.indexOf(idx);
        if (i > -1) favs.splice(i, 1); else favs.push(idx);
        try { localStorage.setItem("blanso-favs", JSON.stringify(favs)); } catch {}
      };
      b.addEventListener("click", h);
      cleanups.push(() => b.removeEventListener("click", h));
    });

    // Karuseller (prototypens skript)
    root.querySelectorAll<HTMLElement>(".carousel").forEach((c) => {
      const track = c.querySelector<HTMLElement>(".track");
      const dots = c.querySelectorAll(".dots span");
      const n = dots.length;
      let i = 0;
      let sx: number | null = null;
      const go = (k: number) => {
        i = ((k % n) + n) % n;
        if (track) track.style.transform = "translateX(-" + i * 100 + "%)";
        dots.forEach((d, j) => d.classList.toggle("on", j === i));
      };
      const click = (e: Event) => { e.preventDefault(); e.stopPropagation(); go(i + 1); };
      const ts = (e: TouchEvent) => { sx = e.touches[0].clientX; };
      const te = (e: TouchEvent) => {
        if (sx === null) return;
        const dx = e.changedTouches[0].clientX - sx; sx = null;
        if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
      };
      c.addEventListener("click", click);
      c.addEventListener("touchstart", ts, { passive: true });
      c.addEventListener("touchend", te);
      cleanups.push(() => { c.removeEventListener("click", click); c.removeEventListener("touchstart", ts); c.removeEventListener("touchend", te); });
    });

    // Kartan (prototypens skript, med importerad Leaflet)
    (async () => {
      const L = await import("leaflet");
      if (disposed) return;
      const mapEl = root.querySelector<HTMLElement>("#map");
      if (!mapEl) return;
      const OVERVIEW: [number, number] = [1.5, 38.5], OZ = 5;
      map = L.map(mapEl, { scrollWheelZoom: false }).setView(OVERVIEW, OZ);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors" }).addTo(map);
      const fix = () => { map!.invalidateSize(); };
      window.addEventListener("resize", fix);
      cleanups.push(() => window.removeEventListener("resize", fix));
      setTimeout(fix, 300); setTimeout(fix, 1000);
      map.on("click focus", () => map!.scrollWheelZoom.enable());
      map.on("mouseout", () => map!.scrollWheelZoom.disable());

      const IMG: Record<string, string> = { dub: P.dub, joh: P.joh, mor: P.mor, oul: P.oul, mur: P.mur, niy: P.niy, per: P.per };
      type Hotel = [string, number, number, number, string];
      const cities: Record<string, { ll: [number, number]; hotels: Hotel[] }> = {
        Mogadishu: { ll: [2.0469, 45.3182], hotels: [
          ["Lido Beach Suite", 2.063, 45.3505, 85, "dub"], ["Jazeera Palace Hotel", 2.0245, 45.309, 95, "joh"],
          ["Peace Hotel", 2.04, 45.292, 70, "per"], ["Sahafi Hotel", 2.033, 45.322, 65, "mor"],
          ["Hotel Juba", 2.038, 45.34, 55, "niy"], ["Aran Guest House", 2.056, 45.33, 45, "per"],
          ["Liido Seaview", 2.0665, 45.356, 90, "oul"], ["Makka Hotel", 2.029, 45.301, 60, "joh"],
          ["Halane Suites", 2.018, 45.295, 75, "mur"], ["Banadir Rooms", 2.0455, 45.313, 50, "mor"]] },
        Hargeisa: { ll: [9.5624, 44.077], hotels: [["City guesthouse", 9.5624, 44.077, 45, "joh"]] },
        Berbera: { ll: [10.4396, 45.0143], hotels: [["Berbera beach stay", 10.4396, 45.0143, 50, "mor"]] },
        Djibouti: { ll: [11.5721, 43.1456], hotels: [["Harbour rooms", 11.5721, 43.1456, 70, "oul"]] },
        "Addis Ababa": { ll: [9.025, 38.7469], hotels: [["Bole terrace apartment", 9.025, 38.7469, 60, "mur"]] },
        Nairobi: { ll: [-1.2921, 36.8219], hotels: [["Design loft in Westlands", -1.2921, 36.8219, 95, "mur"]] },
        Mombasa: { ll: [-4.0435, 39.6682], hotels: [["Swahili house in Old Town", -4.0435, 39.6682, 75, "per"]] },
        Zanzibar: { ll: [-6.1659, 39.2026], hotels: [["Villa in Stone Town", -6.1659, 39.2026, 120, "mor"]] },
        "Dar es Salaam": { ll: [-6.7924, 39.2083], hotels: [["Beach villa in Msasani", -6.7924, 39.2083, 110, "oul"]] },
        Kigali: { ll: [-1.9441, 30.0619], hotels: [["Apartment in Nyarutarama", -1.9441, 30.0619, 70, "niy"]] },
        Kampala: { ll: [0.3476, 32.5825], hotels: [["Kololo garden house", 0.3476, 32.5825, 65, "per"]] },
        Juba: { ll: [4.8594, 31.5713], hotels: [["River camp rooms", 4.8594, 31.5713, 55, "niy"]] },
      };
      const chip = (html: string, cls?: string, off?: [number, number]) => {
        const st = off ? ` style="--ox:${off[0]}px;--oy:${off[1]}px"` : "";
        return L.divIcon({ className: "", html: `<div class="pin-chip ${cls ?? ""}"${st}>${html}</div>`, iconSize: undefined, iconAnchor: [0, 0] });
      };
      const cityLayer = L.layerGroup().addTo(map);
      const hotelLayer = L.layerGroup();
      const OFF: Record<string, [number, number]> = { Zanzibar: [46, -8], "Dar es Salaam": [-56, 16], Mombasa: [-46, -14], Djibouti: [6, -18], Berbera: [48, -6], Hargeisa: [-36, 14], Mogadishu: [14, 10], "Addis Ababa": [-10, -16] };
      const flyCity = (name: string) => {
        const c = cities[name]; if (!c || !map) return;
        map.flyTo(c.ll, c.hotels.length > 1 ? 12 : 11, { duration: 1.1, easeLinearity: 0.15 });
      };
      Object.keys(cities).forEach((name) => {
        const c = cities[name], n = c.hotels.length;
        const label = n > 1 ? `${name} · ${n}` : name;
        const cm = L.marker(c.ll, { icon: chip(label, "pin-city", OFF[name]) }).addTo(cityLayer);
        cm.on("click", () => flyCity(name));
        c.hotels.forEach((ht) => {
          const hm = L.marker([ht[1], ht[2]], { icon: chip("$" + ht[3]) }).addTo(hotelLayer);
          const href = ht[0] === "Lido Beach Suite" ? "/rooms/lido-beach-suite-mogadishu" : (CITY_HREF[name] ?? "/s");
          const html = `<div style="width:200px;font-family:var(--font-label);">
<img src="https://images.unsplash.com/${IMG[ht[4]]}?auto=format&fit=crop&w=400&q=60" style="width:100%;height:110px;object-fit:cover;display:block;">
<div style="padding:10px 2px 2px;"><div style="font-weight:700;font-size:14px;">${ht[0]}</div>
<div style="font-size:12px;color:var(--ink-2);margin-top:2px;">${name} · From $${ht[3]} / night</div>
<a href="${href}" style="display:inline-block;margin-top:8px;font-size:var(--text-label);font-weight:700;letter-spacing:var(--ls-label-tight);text-transform:uppercase;color:var(--ink);border-bottom:1px solid var(--ink);">View stay</a></div></div>`;
          hm.bindPopup(html, { maxWidth: 220 });
        });
      });
      const setLayers = () => {
        if (!map) return;
        const z = map.getZoom();
        if (z >= 9) { if (map.hasLayer(cityLayer)) map.removeLayer(cityLayer); if (!map.hasLayer(hotelLayer)) map.addLayer(hotelLayer); }
        else { if (map.hasLayer(hotelLayer)) map.removeLayer(hotelLayer); if (!map.hasLayer(cityLayer)) map.addLayer(cityLayer); }
      };
      map.on("zoomend", setLayers);
      const BackControl = L.Control.extend({
        onAdd() {
          const d = L.DomUtil.create("div");
          d.innerHTML = '<button class="map-back">← Overview</button>';
          (d.firstChild as HTMLElement).addEventListener("click", (e) => { e.stopPropagation(); map!.flyTo(OVERVIEW, OZ, { duration: 0.9, easeLinearity: 0.15 }); });
          return d;
        },
      });
      new BackControl({ position: "topright" }).addTo(map);
      const flyToCity = (name: string) => {
        const key = Object.keys(cities).find((k) => k.toLowerCase() === String(name).toLowerCase());
        if (!key) return;
        const top = mapEl.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top, behavior: "smooth" });
        setTimeout(() => flyCity(key), 450);
      };
      root.querySelectorAll(".mq-card").forEach((card) => {
        const h = (e: Event) => {
          e.preventDefault();
          const nm = card.querySelector(".nm");
          if (nm) flyToCity(nm.textContent?.trim() ?? "");
        };
        card.addEventListener("click", h);
        cleanups.push(() => card.removeEventListener("click", h));
      });
    })();

    return () => {
      disposed = true;
      cleanups.forEach((c) => c());
      map?.remove();
    };
  }, []);

  return <div ref={rootRef} dangerouslySetInnerHTML={{ __html: HTML }} />;
}
