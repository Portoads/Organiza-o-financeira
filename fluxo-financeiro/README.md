# 💰 Fluxo Financeiro v2

Painel financeiro pessoal com login, banco de dados, importação/exportação de TXT e muito mais.

## ✨ O que há de novo na v2

| Recurso | Detalhes |
|---|---|
| **Login com JWT** | Cookie HttpOnly, sessão de 7 dias |
| **Banco SQLite** | `better-sqlite3`, arquivo local em `data/fluxo.db` |
| **Editar lançamentos** | Lápis na tabela abre o modal preenchido |
| **Importar TXT** | Cole ou envie um `.txt` organizado por seções |
| **Exportar TXT** | Baixa o mês atual ou todos os lançamentos |
| **Exportar CSV** | Compatível com Excel e Google Sheets |
| **Fuso horário correto** | Datas usam horário local (corrige bug UTC) |
| **⌘K funciona** | Foco no campo de busca |
| **Barra de fluxo corrigida** | Funciona mesmo sem entradas |
| **"Ver todos" corrigido** | Aba Lançamentos exibe realmente todos |

## 🚀 Instalação e uso

```bash
# 1. Instale as dependências
npm install

# 2. Configure as variáveis de ambiente
# Edite o arquivo .env.local (já criado com seus dados):
#   ADMIN_EMAIL=fabiomtk@gmail.com
#   ADMIN_PASSWORD=fabiomtk1234
#   AUTH_SECRET=troque-por-uma-chave-longa (importante!)
#   DB_PATH=./data/fluxo.db

# 3. Rode em desenvolvimento
npm run dev
```

Acesse `http://localhost:3000` → será redirecionado para `/login`.

## 🔒 Segurança

- O arquivo `.env.local` está no `.gitignore` — nunca é enviado ao GitHub.
- Para trocar a senha, edite o `.env.local`.
- Para usar senha com hash (mais seguro): gere com  
  `node -e "console.log(require('bcryptjs').hashSync('SUA_SENHA',10))"`  
  e coloque o hash em `ADMIN_PASSWORD_HASH` no `.env.local`.

## 📂 Estrutura

```
fluxo-financeiro/
├─ app/
│  ├─ layout.jsx
│  ├─ globals.css
│  ├─ page.jsx                          ← dashboard principal
│  ├─ login/page.jsx
│  └─ api/
│     ├─ auth/login/route.js
│     ├─ auth/logout/route.js
│     ├─ transactions/route.js          ← GET lista / POST cria / DELETE limpa tudo
│     ├─ transactions/[id]/route.js     ← PUT edita / DELETE exclui
│     ├─ transactions/import/route.js   ← POST arquivo .txt
│     └─ transactions/export/route.js   ← GET .txt organizado
├─ lib/
│  ├─ db.js      ← SQLite (better-sqlite3)
│  ├─ auth.js    ← JWT + bcrypt
│  └─ txt.js     ← parser e gerador de TXT
├─ middleware.js  ← proteção de rotas
├─ .env.local     ← NUNCA commite!
└─ data/fluxo.db  ← criado automaticamente
```

## 📄 Formato do TXT para importação

```text
[ENTRADAS]
05/10/2026; Freelance/Serviços; Projeto de site; 2450,00; Pix

[DESPESAS]
03/10/2026; Aluguel; Aluguel de outubro; 950,00; Pix
04/10/2026; Compra do mês; Supermercado; 428,65; Débito; obs opcional

[INVESTIMENTOS]
09/10/2026; Investimentos; Aplicação CDB; 600; Transferência

[GUARDADO]
06/10/2026; Reserva de emergência; Reserva; 400; Transferência

# Também aceito sem seção, com o tipo na linha:
# 03/10/2026; Despesa; Aluguel; Aluguel de outubro; 950,00; Pix
```

> **Nota sobre Vercel:** o SQLite não funciona no sistema de arquivos efêmero da Vercel.  
> Para hospedar em produção, use um VPS, Railway ou Render com disco persistente.  
> Se quiser Vercel, o próximo passo seria migrar `lib/db.js` para Postgres (Neon/Supabase).
