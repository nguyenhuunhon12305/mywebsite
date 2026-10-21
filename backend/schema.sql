CREATE TABLE IF NOT EXISTS pageviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  day TEXT NOT NULL,
  path TEXT NOT NULL,
  browser_hash TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pageviews_time ON pageviews(ts);
CREATE INDEX IF NOT EXISTS idx_pageviews_day ON pageviews(day);
CREATE TABLE IF NOT EXISTS account_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  day TEXT NOT NULL,
  account_hash TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_account_events_time ON account_events(ts);
