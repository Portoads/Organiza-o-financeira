"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChartNoAxesCombined, LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!r.ok) return setError((await r.json()).error || "Falha no login");
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="login-shell">
      <form className="login-card" onSubmit={submit}>
        <div className="brand">
          <div className="brand-mark">
            <ChartNoAxesCombined size={22} />
          </div>
          <span>
            fluxo<span className="brand-dot">.</span>
          </span>
        </div>
        <h1>Entrar</h1>
        <p>Acesse seu painel financeiro.</p>
        <label className="form-field">
          <span>E-mail</span>
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="form-field">
          <span>Senha</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <div className="form-error">{error}</div>}
        <button className="primary-button" disabled={loading}>
          <LogIn size={17} /> {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
