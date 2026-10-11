"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, ArrowLeftRight, Wallet, ChartNoAxesCombined, Target,
  Settings, Search, Plus, ArrowUpRight, ArrowDownRight, PiggyBank,
  TrendingUp, Home, ShoppingBasket, CarFront, Wifi, GraduationCap,
  HeartPulse, CalendarDays, Download, Upload, Trash2, X, Check,
  ChevronDown, Menu, CircleDollarSign, ReceiptText, Sparkles, Pencil,
  LogOut, FileText,
} from "lucide-react";

// ─── Dados de configuração ───────────────────────────────────────────────────
const categories = [
  "Salário","Freelance/Serviços","Vendas","Outras entradas",
  "Água","Luz","Aluguel","Condomínio","Alimentação","Compra do mês",
  "Gasolina/Transporte","Internet/Telefone","Cursos/Educação","Saúde",
  "Lazer","Assinaturas","Cartão de crédito","Impostos","Manutenção",
  "Investimentos","Reserva de emergência","Poupança","Outros",
];
const types    = ["Entrada","Despesa","Investimento","Guardado"];
const accounts = ["Pix","Dinheiro","Débito","Crédito","Transferência","Boleto","Outro"];
const essentials = [
  "Água","Luz","Aluguel","Condomínio","Alimentação","Compra do mês",
  "Gasolina/Transporte","Internet/Telefone","Cursos/Educação","Saúde",
];
const colors = ["#6c7cff","#37c8a4","#f4b860","#a78bfa","#f47777","#50b9e8","#e58fc4","#92a8b3"];

// ─── Utilitários de data (fuso LOCAL, sem bug de UTC) ────────────────────────
const pad2      = (n) => String(n).padStart(2, "0");
const localISO  = (d = new Date()) => `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
const localMonth= (d = new Date()) => localISO(d).slice(0, 7);
const brl       = (n) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(n||0);
const monthKey  = (d) => (d || "").slice(0, 7);
const monthName = (v) => {
  if (!v) return "";
  const [y, m] = v.split("-");
  return new Date(+y, +m - 1, 1).toLocaleDateString("pt-BR",{month:"long",year:"numeric"});
};
const datePt  = (d) => d ? new Date(d + "T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"short"}) : "—";
const typeClass = (t) => ({Entrada:"income",Despesa:"expense",Investimento:"invest",Guardado:"saved"})[t] || "expense";
const iconFor   = (c = "") => {
  if (["Aluguel","Condomínio"].includes(c))             return Home;
  if (["Alimentação","Compra do mês"].includes(c))      return ShoppingBasket;
  if (c.includes("Gasolina")||c.includes("Transporte")) return CarFront;
  if (c.includes("Internet")||c==="Água"||c==="Luz")    return Wifi;
  if (c.includes("Curso"))                              return GraduationCap;
  if (c === "Saúde")                                    return HeartPulse;
  if (c === "Investimentos")                            return TrendingUp;
  if (c.includes("Reserva")||c==="Poupança")            return PiggyBank;
  return ReceiptText;
};

const emptyForm = () => ({
  date: localISO(), description: "", type: "Despesa",
  category: "Alimentação", amount: "", account: "Pix", notes: "",
});
const defaultCategory = (t) =>
  ({ Investimento:"Investimentos", Guardado:"Reserva de emergência", Entrada:"Freelance/Serviços" })[t] || "Alimentação";

// ─── Exemplo de TXT para importação ─────────────────────────────────────────
const TXT_EXAMPLE = `[ENTRADAS]
05/10/2026; Freelance/Serviços; Projeto de site; 2450,00; Pix

[DESPESAS]
03/10/2026; Aluguel; Aluguel de outubro; 950,00; Pix
04/10/2026; Compra do mês; Supermercado; 428,65; Débito; obs opcional

[INVESTIMENTOS]
09/10/2026; Investimentos; Aplicação CDB; 600; Transferência

[GUARDADO]
06/10/2026; Reserva de emergência; Reserva mensal; 400; Transferência`;

// ─── Helper de API ────────────────────────────────────────────────────────────
async function api(url, opts = {}) {
  const r = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  const data = await r.json().catch(() => ({}));
  if (r.status === 401) { window.location.href = "/login"; throw new Error("Sessão expirada"); }
  if (!r.ok) throw new Error(data.error || "Erro na requisição");
  return data;
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function HomePage() {
  const router = useRouter();

  // Estado principal
  const [transactions, setTransactions] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [month,        setMonth]        = useState(localMonth());
  const [active,       setActive]       = useState("Visão geral");
  const [modal,        setModal]        = useState(false);
  const [editing,      setEditing]      = useState(null);
  const [importOpen,   setImportOpen]   = useState(false);
  const [importText,   setImportText]   = useState("");
  const [importResult, setImportResult] = useState(null);
  const [search,       setSearch]       = useState("");
  const [typeFilter,   setTypeFilter]   = useState("Todos");
  const [mobileNav,    setMobileNav]    = useState(false);
  const [toast,        setToast]        = useState("");
  const [form,         setForm]         = useState(emptyForm());

  const searchRef = useRef(null);
  const fileRef   = useRef(null);

  const notify = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }, []);

  // Carrega lançamentos na montagem
  useEffect(() => {
    api("/api/transactions")
      .then(setTransactions)
      .catch((e) => notify(e.message))
      .finally(() => setLoading(false));
  }, [notify]);

  // Atalhos de teclado
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") { setModal(false); setImportOpen(false); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // Dados derivados
  const monthTransactions = useMemo(
    () => transactions.filter((t) => monthKey(t.date) === month),
    [transactions, month]
  );

  const totals = useMemo(() => {
    const sum = (type) => monthTransactions.filter((t) => t.type === type).reduce((a, t) => a + Number(t.amount || 0), 0);
    return { income: sum("Entrada"), expenses: sum("Despesa"), invested: sum("Investimento"), saved: sum("Guardado") };
  }, [monthTransactions]);

  const balance   = totals.income - totals.expenses - totals.invested - totals.saved;
  const flowTotal = totals.income + totals.expenses + totals.invested + totals.saved;
  const pct       = (v) => flowTotal ? `${Math.min(100, (v / flowTotal) * 100)}%` : "0%";

  const expenseByCategory = useMemo(() => {
    const map = {};
    monthTransactions.filter((t) => t.type === "Despesa").forEach((t) => {
      map[t.category] = (map[t.category] || 0) + Number(t.amount || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [monthTransactions]);

  const filtered = useMemo(
    () => monthTransactions
      .filter((t) =>
        (typeFilter === "Todos" || t.type === typeFilter) &&
        `${t.description} ${t.category} ${t.account} ${t.notes || ""}`.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id),
    [monthTransactions, typeFilter, search]
  );

  const expenseTotal = totals.expenses || 0;
  const donut = expenseByCategory.reduce(
    (acc, [, value], i) => {
      const s = acc.end, e = s + (expenseTotal ? (value / expenseTotal) * 100 : 0);
      acc.parts.push(`${colors[i % colors.length]} ${s}% ${e}%`);
      acc.end = e;
      return acc;
    },
    { parts: [], end: 0 }
  ).parts.join(", ");

  const essentialTotal = monthTransactions
    .filter((t) => t.type === "Despesa" && essentials.includes(t.category))
    .reduce((a, t) => a + Number(t.amount), 0);

  // Meses disponíveis: ±12 meses + todos os meses com lançamentos
  const monthOptions = useMemo(() => {
    const set = new Set(transactions.map((t) => monthKey(t.date)));
    for (let i = -12; i <= 12; i++) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + i);
      set.add(localMonth(d));
    }
    set.add(month);
    return [...set].sort().reverse();
  }, [transactions, month]);

  // ─── Ações ──────────────────────────────────────────────────────────────────
  const openNew  = () => { setEditing(null); setForm(emptyForm()); setModal(true); };
  const openEdit = (t) => {
    setEditing(t.id);
    setForm({ date: t.date, description: t.description, type: t.type, category: t.category, amount: String(t.amount), account: t.account, notes: t.notes || "" });
    setModal(true);
  };

  async function saveTransaction(e) {
    e.preventDefault();
    if (!form.description.trim() || Number(form.amount) <= 0) return;
    try {
      if (editing) {
        const u = await api(`/api/transactions/${editing}`, { method: "PUT", body: JSON.stringify(form) });
        setTransactions((p) => p.map((t) => (t.id === editing ? u : t)));
        notify("Lançamento atualizado ✓");
      } else {
        const c = await api("/api/transactions", { method: "POST", body: JSON.stringify(form) });
        setTransactions((p) => [c, ...p]);
        notify("Lançamento salvo ✓");
      }
      setMonth(monthKey(form.date));
      setModal(false);
    } catch (err) { notify(err.message); }
  }

  async function removeTransaction(id) {
    if (!confirm("Excluir este lançamento?")) return;
    try {
      await api(`/api/transactions/${id}`, { method: "DELETE" });
      setTransactions((p) => p.filter((t) => t.id !== id));
      notify("Lançamento excluído");
    } catch (err) { notify(err.message); }
  }

  async function clearAll() {
    if (!confirm("Apagar TODOS os lançamentos do banco de dados? Essa ação não pode ser desfeita.")) return;
    try {
      await api("/api/transactions", { method: "DELETE" });
      setTransactions([]);
      notify("Banco de dados limpo");
    } catch (err) { notify(err.message); }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  function exportCSV() {
    const rows = [
      ["Data","Descrição","Tipo","Categoria","Valor","Conta","Observações"],
      ...monthTransactions.map((t) => [t.date, t.description, t.type, t.category, t.amount, t.account, t.notes || ""]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v ?? "").replaceAll('"','""')}"`).join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `fluxo-${month}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const exportTXT = (all) => {
    window.location.href = `/api/transactions/export${all ? "" : `?month=${month}`}`;
  };

  async function runImport(fileOrText) {
    const fd = new FormData();
    if (fileOrText instanceof File) fd.append("file", fileOrText);
    else fd.append("text", fileOrText);
    try {
      const r    = await fetch("/api/transactions/import", { method: "POST", body: fd });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Falha ao importar");
      setImportResult(data);
      if (data.items?.length) {
        setTransactions((p) => [...data.items, ...p]);
        setMonth(monthKey(data.items[0].date));
      }
      notify(`${data.inserted} lançamento(s) importado(s)${data.errors.length ? `, ${data.errors.length} linha(s) com erro` : ""}`);
    } catch (err) { notify(err.message); }
  }

  // Linhas da tabela: na aba Lançamentos mostra tudo; na Visão geral só os 7 mais recentes
  const tableRows = active === "Lançamentos" ? filtered : filtered.slice(0, 7);

  const navItems = [
    { name: "Visão geral",   icon: LayoutDashboard },
    { name: "Lançamentos",   icon: ArrowLeftRight },
    { name: "Orçamento",     icon: Wallet },
    { name: "Investimentos", icon: ChartNoAxesCombined },
    { name: "Metas",         icon: Target },
  ];

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <main className="app-shell">
      {toast && <div className="toast">{toast}</div>}
      {mobileNav && <div className="mobile-overlay" onClick={() => setMobileNav(false)} />}

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><ChartNoAxesCombined size={22} /></div>
          <span>fluxo<span className="brand-dot">.</span></span>
        </div>
        <div className="workspace">
          <div className="workspace-avatar">FP</div>
          <div className="workspace-text"><strong>Minhas finanças</strong><small>Espaço pessoal</small></div>
          <ChevronDown size={15} />
        </div>
        <div className="nav-label">MENU PRINCIPAL</div>
        <nav className="nav-list">
          {navItems.map((item) => (
            <button key={item.name} className={`nav-item ${active === item.name ? "active" : ""}`}
              onClick={() => { setActive(item.name); setMobileNav(false); }}>
              <item.icon size={18} /><span>{item.name}</span>
              {item.name === "Lançamentos" && <span className="nav-count">{transactions.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="tip-card">
            <div className="tip-icon"><Sparkles size={17} /></div>
            <strong>Pequenos passos,<br />grandes resultados.</strong>
            <p>Organize hoje para conquistar amanhã.</p>
            <div className="tip-progress"><span /></div>
            <small>Seu controle começa aqui</small>
          </div>
          <button className={`nav-item ${active === "Configurações" ? "active" : ""}`} onClick={() => setActive("Configurações")}>
            <Settings size={18} /><span>Configurações</span>
          </button>
          <button className="nav-item" onClick={logout}>
            <LogOut size={18} /><span>Sair</span>
          </button>
        </div>
      </aside>

      {/* ── Área principal ── */}
      <section className="main-area">
        <header className="topbar">
          <button className="mobile-menu icon-button" onClick={() => setMobileNav(!mobileNav)} aria-label="Abrir menu"><Menu size={20} /></button>
          <div className="breadcrumb">Finanças <span>/</span> <strong>{active}</strong></div>
          <div className="top-actions">
            <label className="search-box">
              <Search size={17} />
              <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar lançamento..." />
              <kbd>⌘ K</kbd>
            </label>
            <div className="top-avatar" title="fabiomtk@gmail.com">F</div>
          </div>
        </header>

        <div className="content">
          {/* Cabeçalho da página */}
          <div className="page-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-dot" /> SEU PAINEL FINANCEIRO</div>
              <h1>{active === "Visão geral" ? "Seu dinheiro, sob controle" : active}</h1>
              <p>Acompanhe sua vida financeira e tome decisões com confiança.</p>
            </div>
            <div className="heading-actions">
              <label className="month-select">
                <CalendarDays size={16} />
                <select value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Selecionar mês">
                  {monthOptions.map((m) => <option key={m} value={m}>{monthName(m)}</option>)}
                </select>
                <ChevronDown size={14} />
              </label>
              <button className="secondary-button" onClick={() => { setImportResult(null); setImportOpen(true); }}>
                <Upload size={16} /> Importar TXT
              </button>
              <button className="primary-button" onClick={openNew}><Plus size={18} /> Novo lançamento</button>
            </div>
          </div>

          {/* ── Configurações ── */}
          {active === "Configurações" ? (
            <section className="settings-panel">
              <div className="section-title"><h2>Configurações</h2></div>
              <p>Seus dados ficam salvos no banco de dados SQLite do servidor e protegidos por login com JWT.</p>
              <div className="table-actions" style={{ marginTop: 16 }}>
                <button className="secondary-button" onClick={() => exportTXT(true)}><FileText size={16} /> Exportar tudo em TXT</button>
                <button className="secondary-button" onClick={clearAll}><Trash2 size={16} /> Apagar todos os lançamentos</button>
              </div>
              <p className="muted-note">Faça um backup em TXT antes de apagar. Para trocar a senha, edite o arquivo <code>.env.local</code>.</p>
            </section>
          ) : (
            <>
              {/* ── KPIs ── */}
              <div className="kpi-grid">
                {[
                  ["green","positive","Entradas","Total de entradas",totals.income,ArrowDownRight,"Dinheiro que entrou no mês"],
                  ["red","negative","Despesas","Total de despesas",totals.expenses,ArrowUpRight,"Contas e gastos do mês"],
                  ["blue","blue-tag","Investimentos","Total investido",totals.invested,ChartNoAxesCombined,"Construindo patrimônio"],
                  ["purple","purple-tag","Reserva","Total guardado",totals.saved,PiggyBank,"Dinheiro separado"],
                ].map(([c, tag, name, label, val, Icon, foot]) => (
                  <article className="kpi-card" key={name}>
                    <div className="kpi-top">
                      <span className={`kpi-icon ${c}`}><Icon size={19} /></span>
                      <span className={`kpi-tag ${tag}`}>{name}</span>
                    </div>
                    <div className="kpi-label">{label}</div>
                    <div className="kpi-value">{brl(val)}</div>
                    <div className="kpi-foot">
                      <span className={`foot-icon ${c}-text`}><TrendingUp size={14} /></span>
                      <span>{foot}</span>
                    </div>
                  </article>
                ))}
              </div>

              {/* ── Grade do meio ── */}
              <div className="middle-grid">
                {/* Resumo do mês */}
                <section className="panel balance-panel">
                  <div className="panel-heading">
                    <div><h2>Resumo do mês</h2><p>Uma visão clara do seu dinheiro</p></div>
                    <button className="subtle-button" onClick={() => setActive("Lançamentos")}>Ver lançamentos <ArrowUpRight size={15} /></button>
                  </div>
                  <div className="balance-main">
                    <div>
                      <span className="balance-caption">Saldo após despesas, investimentos e reserva</span>
                      <div className={`balance-value ${balance < 0 ? "negative-balance" : ""}`}>{brl(balance)}</div>
                    </div>
                    <div className="balance-pill">
                      <span className={balance >= 0 ? "pill-dot" : "pill-dot red-dot"} />
                      {balance >= 0 ? "Saldo positivo" : "Saldo negativo"}
                    </div>
                  </div>
                  <div className="flow-bar">
                    <div className="flow-income"  style={{ width: pct(totals.income) }} />
                    <div className="flow-expenses" style={{ width: pct(totals.expenses) }} />
                    <div className="flow-invest"   style={{ width: pct(totals.invested) }} />
                  </div>
                  <div className="legend-grid">
                    {[["green-bg","Entradas",totals.income],["red-bg","Despesas",totals.expenses],["blue-bg","Investido",totals.invested],["purple-bg","Guardado",totals.saved]].map(([cls, label, val]) => (
                      <div key={label}><span className={`legend-dot ${cls}`}/><span>{label}</span><strong>{brl(val)}</strong></div>
                    ))}
                  </div>
                </section>

                {/* Donut */}
                <section className="panel spending-panel">
                  <div className="panel-heading"><div><h2>Para onde vai seu dinheiro?</h2><p>Distribuição das despesas</p></div></div>
                  {expenseByCategory.length === 0 ? (
                    <div className="empty-chart">
                      <div className="empty-donut"><CircleDollarSign size={25} /></div>
                      <strong>Sem despesas por enquanto</strong>
                      <span>Adicione lançamentos para ver a distribuição.</span>
                    </div>
                  ) : (
                    <div className="donut-layout">
                      <div className="donut" style={{ background: `conic-gradient(${donut})` }}>
                        <div className="donut-hole"><span>Total gasto</span><strong>{brl(expenseTotal)}</strong></div>
                      </div>
                      <div className="donut-legend">
                        {expenseByCategory.slice(0, 5).map(([name, value], i) => (
                          <div className="donut-legend-row" key={name}>
                            <span className="legend-dot" style={{ background: colors[i % colors.length] }} />
                            <span className="legend-name">{name}</span>
                            <strong>{Math.round((value / (expenseTotal || 1)) * 100)}%</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              </div>

              {/* ── Grade inferior ── */}
              <div className="bottom-grid">
                {/* Tabela de lançamentos */}
                <section className="panel transactions-panel">
                  <div className="panel-heading transaction-heading">
                    <div>
                      <h2>{active === "Lançamentos" ? "Todos os lançamentos" : "Últimos lançamentos"}</h2>
                      <p>Movimentações de {monthName(month)}</p>
                    </div>
                    <div className="table-actions">
                      <button className="secondary-button export-button" onClick={() => exportTXT(false)}><FileText size={15} /> TXT</button>
                      <button className="secondary-button export-button" onClick={exportCSV}><Download size={15} /> CSV</button>
                      {active !== "Lançamentos" && (
                        <button className="subtle-button" onClick={() => setActive("Lançamentos")}>Ver todos <ArrowUpRight size={15} /></button>
                      )}
                    </div>
                  </div>
                  <div className="filter-row">
                    <div className="filter-tabs">
                      {["Todos","Entrada","Despesa","Investimento","Guardado"].map((t) => (
                        <button key={t} className={typeFilter === t ? "filter-active" : ""} onClick={() => setTypeFilter(t)}>
                          {{ Todos:"Todos", Entrada:"Entradas", Despesa:"Despesas", Investimento:"Investidos", Guardado:"Guardados" }[t]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr><th>DESCRIÇÃO</th><th>DATA</th><th>CATEGORIA</th><th>TIPO</th><th className="align-right">VALOR</th><th /></tr>
                      </thead>
                      <tbody>
                        {tableRows.map((t) => {
                          const Icon = iconFor(t.category);
                          const k    = typeClass(t.type);
                          return (
                            <tr key={t.id}>
                              <td>
                                <div className="transaction-name">
                                  <span className={`transaction-icon ${k}-icon`}><Icon size={16} /></span>
                                  <span>
                                    <strong>{t.description}</strong>
                                    <small>{t.account}{t.notes ? ` · ${t.notes}` : ""}</small>
                                  </span>
                                </div>
                              </td>
                              <td className="date-cell">{datePt(t.date)}</td>
                              <td><span className="category-chip">{t.category}</span></td>
                              <td><span className={`type-label type-${k}`}>{t.type}</span></td>
                              <td className={`align-right amount-cell ${t.type === "Entrada" ? "amount-income" : ""}`}>
                                {t.type === "Entrada" ? "+ " : "− "}{brl(t.amount)}
                              </td>
                              <td>
                                <button className="row-delete" onClick={() => openEdit(t)} aria-label={`Editar ${t.description}`} title="Editar"><Pencil size={15} /></button>
                                <button className="row-delete" onClick={() => removeTransaction(t.id)} aria-label={`Excluir ${t.description}`} title="Excluir"><Trash2 size={15} /></button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {!loading && filtered.length === 0 && (
                      <div className="empty-table">
                        <ReceiptText size={25} />
                        <strong>Nenhum lançamento encontrado</strong>
                        <span>Experimente mudar o filtro, importar um TXT ou adicionar uma movimentação.</span>
                        <button className="primary-button small" onClick={openNew}><Plus size={15} /> Adicionar lançamento</button>
                      </div>
                    )}
                    {loading && <div className="empty-table"><span>Carregando...</span></div>}
                  </div>
                </section>

                {/* Categorias */}
                <section className="panel categories-panel">
                  <div className="panel-heading"><div><h2>Principais despesas</h2><p>Por categoria neste mês</p></div></div>
                  {expenseByCategory.length === 0 ? (
                    <div className="category-empty">Suas categorias vão aparecer aqui conforme você registrar despesas.</div>
                  ) : (
                    <div className="category-list">
                      {expenseByCategory.slice(0, 6).map(([name, value], i) => {
                        const Icon = iconFor(name);
                        return (
                          <div className="category-row" key={name}>
                            <div className="category-row-top">
                              <div className="category-left">
                                <span className="category-icon" style={{ color: colors[i % colors.length], background: colors[i % colors.length] + "18" }}><Icon size={16} /></span>
                                <span>{name}</span>
                              </div>
                              <strong>{brl(value)}</strong>
                            </div>
                            <div className="category-track">
                              <span style={{ width: `${Math.max(2, (value / (expenseTotal || 1)) * 100)}%`, background: colors[i % colors.length] }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="useful-spending">
                    <div className="useful-icon"><Sparkles size={16} /></div>
                    <div>
                      <strong>Gastos essenciais</strong>
                      <p>Água, luz, aluguel, alimentação, transporte, internet, cursos e saúde.</p>
                      <span>{brl(essentialTotal)} neste mês</span>
                    </div>
                  </div>
                </section>
              </div>

              {/* Abas extras */}
              {active === "Orçamento" && (
                <div className="below-note">
                  <strong>Orçamento mensal</strong>
                  <p>Despesas essenciais: <b>{brl(essentialTotal)}</b> de <b>{brl(totals.expenses)}</b> ({totals.expenses ? Math.round((essentialTotal / totals.expenses) * 100) : 0}%).</p>
                </div>
              )}
              {active === "Investimentos" && (
                <div className="below-note">
                  <strong>Visão de investimentos</strong>
                  <p>Total investido neste mês: <b>{brl(totals.invested)}</b>. Acumulado geral: <b>{brl(transactions.filter((t) => t.type === "Investimento").reduce((a, t) => a + Number(t.amount), 0))}</b>.</p>
                </div>
              )}
              {active === "Metas" && (
                <div className="below-note">
                  <strong>Suas metas financeiras</strong>
                  <p>Guardado neste mês: <b>{brl(totals.saved)}</b>. Acumulado geral: <b>{brl(transactions.filter((t) => t.type === "Guardado").reduce((a, t) => a + Number(t.amount), 0))}</b>.</p>
                </div>
              )}
            </>
          )}

          <footer className="footer">
            <span>© 2026 Fluxo Financeiro</span>
            <span><span className="secure-dot" /> Dados salvos no banco, acesso com login</span>
          </footer>
        </div>
      </section>

      {/* ── Modal: Novo / Editar lançamento ── */}
      {modal && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setModal(false); }}>
          <section className="modal" role="dialog" aria-modal="true">
            <div className="modal-heading">
              <div>
                <div className="modal-kicker">{editing ? "EDITAR MOVIMENTAÇÃO" : "NOVA MOVIMENTAÇÃO"}</div>
                <h2>{editing ? "Editar lançamento" : "Adicionar lançamento"}</h2>
                <p>Registre uma entrada, despesa ou valor separado.</p>
              </div>
              <button className="icon-button" onClick={() => setModal(false)} aria-label="Fechar"><X size={20} /></button>
            </div>
            <form onSubmit={saveTransaction}>
              <div className="type-choice">
                {types.map((t) => (
                  <button type="button" key={t} className={`type-choice-button ${form.type === t ? "chosen" : ""} choice-${t.toLowerCase()}`}
                    onClick={() => setForm({ ...form, type: t, category: defaultCategory(t) })}>
                    {t}
                  </button>
                ))}
              </div>
              <div className="form-grid">
                <label className="form-field full-field">
                  <span>Descrição</span>
                  <input required autoFocus placeholder="Ex.: conta de luz, salário..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </label>
                <label className="form-field">
                  <span>Valor (R$)</span>
                  <div className="money-input">
                    <span>R$</span>
                    <input required min="0.01" step="0.01" type="number" placeholder="0,00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                  </div>
                </label>
                <label className="form-field">
                  <span>Data</span>
                  <input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </label>
                <label className="form-field">
                  <span>Categoria</span>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {categories.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </label>
                <label className="form-field">
                  <span>Conta / pagamento</span>
                  <select value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })}>
                    {accounts.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </label>
                <label className="form-field full-field">
                  <span>Observações <small>(opcional)</small></span>
                  <input placeholder="Algum detalhe para lembrar..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="primary-button"><Check size={17} /> {editing ? "Salvar alterações" : "Salvar lançamento"}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* ── Modal: Importar TXT ── */}
      {importOpen && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setImportOpen(false); }}>
          <section className="modal import-box" role="dialog" aria-modal="true">
            <div className="modal-heading">
              <div>
                <div className="modal-kicker">IMPORTAR LISTA</div>
                <h2>Importar lançamentos de um TXT</h2>
                <p>Envie um arquivo ou cole o texto. Separe os campos por <b>;</b></p>
              </div>
              <button className="icon-button" onClick={() => setImportOpen(false)} aria-label="Fechar"><X size={20} /></button>
            </div>
            <details>
              <summary style={{ cursor:"pointer", fontWeight:600, fontSize:"0.85rem", marginBottom:8 }}>Ver formato aceito</summary>
              <pre className="import-help">{TXT_EXAMPLE}{"\n\n# Também aceito sem seção, com o tipo na linha:\n# 03/10/2026; Despesa; Aluguel; Aluguel de outubro; 950,00; Pix"}</pre>
            </details>
            <textarea
              placeholder={TXT_EXAMPLE}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
            <input ref={fileRef} type="file" accept=".txt,text/plain" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) runImport(f); e.target.value = ""; }} />
            {importResult && (
              <div>
                <strong>{importResult.inserted} importado(s).</strong>
                {importResult.errors.length > 0 && (
                  <ul className="import-errors">{importResult.errors.map((er, i) => <li key={i}>{er}</li>)}</ul>
                )}
              </div>
            )}
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => fileRef.current?.click()}><Upload size={16} /> Escolher arquivo .txt</button>
              <button type="button" className="secondary-button" onClick={() => setImportText(TXT_EXAMPLE)}>Usar exemplo</button>
              <button type="button" className="primary-button" disabled={!importText.trim()} onClick={() => runImport(importText)}><Check size={17} /> Importar texto</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
