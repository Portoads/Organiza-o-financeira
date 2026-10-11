import { NextResponse } from "next/server";
import { checkCredentials, createSession, COOKIE } from "@/lib/auth";

export async function POST(req) {
  const { email, password } = await req.json().catch(() => ({}));

  if (!(await checkCredentials(email, password))) {
    return NextResponse.json(
      { error: "E-mail ou senha incorretos" },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, await createSession(email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });
  return res;
}
