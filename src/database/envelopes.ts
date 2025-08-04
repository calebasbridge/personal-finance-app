// src/database/envelopes.ts - Complete envelope database operations

import Database from 'better-sqlite3';
import { getDatabase } from './connection';
import { 
  Envelope, 
  CreateEnvelopeData, 
  UpdateEnvelopeData, 
  EnvelopeTransfer, 
  CreateEnvelopeTransferData,
  EnvelopeWithAccount,
  AccountWithEnvelopes,
  TransactionInput
} from './types';

export class EnvelopeOperations {
  private _db: any = null;

  private get db() {
    if (!this._db) {
      this._db = getDatabase();
      this.initializeTables();
    }
    return this._db;
  }

  // Reset database connection when switching profiles
  public resetConnection() {
    this._db = null;
  }

  private initializeTables(): void {
    // Create envelopes table
    const createEnvelopesTable = `
      CREATE TABLE IF NOT EXISTS envelopes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        account_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('cash', 'debt')),
        current_balance REAL NOT NULL DEFAULT 0,
        spending_limit REAL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE
      )
    `;

    // Create envelope transfers table
    const createTransfersTable = `
      CREATE TABLE IF NOT EXISTS envelope_transfers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_envelope_id INTEGER NOT NULL,
        to_envelope_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        date DATETIME NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (from_envelope_id) REFERENCES envelopes (id) ON DELETE CASCADE,
        FOREIGN KEY (to_envelope_id) REFERENCES envelopes (id) ON DELETE CASCADE
      )
    `;

    // Create indexes
    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_envelopes_account_id ON envelopes(account_id)',
      'CREATE INDEX IF NOT EXISTS idx_envelope_transfers_envelopes ON envelope_transfers(from_envelope_id, to_envelope_id)'
    ];

    this.db.exec(createEnvelopesTable);
    this.db.exec(createTransfersTable);
    createIndexes.forEach(index => this.db.exec(index));
  }

  // Create new envelope
  createEnvelope(data: CreateEnvelopeData): Envelope {
    const stmt = this.db.prepare(`
      INSERT INTO envelopes (name, account_id, type, current_balance, spending_limit, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.name,
      data.account_id,
      data.type,
      data.current_balance || 0,
      data.spending_limit || null,
      data.description || null
    );

    return this.getEnvelopeById(result.lastInsertRowid as number)!;
  }

  // Get envelope by ID
  getEnvelopeById(id: number): Envelope | null {
    const stmt = this.db.prepare('SELECT * FROM envelopes WHERE id = ?');
    return stmt.get(id) as Envelope || null;
  }

  // Get all envelopes
  getAllEnvelopes(): Envelope[] {
    const stmt = this.db.prepare('SELECT * FROM envelopes ORDER BY name');
    return stmt.all() as Envelope[];
  }

  // Get envelopes by account ID
  getEnvelopesByAccountId(accountId: number): Envelope[] {
    const stmt = this.db.prepare('SELECT * FROM envelopes WHERE account_id = ? ORDER BY name');
    return stmt.all(accountId) as Envelope[];
  }

  // Get envelopes by type
  getEnvelopesByType(type: 'cash' | 'debt'): Envelope[] {
    const stmt = this.db.prepare('SELECT * FROM envelopes WHERE type = ? ORDER BY name');
    return stmt.all(type) as Envelope[];
  }

  // Get envelopes with account information
  getEnvelopesWithAccount(): EnvelopeWithAccount[] {
    const stmt = this.db.prepare(`
      SELECT 
        e.*,
        a.name as account_name,
        a.type as account_type
      FROM envelopes e
      JOIN accounts a ON e.account_id = a.id
      ORDER BY a.name, e.name
    `);
    return stmt.all() as EnvelopeWithAccount[];
  }

  // Update envelope
  updateEnvelope(id: number, data: UpdateEnvelopeData): Envelope | null {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.current_balance !== undefined) {
      updates.push('current_balance = ?');
      values.push(data.current_balance);
    }
    if (data.spending_limit !== undefined) {
      updates.push('spending_limit = ?');
      values.push(data.spending_limit);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }

    if (updates.length === 0) {
      return this.getEnvelopeById(id);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE envelopes 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `);

    const result = stmt.run(...values);
    
    if (result.changes === 0) {
      return null;
    }

    return this.getEnvelopeById(id);
  }

  // Delete envelope
  deleteEnvelope(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM envelopes WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Transfer money between envelopes using transaction-aware system
  transferBetweenEnvelopes(transferData: CreateEnvelopeTransferData): EnvelopeTransfer {
    const transaction = this.db.transaction(() => {
      // Get source and destination envelopes
      const fromEnvelope = this.getEnvelopeById(transferData.from_envelope_id);
      const toEnvelope = this.getEnvelopeById(transferData.to_envelope_id);

      if (!fromEnvelope || !toEnvelope) {
        throw new Error('Source or destination envelope not found');
      }

      // Verify envelopes are in the same account
      if (fromEnvelope.account_id !== toEnvelope.account_id) {
        throw new Error('Cannot transfer between envelopes in different accounts');
      }

      // Get transaction-aware balance for source envelope
      const sourceBalanceData = this.db.prepare(`
        SELECT available_balance 
        FROM envelope_balances_by_status 
        WHERE envelope_id = ?
      `).get(transferData.from_envelope_id) as { available_balance: number } | undefined;
      
      if (!sourceBalanceData) {
        throw new Error('Could not retrieve source envelope balance information');
      }
      
      const sourceAvailableBalance = sourceBalanceData.available_balance;

      // Check if source envelope has sufficient funds using transaction-aware balance
      if (sourceAvailableBalance < transferData.amount) {
        throw new Error(`Insufficient funds in source envelope. Available: ${sourceAvailableBalance.toFixed(2)}, Requested: ${transferData.amount.toFixed(2)}`);
      }

      // Create transaction records instead of directly updating envelope balances
      
      // Transaction 1: Negative amount from source envelope (debit)
      const sourceTransactionStmt = this.db.prepare(`
        INSERT INTO transactions (account_id, envelope_id, amount, date, status, description)
        VALUES (?, ?, ?, ?, 'cleared', ?)
      `);

      const sourceTransactionResult = sourceTransactionStmt.run(
        fromEnvelope.account_id,
        transferData.from_envelope_id,
        -transferData.amount, // Negative for outgoing transfer
        transferData.date,
        `Transfer to ${toEnvelope.name}: ${transferData.description || 'Envelope transfer'}`
      );

      // Transaction 2: Positive amount to destination envelope (credit)
      const destTransactionStmt = this.db.prepare(`
        INSERT INTO transactions (account_id, envelope_id, amount, date, status, description)
        VALUES (?, ?, ?, ?, 'cleared', ?)
      `);

      const destTransactionResult = destTransactionStmt.run(
        toEnvelope.account_id,
        transferData.to_envelope_id,
        transferData.amount, // Positive for incoming transfer
        transferData.date,
        `Transfer from ${fromEnvelope.name}: ${transferData.description || 'Envelope transfer'}`
      );

      // Record the transfer in envelope_transfers table for history
      const transferStmt = this.db.prepare(`
        INSERT INTO envelope_transfers (from_envelope_id, to_envelope_id, amount, date, description)
        VALUES (?, ?, ?, ?, ?)
      `);

      const transferResult = transferStmt.run(
        transferData.from_envelope_id,
        transferData.to_envelope_id,
        transferData.amount,
        transferData.date,
        transferData.description || null
      );

      // Return the transfer record
      const getTransferStmt = this.db.prepare('SELECT * FROM envelope_transfers WHERE id = ?');
      return getTransferStmt.get(transferResult.lastInsertRowid as number) as EnvelopeTransfer;
    });

    return transaction();
  }

  // Get transfer history
  getTransferHistory(envelopeId?: number): EnvelopeTransfer[] {
    let stmt;
    
    if (envelopeId) {
      stmt = this.db.prepare(`
        SELECT * FROM envelope_transfers 
        WHERE from_envelope_id = ? OR to_envelope_id = ?
        ORDER BY date DESC, created_at DESC
      `);
      return stmt.all(envelopeId, envelopeId) as EnvelopeTransfer[];
    } else {
      stmt = this.db.prepare(`
        SELECT * FROM envelope_transfers 
        ORDER BY date DESC, created_at DESC
      `);
      return stmt.all() as EnvelopeTransfer[];
    }
  }

  // Get account with all its envelopes and balance validation
  getAccountWithEnvelopes(accountId: number): AccountWithEnvelopes | null {
    // Get account
    const accountStmt = this.db.prepare('SELECT * FROM accounts WHERE id = ?');
    const account = accountStmt.get(accountId) as any;

    if (!account) {
      return null;
    }

    // Get envelopes for this account
    const envelopes = this.getEnvelopesByAccountId(accountId);

    // Calculate envelope total
    const envelope_total = envelopes.reduce((sum, env) => sum + env.current_balance, 0);
    const balance_difference = account.current_balance - envelope_total;

    return {
      id: account.id,
      name: account.name,
      type: account.type,
      initial_balance: account.initial_balance,
      current_balance: account.current_balance,
      created_at: account.created_at,
      updated_at: account.updated_at,
      envelopes,
      envelope_total,
      balance_difference
    };
  }

  // Validate account-envelope balance integrity
  validateAccountEnvelopeIntegrity(): { account_id: number; account_name: string; difference: number }[] {
    const stmt = this.db.prepare(`
      SELECT 
        a.id as account_id,
        a.name as account_name,
        a.current_balance,
        COALESCE(SUM(e.current_balance), 0) as envelope_total,
        (a.current_balance - COALESCE(SUM(e.current_balance), 0)) as difference
      FROM accounts a
      LEFT JOIN envelopes e ON a.id = e.account_id
      GROUP BY a.id, a.name, a.current_balance
      HAVING ABS(difference) > 0.01
    `);

    return stmt.all() as { account_id: number; account_name: string; difference: number }[];
  }
}

// Export singleton instance
export const envelopeRepository = new EnvelopeOperations();