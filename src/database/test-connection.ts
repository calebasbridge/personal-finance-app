import Database from 'better-sqlite3';
import * as path from 'path';
import * as os from 'os';

let db: Database.Database | null = null;

export function getTestDatabase(): Database.Database {
  if (!db) {
    // Use temp directory for testing
    const dbPath = path.join(os.tmpdir(), 'personal-finance-test.db');
    
    db = new Database(dbPath);
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    
    initializeSchema();
  }
  
  return db;
}

function initializeSchema(): void {
  if (!db) return;
  
  // Create accounts table
  const createAccountsTable = `
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'credit_card', 'cash')),
      initial_balance REAL NOT NULL DEFAULT 0,
      current_balance REAL NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  db.exec(createAccountsTable);
  
  // Create trigger to update updated_at timestamp
  const createUpdateTrigger = `
    CREATE TRIGGER IF NOT EXISTS update_accounts_updated_at 
    AFTER UPDATE ON accounts
    FOR EACH ROW
    BEGIN
      UPDATE accounts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END
  `;
  
  db.exec(createUpdateTrigger);
}

export function closeTestDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}