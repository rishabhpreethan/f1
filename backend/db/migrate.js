import Database from 'better-sqlite3';

const sqlite = new Database('../sqlite.db');

// This will create the tables if they don't exist
const main = async () => {
  console.log('Running migrations...');
  
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      username TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS auth (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      password TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  console.log('Migrations completed!');
  process.exit(0);
};

main().catch((err) => {
  console.error('Migration failed!');
  console.error(err);
  process.exit(1);
});
