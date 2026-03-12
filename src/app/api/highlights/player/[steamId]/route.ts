import { NextRequest, NextResponse } from "next/server";

const G5API_URL = process.env.NEXT_PUBLIC_G5API_URL || process.env.G5API_URL || "https://g5api-production-998f.up.railway.app";

// GET /api/highlights/player/[steamId]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ steamId: string }> }
) {
  const { steamId } = await params;

  if (!steamId) {
    return NextResponse.json({ clips: [] }, { status: 400 });
  }

  try {
    const res = await fetch(`${G5API_URL}/highlights/player/${steamId}`, {
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      return NextResponse.json({ clips: [] });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[HIGHLIGHTS PLAYER]", err);
    return NextResponse.json({ clips: [], error: "Failed to fetch player highlights" }, { status: 500 });
  }
}
