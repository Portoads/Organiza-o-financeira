import { NextResponse } from "next/server";
import { update, remove, validate } from "@/lib/db";

export async function PUT(req, { params }) {
  const body = await req.json().catch(() => ({}));
  const errors = validate(body);
  if (errors.length) {
    return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
  }
  return NextResponse.json(update(Number(params.id), body));
}

export async function DELETE(_req, { params }) {
  const n = remove(Number(params.id));
  return n
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "Não encontrado" }, { status: 404 });
}
