-- Annex's shared database: who can sign in, and which seller accounts exist. No sales data lives here.
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,               -- the subdomain: rosewave for rosewave.kno.plus
  name TEXT NOT NULL,
  tz TEXT NOT NULL DEFAULT 'America/New_York',
  db TEXT NOT NULL,                  -- the binding name of the account's own database, e.g. DB_ROSEWAVE
  brand TEXT NOT NULL DEFAULT '{}',  -- {"name","logo","colors":{...}}
  created TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  hash TEXT NOT NULL,                -- PBKDF2-SHA256, base64
  salt TEXT NOT NULL,
  failed INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER NOT NULL DEFAULT 0,
  created TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS access (
  account TEXT NOT NULL REFERENCES accounts(id),
  user TEXT NOT NULL REFERENCES users(id),
  role TEXT NOT NULL DEFAULT 'owner',
  PRIMARY KEY (account, user)
);
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,               -- SHA-256 of the cookie, never the cookie itself
  user TEXT NOT NULL REFERENCES users(id),
  expires INTEGER NOT NULL
);
