import { NextResponse } from "next/server";
import { parseTxt } from "@/lib/txt";
import { insertMany } from "@/lib/db";

export async function POST(req) {
  const form = await req.formData();
  const file = form.get("file");
  const text = file ? await file.text() : (form.get("text") || "");

  if (!text.trim()) {
    return NextResponse.json({ error: "Arquivo vazio" }, { status: 400 });
  }

  const { items, errors } = parseTxt(text);
  const inserted = items.length ? insertMany(items) : [];

  return NextResponse.json({
    inserted: inserted.length,
    errors,
    items: inserted,
  });
}
