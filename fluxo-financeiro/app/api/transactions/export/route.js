import { listAll } from "@/lib/db";
import { buildTxt } from "@/lib/txt";

export async function GET(req) {
  // Aceita ?month=YYYY-MM para filtrar por mês; sem parâmetro exporta tudo
  const month = new URL(req.url).searchParams.get("month");
  const rows = listAll().filter((t) => !month || t.date.startsWith(month));
  const txt = buildTxt(
    rows,
    month ? `MÊS ${month}` : "TODOS OS LANÇAMENTOS"
  );

  return new Response("\ufeff" + txt, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="fluxo-${month || "tudo"}.txt"`,
    },
  });
}
