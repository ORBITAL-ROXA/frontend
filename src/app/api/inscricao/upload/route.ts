import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

// Public upload for inscriptions (logo and PIX proof)
// Rate limiting should be handled by Vercel/Cloudflare
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null; // "logo" or "comprovante"

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    if (!type || !["logo", "comprovante"].includes(type)) {
      return NextResponse.json({ error: "Tipo inválido (use 'logo' ou 'comprovante')" }, { status: 400 });
    }

    // Validate file type (images only)
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Use PNG, JPG ou WebP" }, { status: 400 });
    }

    // Validate file size (max 2MB for logo, 5MB for comprovante)
    const maxSize = type === "logo" ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: `Arquivo muito grande. Máximo ${maxSize / 1024 / 1024}MB` }, { status: 400 });
    }

    const MIME_TO_EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
    const ext = MIME_TO_EXT[file.type] || "png";
    const folder = type === "logo" ? "inscricoes/logos" : "inscricoes/comprovantes";
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const blob = await put(filename, file, {
      access: "public",
      contentType: file.type,
    });

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao fazer upload";
    console.error("[INSCRICAO UPLOAD ERROR]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
