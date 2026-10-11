import { NextResponse } from "next/server";
import { listAll, insert, validate, removeAll } from "@/lib/db";

export async function GET() {
  return NextResponse.json(listAll());
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const errors = validate(body);
  if (errors.length) {
    return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
  }
  return NextResponse.json(insert(body), { status: 201 });
}

export async function DELETE() {
  return NextResponse.json({ removed: removeAll() });
}
