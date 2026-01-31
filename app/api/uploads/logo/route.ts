// app/api/uploads/logo/route.ts
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json({ error: "Logo too large (max 2MB)" }, { status: 400 });
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    const ext =
      file.type === "image/svg+xml" ? "svg" : file.type.split("/")[1] || "png";

    const filename = `logos/${crypto.randomUUID()}.${ext}`;

    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false
    });

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("Logo blob upload failed:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
