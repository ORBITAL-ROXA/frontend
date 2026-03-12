import { NextRequest, NextResponse } from "next/server";

const STEAM_API_KEY = process.env.STEAM_API_KEY || "B7120E9E2297DA4659901D845619D598";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ steamId: string }> }
) {
  const { steamId } = await params;

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
