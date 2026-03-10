import { NextRequest, NextResponse } from "next/server";

const G5API_URL = process.env.G5API_URL || "https://g5api-production-998f.up.railway.app";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  if (!filename) {
    return NextResponse.json({ error: "Filename required" }, { status: 400 });
  }

  // G5API serves demos at /demo/{filename}
  return NextResponse.redirect(`${G5API_URL}/demo/${encodeURIComponent(filename)}`);
}
