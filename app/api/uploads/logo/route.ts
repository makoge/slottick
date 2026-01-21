import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  // basic validation
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

  // TODO: upload `file` to S3/R2/Supabase and return its public URL.
  // For now, return placeholder to prove wiring works:
  const url = `/uploads/logos/${crypto.randomUUID()}`;

  return NextResponse.json({ url });
}
