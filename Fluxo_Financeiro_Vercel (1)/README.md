# Fluxo Financeiro — pronto para Vercel

Interface responsiva em Next.js para controlar entradas, despesas, investimentos e valores guardados.

## Rodar localmente
1. Instale Node.js 18 ou superior.
2. No terminal, dentro desta pasta, execute `npm install`.
3. Execute `npm run dev` e abra o endereço indicado pelo terminal.

## Publicar na Vercel
1. Descompacte o ZIP.
2. Envie a pasta para um repositório no GitHub.
3. Na Vercel, clique em **Add New → Project** e importe esse repositório.
4. Mantenha o framework como **Next.js** e clique em **Deploy**.

## O que já funciona
- Dashboard responsivo com resumo de entradas, despesas, investimentos, guardado e saldo.
- Criar e excluir lançamentos.
- Filtro por tipo e busca por descrição/categoria/conta.
- Seletor de mês, categorias e meios de pagamento.
- Gráfico de distribuição de despesas e barras por categoria.
- Exportação dos lançamentos do mês para CSV.
- Persistência no navegador via localStorage.

## Limitações importantes
Esta versão é somente front-end: os dados ficam no navegador atual. Não há login, banco de dados nem sincronização entre dispositivos. Os lançamentos de demonstração são exemplos e podem ser apagados. Para múltiplos dispositivos/usuários, conecte um backend como Supabase e implemente autenticação.
