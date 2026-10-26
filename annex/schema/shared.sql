-- Annex's list of seller accounts, kept in the kno.plus database. Sign-ins are the kno.plus accounts (server/).
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,               -- rosewave; other sellers are reached with ?account=<id>
  name TEXT NOT NULL,
  tz TEXT NOT NULL DEFAULT 'America/New_York',
  db TEXT NOT NULL,                  -- the binding name of the account's database: CLIENT_DB, or DB_<ACCOUNT>
  brand TEXT NOT NULL DEFAULT '{}',  -- {"name","logo","colors":{...}}
  created TEXT NOT NULL
);
