const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Open SQLite database (inside /data folder)
const db = new sqlite3.Database(
  path.join(__dirname, 'data', 'freakyfashion.db'),
  (err) => {
    if (err) {
      console.error('Could not connect to database', err);
    } else {
      console.log('Connected to SQLite database at', path.join(__dirname, 'data', 'freakyfashion.db'));
    }
  }
);

module.exports = db;