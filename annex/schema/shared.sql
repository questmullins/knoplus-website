-- Annex's list of seller accounts, kept in the kno.plus database. Sign-ins are the kno.plus accounts (server/).
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,               -- rosewave; other sellers are reached with ?account=<id>
  name TEXT NOT NULL,
  tz TEXT NOT NULL DEFAULT 'America/New_York',
  db TEXT NOT NULL,                  -- the binding name of the account's database: CLIENT_DB, or DB_<ACCOUNT>
  brand TEXT NOT NULL DEFAULT '{}',  -- {"name","logo","colors":{...}}
  created TEXT NOT NULL
);
-- Quest's money-making areas, shown on Assets and Overview. account names a seller account above when its sales are
-- connected; kind 'service' with id 'websites' counts the client projects.
CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'app',  -- store, app, service, tool
  status TEXT NOT NULL DEFAULT '',
  account TEXT NOT NULL DEFAULT '',
  link TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  tone TEXT NOT NULL DEFAULT '#85cfc0',
  note TEXT NOT NULL DEFAULT '',
  sort INTEGER NOT NULL DEFAULT 0,
  created TEXT NOT NULL
);
