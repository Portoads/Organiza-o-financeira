import { TYPES } from "./db";

const SECTION = {
  ENTRADA: "Entrada", ENTRADAS: "Entrada", RECEITA: "Entrada", RECEITAS: "Entrada",
  DESPESA: "Despesa", DESPESAS: "Despesa", GASTO: "Despesa", GASTOS: "Despesa",
  SAIDA: "Despesa", SAIDAS: "Despesa",
  INVESTIMENTO: "Investimento", INVESTIMENTOS: "Investimento",
  GUARDADO: "Guardado", GUARDADOS: "Guardado", RESERVA: "Guardado", POUPANCA: "Guardado",
};

const norm = (s) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();

export function parseDate(raw) {
  const s = (raw || "").trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return s;
  m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return null;
}

export function parseAmount(raw) {
  let s = (raw || "").replace(/R\$|\s/g, "");
  if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(/,/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? Math.abs(n) : null;
}

/**
 * Formato aceito (campos separados por ";" ou "|"):
 *
 *   [DESPESAS]
 *   05/10/2026; Aluguel; Aluguel outubro; 950,00; Pix; obs opcional
 *   → data; categoria; descrição; valor; conta; observações
 *
 * Ou com o tipo na própria linha (sem seção):
 *   05/10/2026; Despesa; Aluguel; Aluguel outubro; 950,00; Pix
 *
 * Linhas iniciadas com # ou vazias são ignoradas.
 */
export function parseTxt(text) {
  const items = [], errors = [];
  let current = "Despesa";

  text.split(/\r?\n/).forEach((line, i) => {
    const n = i + 1;
    const l = line.trim();
    if (!l || l.startsWith("#") || /^[-=]{3,}$/.test(l)) return;

    // Detecta cabeçalho de seção: [ENTRADAS] ou simplesmente ENTRADAS:
    const sec = l.match(/^\[?\s*([A-Za-zÀ-ú ]+?)\s*\]?:?$/);
    if (sec && SECTION[norm(sec[1])]) {
      current = SECTION[norm(sec[1])];
      return;
    }

    const f = l.split(/\s*[;|]\s*/);
    if (f.length < 4) {
      return errors.push(`linha ${n}: esperado ao menos "data; categoria; descrição; valor"`);
    }

    // Verifica se o segundo campo é um tipo explícito
    let type = current;
    const typeInline = TYPES.find((t) => norm(t) === norm(f[1]));
    if (typeInline) { type = typeInline; f.splice(1, 1); }

    const [d, category, description, amt, account = "Pix", ...rest] = f;
    const date = parseDate(d);
    const amount = parseAmount(amt);

    if (!date) return errors.push(`linha ${n}: data inválida "${d}"`);
    if (!amount) return errors.push(`linha ${n}: valor inválido "${amt}"`);
    if (!category || !description)
      return errors.push(`linha ${n}: categoria/descrição em branco`);

    items.push({
      date,
      type,
      category,
      description,
      amount,
      account: account || "Pix",
      notes: rest.join("; "),
    });
  });

  return { items, errors };
}

const brl = (n) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);
const datePt = (d) => d.split("-").reverse().join("/");
const pad = (s, n) => String(s ?? "").padEnd(n);

export function buildTxt(transactions, title = "LANÇAMENTOS") {
  const lines = [
    `# FLUXO FINANCEIRO — ${title}`,
    `# Gerado em ${new Date().toLocaleString("pt-BR")}`,
    "",
  ];

  const grand = {};

  for (const type of TYPES) {
    const rows = transactions
      .filter((t) => t.type === type)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (!rows.length) continue;

    const total = rows.reduce((a, t) => a + Number(t.amount), 0);
    grand[type] = total;

    const header = `[${norm(type)}S]`.replace("GUARDADOS", "GUARDADO");
    lines.push(header, "-".repeat(90));
    lines.push(
      `${pad("DATA", 11)}| ${pad("CATEGORIA", 22)}| ${pad("DESCRIÇÃO", 30)}| ${"VALOR".padStart(13)} | CONTA`
    );

    rows.forEach((t) =>
      lines.push(
        `${pad(datePt(t.date), 11)}| ${pad(t.category, 22)}| ${pad(t.description, 30)}| ${brl(t.amount).padStart(13)} | ${t.account}${t.notes ? `; ${t.notes}` : ""}`
      )
    );

    lines.push(
      "-".repeat(90),
      `${pad("TOTAL", 68)}${brl(total).padStart(13)}`,
      ""
    );
  }

  const inc = grand.Entrada || 0;
  const exp = grand.Despesa || 0;
  const inv = grand.Investimento || 0;
  const sav = grand.Guardado || 0;

  lines.push(
    "[RESUMO]",
    "-".repeat(90),
    `Entradas:       ${brl(inc)}`,
    `Despesas:       ${brl(exp)}`,
    `Investimentos:  ${brl(inv)}`,
    `Guardado:       ${brl(sav)}`,
    `Saldo final:    ${brl(inc - exp - inv - sav)}`,
    ""
  );

  return lines.join("\n");
}
