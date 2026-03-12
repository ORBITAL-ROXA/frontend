import { NextRequest, NextResponse } from "next/server";

const G5API_URL = process.env.NEXT_PUBLIC_G5API_URL || process.env.G5API_URL || "https://g5api-production-998f.up.railway.app";

// GET /api/highlights-proxy/[file]
// Redirects to G5API for videos, proxies thumbnails
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;

  if (!file) {
    return NextResponse.json({ error: "File not specified" }, { status: 400 });
  }

  const url = `${G5API_URL}/highlights-files/${encodeURIComponent(file)}`;

  // For videos, redirect directly to G5API (too large to proxy through serverless)
  if (file.endsWith(".mp4")) {
    return NextResponse.redirect(url);
  }

  // For thumbnails, proxy through (small files)
  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const contentType = file.endsWith(".jpg") || file.endsWith(".jpeg")
      ? "image/jpeg"
      : "application/octet-stream";

    const body = await res.arrayBuffer();

    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    console.error("[HIGHLIGHTS PROXY]", err);
    return NextResponse.json({ error: "Failed to fetch file" }, { status: 500 });
  }
}
