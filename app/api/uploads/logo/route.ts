import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  const maxBytes = 2 * 1024 * 1024;
  if (file.size > maxBytes) {
    return NextResponse.json({ error: "Logo too large (max 2MB)." }, { status: 400 });
  }

  const allowed = new Set([
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/svg+xml"
  ]);
  if (!allowed.has(file.type)) {
    return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop() || "png";
  const filename = `${crypto.randomUUID()}.${ext}`;

  const dir = path.join(process.cwd(), "public/uploads/logos");
  await mkdir(dir, { recursive: true });

  const filepath = path.join(dir, filename);
  await writeFile(filepath, bytes);

  // ✅ public URL
  const url = `/uploads/logos/${filename}`;

  return NextResponse.json({ url });
}
