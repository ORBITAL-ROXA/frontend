import { NextRequest, NextResponse } from "next/server";

const STEAM_API_KEY = process.env.STEAM_API_KEY;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ steamId: string }> }
) {
  const { steamId } = await params;

  if (!STEAM_API_KEY) {
    return NextResponse.json({ avatar: null, error: "Steam API key not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${steamId}`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    const player = data.response?.players?.[0];

    if (!player) {
      return NextResponse.json({ avatar: null }, { status: 404 });
    }

    return NextResponse.json({
      avatar: player.avatarfull,
      name: player.personaname,
    });
  } catch {
    return NextResponse.json({ avatar: null }, { status: 500 });
  }
}
