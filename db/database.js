const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'pet-data.db');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

// create the db if it doesn't exist
db.exec(`
CREATE TABLE IF NOT EXISTS pets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    features TEXT,
    descriptors TEXT
);

CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    FOREIGN KEY (pet_id) REFERENCES pets(id)
);
`)

module.exports = db;