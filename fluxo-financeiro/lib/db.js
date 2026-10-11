import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

let db;

export function getDb() {
  if (db) return db;
  const file = process.env.DB_PATH || "./data/fluxo.db";
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  db = new Database(path.resolve(file));
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      date        TEXT    NOT NULL,
      description TEXT    NOT NULL,
      type        TEXT    NOT NULL CHECK (type IN ('Entrada','Despesa','Investimento','Guardado')),
      category    TEXT    NOT NULL,
      amount      REAL    NOT NULL CHECK (amount > 0),
      account     TEXT    NOT NULL DEFAULT 'Pix',
      notes       TEXT    NOT NULL DEFAULT '',
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(date);
  `);
  return db;
}

export const TYPES = ["Entrada", "Despesa", "Investimento", "Guardado"];

export function validate(t) {
  const errors = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t.date || "")) errors.push("data inválida");
  if (!t.description?.trim()) errors.push("descrição obrigatória");
  if (!TYPES.includes(t.type)) errors.push("tipo inválido");
  if (!t.category?.trim()) errors.push("categoria obrigatória");
  if (!(Number(t.amount) > 0)) errors.push("valor deve ser maior que zero");
  return errors;
}

export function listAll() {
  return getDb()
    .prepare("SELECT * FROM transactions ORDER BY date DESC, id DESC")
    .all();
}

export function insert(t) {
  const r = getDb()
    .prepare(
      "INSERT INTO transactions (date,description,type,category,amount,account,notes) VALUES (?,?,?,?,?,?,?)"
    )
    .run(
      t.date,
      t.description.trim(),
      t.type,
      t.category.trim(),
      Number(t.amount),
      t.account || "Pix",
      t.notes || ""
    );
  return getDb()
    .prepare("SELECT * FROM transactions WHERE id=?")
    .get(r.lastInsertRowid);
}

export function insertMany(list) {
  const run = getDb().transaction((items) => items.map(insert));
  return run(list);
}

export function update(id, t) {
  getDb()
    .prepare(
      "UPDATE transactions SET date=?,description=?,type=?,category=?,amount=?,account=?,notes=? WHERE id=?"
    )
    .run(
      t.date,
      t.description.trim(),
      t.type,
      t.category.trim(),
      Number(t.amount),
      t.account || "Pix",
      t.notes || "",
      id
    );
  return getDb()
    .prepare("SELECT * FROM transactions WHERE id=?")
    .get(id);
}

export function remove(id) {
  return getDb()
    .prepare("DELETE FROM transactions WHERE id=?")
    .run(id).changes;
}

export function removeAll() {
  return getDb().prepare("DELETE FROM transactions").run().changes;
}
