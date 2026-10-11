import { NextResponse } from "next/server";
import { verifySession, COOKIE } from "./lib/auth";

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  // Rotas de autenticação sempre liberadas
  if (pathname.startsWith("/api/auth")) return NextResponse.next();

  // Página de login: redireciona para home se já logado
  if (pathname === "/login") {
    return session
      ? NextResponse.redirect(new URL("/", req.url))
      : NextResponse.next();
  }

  // Sem sessão: redireciona para /login (ou 401 para APIs)
  if (!session) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/api/:path*"],
};
