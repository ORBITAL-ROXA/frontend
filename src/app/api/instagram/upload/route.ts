import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { checkAdmin } from "../../brand/auth";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "120b15bc353dbebd04f819bb60731725";
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET = "orbitalroxa";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://pub-894e2fa8c7684e2095cedd60a72f4536.r2.dev";

function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY,
      secretAccessKey: R2_SECRET_KEY,
    },
  });
}

// POST — upload de imagem/vídeo pro R2 (retorna URL pública pra usar na Instagram API)
export async function POST(req: NextRequest) {
  const authError = await checkAdmin(req);
  if (authError) return authError;

  if (!R2_ACCESS_KEY || !R2_SECRET_KEY) {
    return NextResponse.json({ error: "R2 credentials not configured (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)" }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    // Validate type
    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "video/mp4", "video/quicktime"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Tipo não permitido. Use PNG, JPG, WebP, MP4 ou MOV." }, { status: 400 });
    }

    // Validate size (50MB max for videos, 8MB for images)
    const maxSize = file.type.startsWith("video/") ? 50 * 1024 * 1024 : 8 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: `Arquivo muito grande. Máximo ${file.type.startsWith("video/") ? "50MB" : "8MB"}.` }, { status: 400 });
    }

    const MIME_TO_EXT: Record<string, string> = {
      "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp",
      "video/mp4": "mp4", "video/quicktime": "mov",
    };
    const ext = MIME_TO_EXT[file.type] || "bin";
    const key = `instagram/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const r2 = getR2Client();
    await r2.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }));

    const publicUrl = `${R2_PUBLIC_URL}/${key}`;
    return NextResponse.json({ url: publicUrl, key });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro no upload";
    console.error("[INSTAGRAM UPLOAD]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
