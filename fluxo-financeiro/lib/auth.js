import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

export const COOKIE = "fluxo_session";

const secret = () =>
  new TextEncoder().encode(
    process.env.AUTH_SECRET || "dev-secret-change-me-in-production"
  );

export async function checkCredentials(email, password) {
  const okEmail =
    (email || "").trim().toLowerCase() ===
    (process.env.ADMIN_EMAIL || "").toLowerCase();
  if (!okEmail) return false;

  // Suporta senha com hash bcrypt (ADMIN_PASSWORD_HASH) ou texto puro (ADMIN_PASSWORD)
  if (process.env.ADMIN_PASSWORD_HASH) {
    return bcrypt.compare(password || "", process.env.ADMIN_PASSWORD_HASH);
  }
  return password === process.env.ADMIN_PASSWORD;
}

export async function createSession(email) {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifySession(token) {
  try {
    return (await jwtVerify(token, secret())).payload;
  } catch {
    return null;
  }
}
