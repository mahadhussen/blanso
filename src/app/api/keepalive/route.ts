import { getStore } from "@/lib/store";

// Håller Supabase-projektet vaket. Gratisprojekt pausas efter 7 dagar utan
// trafik — då slutar adressen resolva och varje boendesida ger 500 (hände
// 2026-09-29, dagen före investerardemon). Vercel Cron (vercel.json) anropar
// den här en gång per dygn; en billig läsning räknas som aktivitet.
// Är CRON_SECRET satt krävs den (Vercel skickar den som Bearer-token).
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }
  try {
    const listings = await getStore().listPublishedListings();
    return Response.json({ ok: true, published: listings.length });
  } catch {
    return Response.json({ ok: false, error: "store unreachable" }, { status: 503 });
  }
}
