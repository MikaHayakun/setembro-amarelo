PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS source (
    id INTEGER PRIMARY KEY,
    institution TEXT NOT NULL,
    title TEXT NOT NULL,
    year TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    reference TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS campaign (
    month INTEGER PRIMARY KEY CHECK(month BETWEEN 1 AND 12),
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    hex TEXT NOT NULL,
    theme TEXT NOT NULL,
    summary TEXT NOT NULL,
    purpose TEXT NOT NULL,
    details_json TEXT NOT NULL DEFAULT '{}',
    reviewed_on TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS campaign_source (
    month INTEGER NOT NULL REFERENCES campaign(month),
    source_id INTEGER NOT NULL REFERENCES source(id),
    PRIMARY KEY(month, source_id)
);
