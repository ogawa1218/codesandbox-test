import { NextResponse } from "next/server";
import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase/admin";
import { check } from "@/lib/rate-limit";

const ANNOUNCEMENT_LIMIT = 5 * 1024 * 1024;
const MANUAL_LIMIT = 20 * 1024 * 1024;
const ANNOUNCEMENT_MIME = ["image/jpeg", "image/png", "image/webp"];
const MANUAL_MIME = ["application/pdf"];

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rl = await check("upload", user.id);
  if (!rl.ok) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  const { data: claims } = await supabase.auth.getClaims();
  const meta =
    (claims?.claims as { app_metadata?: Record<string, unknown> } | null)
      ?.app_metadata ?? {};
  const role = meta.role as string | undefined;
  const storeIdJwt = meta.store_id as string | undefined;
  if (role !== "manager" || !storeIdJwt) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const bucket = form.get("bucket");
  const storeIdField = form.get("store_id");

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }
  if (typeof bucket !== "string" || !["announcements", "manuals"].includes(bucket)) {
    return NextResponse.json({ error: "invalid bucket" }, { status: 400 });
  }
  if (typeof storeIdField !== "string" || storeIdField !== storeIdJwt) {
    return NextResponse.json({ error: "store mismatch" }, { status: 400 });
  }

  const isAnnouncement = bucket === "announcements";
  const sizeLimit = isAnnouncement ? ANNOUNCEMENT_LIMIT : MANUAL_LIMIT;
  const allowed = isAnnouncement ? ANNOUNCEMENT_MIME : MANUAL_MIME;
  if (file.size > sizeLimit) {
    return NextResponse.json({ error: "file too large" }, { status: 413 });
  }

  const arrayBuf = await file.arrayBuffer();
  const buf = new Uint8Array(arrayBuf);
  const detected = await fileTypeFromBuffer(buf);
  if (!detected || !allowed.includes(detected.mime)) {
    return NextResponse.json({ error: "unsupported file type" }, { status: 415 });
  }

  let payload: Uint8Array = buf;
  let ext = detected.ext;

  if (isAnnouncement) {
    // Strip EXIF / orientation, normalize to webp, cap dimensions.
    const out = await sharp(buf, { failOn: "error" })
      .rotate()
      .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    payload = new Uint8Array(out.buffer, out.byteOffset, out.byteLength);
    ext = "webp";
  }

  const objectId = crypto.randomUUID();
  const path = `${storeIdJwt}/${user.id}/${objectId}.${ext}`;

  const { error } = await admin()
    .storage.from(bucket)
    .upload(path, payload, {
      contentType: isAnnouncement ? "image/webp" : "application/pdf",
      upsert: false,
    });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ path });
}

export const runtime = "nodejs";
