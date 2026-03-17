import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size: sizeParam } = await params;
  const size = Number(sizeParam) || 512;
  const maskable = request.nextUrl.searchParams.get("maskable") === "1";

  // For maskable icons, add extra padding (safe zone is inner 80%)
  const padding = maskable ? size * 0.1 : 0;
  const innerSize = size - padding * 2;
  const fontSize = Math.round(innerSize * 0.32);
  const ringSize = Math.round(innerSize * 0.78);
  const ringBorder = Math.max(2, Math.round(size * 0.008));

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0A0A0A",
          position: "relative",
        }}
      >
        {/* Glow ring */}
        <div
          style={{
            width: ringSize,
            height: ringSize,
            borderRadius: "50%",
            border: `${ringBorder}px solid #A855F7`,
            boxShadow: "0 0 40px 8px rgba(168,85,247,0.45), 0 0 80px 16px rgba(168,85,247,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "absolute",
          }}
        />
        {/* Text */}
        <span
          style={{
            fontSize,
            fontWeight: 800,
            color: "#A855F7",
            letterSpacing: "0.05em",
            textShadow: "0 0 20px rgba(168,85,247,0.7)",
            fontFamily: "sans-serif",
          }}
        >
          OR
        </span>
      </div>
    ),
    { width: size, height: size }
  );
}
