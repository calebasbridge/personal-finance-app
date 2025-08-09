import { getDatabase } from './connection';
import { 
  Transaction, 
  TransactionInput, 
  TransactionWithDetails, 
  UpdateTransactionData,
  AccountTransfer,
  CreateAccountTransferData,
  AccountBalanceByStatus,
  EnvelopeBalanceByStatus,
  AccountType,
  TransactionStatus,
  isValidTransactionStatus,
  statusAffectsBalance,
  statusAffectsAvailableBalance
} from './types';

export class TransactionDatabase {
  private _db: any = null;

  private get db() {
    if (!this._db) {
      this._db = getDatabase();
      this.createTables();
      this.createViews();
    }
    return this._db;
  }

  // Reset database connection when switching profiles
  public resetConnection() {
    this._db = null;
  }

  private createTables(): void {
    // Create transactions table
    const createTransactionsTable = `
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER NOT NULL,
        envelope_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        date DATETIME NOT NULL,
        status TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'debit',
        description TEXT,
        reference_number TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE,
        FOREIGN KEY (envelope_id) REFERENCES envelopes (id) ON DELETE CASCADE,
        CHECK (amount != 0),
        CHECK (status IN ('not_posted', 'pending', 'cleared', 'unpaid', 'paid')),
        CHECK (type IN ('debit', 'credit', 'transfer', 'payment'))
      )
    `;

    // Create account_transfers table
    const createAccountTransfersTable = `
      CREATE TABLE IF NOT EXISTS account_transfers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_account_id INTEGER NOT NULL,
        to_account_id INTEGER NOT NULL,
        from_envelope_id INTEGER NOT NULL,
        to_envelope_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        date DATETIME NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (from_account_id) REFERENCES accounts (id) ON DELETE CASCADE,
        FOREIGN KEY (to_account_id) REFERENCES accounts (id) ON DELETE CASCADE,
        FOREIGN KEY (from_envelope_id) REFERENCES envelopes (id) ON DELETE CASCADE,
        FOREIGN KEY (to_envelope_id) REFERENCES envelopes (id) ON DELETE CASCADE,
        CHECK (amount > 0),
        CHECK (from_account_id != to_account_id)
      )
    `;

    // Create indexes for performance
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions (account_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_envelope_id ON transactions (envelope_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (date);
      CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions (status);
      CREATE INDEX IF NOT EXISTS idx_account_transfers_date ON account_transfers (date);
    `;

    // Create triggers for timestamp updates
    const createTriggers = `
      CREATE TRIGGER IF NOT EXISTS update_transactions_updated_at 
      AFTER UPDATE ON transactions
      FOR EACH ROW
      BEGIN
        UPDATE transactions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
    `;

    this.db.exec(createTransactionsTable);
    this.db.exec(createAccountTransfersTable);
    this.db.exec(createIndexes);
    this.db.exec(createTriggers);
  }

  private createViews(): void {
    // Drop existing views to recreate with updated logic
    this.db.exec('DROP VIEW IF EXISTS account_balances_by_status');
    this.db.exec('DROP VIEW IF EXISTS envelope_balances_by_status');
    
    // Create view for account balances by status
    const createAccountBalancesView = `
      CREATE VIEW IF NOT EXISTS account_balances_by_status AS
      SELECT 
        a.id as account_id,
        a.name as account_name,
        a.type as account_type,
        COALESCE(SUM(CASE WHEN t.status = 'not_posted' THEN t.amount ELSE 0 END), 0) as not_posted_balance,
        COALESCE(SUM(CASE WHEN t.status = 'pending' THEN t.amount ELSE 0 END), 0) as pending_balance,
        COALESCE(SUM(CASE WHEN t.status = 'cleared' THEN t.amount ELSE 0 END), 0) as cleared_balance,
        COALESCE(SUM(CASE WHEN t.status = 'unpaid' THEN t.amount ELSE 0 END), 0) as unpaid_balance,
        COALESCE(SUM(CASE WHEN t.status = 'paid' THEN t.amount ELSE 0 END), 0) as paid_balance,
        COALESCE(SUM(t.amount), 0) as total_balance,
        CASE 
          WHEN COUNT(t.id) = 0 THEN a.current_balance
          WHEN a.type = 'credit_card' THEN COALESCE(SUM(CASE WHEN t.status IN ('unpaid', 'cleared') THEN t.amount ELSE 0 END), 0)
          ELSE COALESCE(SUM(CASE WHEN t.status IN ('pending', 'cleared') THEN t.amount ELSE 0 END), 0)
        END as available_balance
      FROM accounts a
      LEFT JOIN transactions t ON a.id = t.account_id
      GROUP BY a.id, a.name, a.type, a.current_balance
    `;

    // Create view for envelope balances by status
    const createEnvelopeBalancesView = `
      CREATE VIEW IF NOT EXISTS envelope_balances_by_status AS
      SELECT 
        e.id as envelope_id,
        e.name as envelope_name,
        e.account_id,
        a.name as account_name,
        a.type as account_type,
        e.type as envelope_type,
        COALESCE(SUM(CASE WHEN t.status = 'not_posted' THEN t.amount ELSE 0 END), 0) as not_posted_balance,
        COALESCE(SUM(CASE WHEN t.status = 'pending' THEN t.amount ELSE 0 END), 0) as pending_balance,
        COALESCE(SUM(CASE WHEN t.status = 'cleared' THEN t.amount ELSE 0 END), 0) as cleared_balance,
        COALESCE(SUM(CASE WHEN t.status = 'unpaid' THEN t.amount ELSE 0 END), 0) as unpaid_balance,
        COALESCE(SUM(CASE WHEN t.status = 'paid' THEN t.amount ELSE 0 END), 0) as paid_balance,
        COALESCE(SUM(t.amount), 0) as total_balance,
        CASE 
          WHEN COUNT(t.id) = 0 THEN e.current_balance
          WHEN a.type = 'credit_card' THEN COALESCE(SUM(CASE WHEN t.status IN ('unpaid', 'cleared') THEN t.amount ELSE 0 END), 0)
          ELSE COALESCE(SUM(CASE WHEN t.status IN ('pending', 'cleared') THEN t.amount ELSE 0 END), 0)
        END as available_balance
      FROM envelopes e
      JOIN accounts a ON e.account_id = a.id
      LEFT JOIN transactions t ON e.id = t.envelope_id
      GROUP BY e.id, e.name, e.account_id, a.name, a.type, e.type, e.current_balance
    `;

    this.db.exec(createAccountBalancesView);
    this.db.exec(createEnvelopeBalancesView);
  }

  // Transaction CRUD Operations
  createTransaction(transaction: TransactionInput): Transaction {
    // Validate transaction status for account type
    const account = this.db.prepare('SELECT type FROM accounts WHERE id = ?').get(transaction.account_id) as { type: AccountType };
    if (!account) {
      throw new Error('Account not found');
    }

    if (!isValidTransactionStatus(account.type, transaction.status)) {
      throw new Error(`Invalid status '${transaction.status}' for account type '${account.type}'`);
    }

    // Validate envelope belongs to account
    const envelope = this.db.prepare('SELECT account_id FROM envelopes WHERE id = ?').get(transaction.envelope_id) as { account_id: number };
    if (!envelope || envelope.account_id !== transaction.account_id) {
      throw new Error('Envelope does not belong to the specified account');
    }

    const stmt = this.db.prepare(`
      INSERT INTO transactions (account_id, envelope_id, amount, date, status, type, description, reference_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      transaction.account_id,
      transaction.envelope_id,
      transaction.amount,
      transaction.date,
      transaction.status,
      transaction.type || 'debit',
      transaction.description || null,
      transaction.reference_number || null
    );

    if (result.changes === 0) {
      throw new Error('Failed to create transaction');
    }

    return this.getTransactionById(result.lastInsertRowid as number)!;
  }

  getTransactionById(id: number): Transaction | null {
    const stmt = this.db.prepare('SELECT * FROM transactions WHERE id = ?');
    return stmt.get(id) as Transaction | null;
  }

  getTransactionWithDetailsById(id: number): TransactionWithDetails | null {
    const stmt = this.db.prepare(`
      SELECT 
        t.*,
        a.name as account_name,
        a.type as account_type,
        e.name as envelope_name,
        e.type as envelope_type
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      JOIN envelopes e ON t.envelope_id = e.id
      WHERE t.id = ?
    `);
    return stmt.get(id) as TransactionWithDetails | null;
  }

  getAllTransactions(): TransactionWithDetails[] {
    const stmt = this.db.prepare(`
      SELECT 
        t.*,
        a.name as account_name,
        a.type as account_type,
        e.name as envelope_name,
        e.type as envelope_type
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      JOIN envelopes e ON t.envelope_id = e.id
      ORDER BY t.date DESC, t.created_at DESC
    `);
    return stmt.all() as TransactionWithDetails[];
  }

  getTransactionsByAccount(accountId: number): TransactionWithDetails[] {
    const stmt = this.db.prepare(`
      SELECT 
        t.*,
        a.name as account_name,
        a.type as account_type,
        e.name as envelope_name,
        e.type as envelope_type
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      JOIN envelopes e ON t.envelope_id = e.id
      WHERE t.account_id = ?
      ORDER BY t.date DESC, t.created_at DESC
    `);
    return stmt.all(accountId) as TransactionWithDetails[];
  }

  getTransactionsByEnvelope(envelopeId: number): TransactionWithDetails[] {
    const stmt = this.db.prepare(`
      SELECT 
        t.*,
        a.name as account_name,
        a.type as account_type,
        e.name as envelope_name,
        e.type as envelope_type
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      JOIN envelopes e ON t.envelope_id = e.id
      WHERE t.envelope_id = ?
      ORDER BY t.date DESC, t.created_at DESC
    `);
    return stmt.all(envelopeId) as TransactionWithDetails[];
  }

  updateTransaction(id: number, updates: UpdateTransactionData): Transaction {
    const existing = this.getTransactionById(id);
    if (!existing) {
      throw new Error('Transaction not found');
    }

    // If status is being updated, validate it
    if (updates.status) {
      const account = this.db.prepare('SELECT type FROM accounts WHERE id = ?').get(existing.account_id) as { type: AccountType };
      if (!isValidTransactionStatus(account.type, updates.status)) {
        throw new Error(`Invalid status '${updates.status}' for account type '${account.type}'`);
      }
    }

    // If account_id or envelope_id is being updated, validate the relationship
    if (updates.account_id || updates.envelope_id) {
      const accountId = updates.account_id || existing.account_id;
      const envelopeId = updates.envelope_id || existing.envelope_id;
      
      const envelope = this.db.prepare('SELECT account_id FROM envelopes WHERE id = ?').get(envelopeId) as { account_id: number };
      if (!envelope || envelope.account_id !== accountId) {
        throw new Error('Envelope does not belong to the specified account');
      }
    }

    const fields = [];
    const values = [];

    if (updates.account_id !== undefined) {
      fields.push('account_id = ?');
      values.push(updates.account_id);
    }
    if (updates.envelope_id !== undefined) {
      fields.push('envelope_id = ?');
      values.push(updates.envelope_id);
    }
    if (updates.amount !== undefined) {
      fields.push('amount = ?');
      values.push(updates.amount);
    }
    if (updates.date !== undefined) {
      fields.push('date = ?');
      values.push(updates.date);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.type !== undefined) {
      fields.push('type = ?');
      values.push(updates.type);
    }
    if (updates.reference_number !== undefined) {
      fields.push('reference_number = ?');
      values.push(updates.reference_number);
    }

    if (fields.length === 0) {
      return existing;
    }

    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE transactions SET ${fields.join(', ')} WHERE id = ?
    `);

    const result = stmt.run(...values);
    if (result.changes === 0) {
      throw new Error('Failed to update transaction');
    }

    return this.getTransactionById(id)!;
  }

  deleteTransaction(id: number): boolean {
    const existing = this.getTransactionById(id);
    if (!existing) {
      return false;
    }

    const stmt = this.db.prepare('DELETE FROM transactions WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Account Transfer Operations
  createAccountTransfer(transfer: CreateAccountTransferData): AccountTransfer {
    // Validate accounts exist and are different
    const fromAccount = this.db.prepare('SELECT id, type FROM accounts WHERE id = ?').get(transfer.from_account_id) as { id: number, type: AccountType };
    const toAccount = this.db.prepare('SELECT id, type FROM accounts WHERE id = ?').get(transfer.to_account_id) as { id: number, type: AccountType };

    if (!fromAccount || !toAccount) {
      throw new Error('One or both accounts not found');
    }

    if (fromAccount.id === toAccount.id) {
      throw new Error('Cannot transfer to the same account');
    }

    // Validate envelopes belong to their respective accounts
    const fromEnvelope = this.db.prepare('SELECT account_id FROM envelopes WHERE id = ?').get(transfer.from_envelope_id) as { account_id: number };
    const toEnvelope = this.db.prepare('SELECT account_id FROM envelopes WHERE id = ?').get(transfer.to_envelope_id) as { account_id: number };

    if (!fromEnvelope || fromEnvelope.account_id !== transfer.from_account_id) {
      throw new Error('From envelope does not belong to from account');
    }

    if (!toEnvelope || toEnvelope.account_id !== transfer.to_account_id) {
      throw new Error('To envelope does not belong to to account');
    }

    const stmt = this.db.prepare(`
      INSERT INTO account_transfers (from_account_id, to_account_id, from_envelope_id, to_envelope_id, amount, date, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      transfer.from_account_id,
      transfer.to_account_id,
      transfer.from_envelope_id,
      transfer.to_envelope_id,
      transfer.amount,
      transfer.date,
      transfer.description || null
    );

    if (result.changes === 0) {
      throw new Error('Failed to create account transfer');
    }

    return this.getAccountTransferById(result.lastInsertRowid as number)!;
  }

  getAccountTransferById(id: number): AccountTransfer | null {
    const stmt = this.db.prepare('SELECT * FROM account_transfers WHERE id = ?');
    return stmt.get(id) as AccountTransfer | null;
  }

  getAllAccountTransfers(): AccountTransfer[] {
    const stmt = this.db.prepare('SELECT * FROM account_transfers ORDER BY date DESC, created_at DESC');
    return stmt.all() as AccountTransfer[];
  }

  // Balance Calculation Methods
  getAccountBalancesByStatus(): AccountBalanceByStatus[] {
    const stmt = this.db.prepare('SELECT * FROM account_balances_by_status ORDER BY account_name');
    return stmt.all() as AccountBalanceByStatus[];
  }

  getAccountBalanceByStatusById(accountId: number): AccountBalanceByStatus | null {
    const stmt = this.db.prepare('SELECT * FROM account_balances_by_status WHERE account_id = ?');
    return stmt.get(accountId) as AccountBalanceByStatus | null;
  }

  getEnvelopeBalancesByStatus(): EnvelopeBalanceByStatus[] {
    const stmt = this.db.prepare('SELECT * FROM envelope_balances_by_status ORDER BY account_name, envelope_name');
    return stmt.all() as EnvelopeBalanceByStatus[];
  }

  getEnvelopeBalanceByStatusById(envelopeId: number): EnvelopeBalanceByStatus | null {
    const stmt = this.db.prepare('SELECT * FROM envelope_balances_by_status WHERE envelope_id = ?');
    return stmt.get(envelopeId) as EnvelopeBalanceByStatus | null;
  }

  // Balance Integrity Validation
  validateBalanceIntegrity(): { valid: boolean; discrepancies: any[] } {
    const stmt = this.db.prepare(`
      SELECT 
        a.id as account_id,
        a.name as account_name,
        a.current_balance as stored_balance,
        abs.available_balance as calculated_balance,
        (a.current_balance - abs.available_balance) as difference
      FROM accounts a
      LEFT JOIN account_balances_by_status abs ON a.id = abs.account_id
      WHERE abs(a.current_balance - abs.available_balance) > 0.001
    `);

    const discrepancies = stmt.all();
    return {
      valid: discrepancies.length === 0,
      discrepancies
    };
  }

  // Bulk Operations
  createBulkTransactions(transactions: TransactionInput[]): Transaction[] {
    const createStmt = this.db.prepare(`
      INSERT INTO transactions (account_id, envelope_id, amount, date, status, type, description, reference_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const results: Transaction[] = [];

    this.db.transaction(() => {
      for (const transaction of transactions) {
        // Validate each transaction
        const account = this.db.prepare('SELECT type FROM accounts WHERE id = ?').get(transaction.account_id) as { type: AccountType };
        if (!account) {
          throw new Error(`Account ${transaction.account_id} not found`);
        }

        if (!isValidTransactionStatus(account.type, transaction.status)) {
          throw new Error(`Invalid status '${transaction.status}' for account type '${account.type}'`);
        }

        const envelope = this.db.prepare('SELECT account_id FROM envelopes WHERE id = ?').get(transaction.envelope_id) as { account_id: number };
        if (!envelope || envelope.account_id !== transaction.account_id) {
          throw new Error(`Envelope ${transaction.envelope_id} does not belong to account ${transaction.account_id}`);
        }

        const result = createStmt.run(
          transaction.account_id,
          transaction.envelope_id,
          transaction.amount,
          transaction.date,
          transaction.status,
          transaction.type || 'debit',
          transaction.description || null,
          transaction.reference_number || null
        );

        const created = this.getTransactionById(result.lastInsertRowid as number)!;
        results.push(created);
      }
    })();

    return results;
  }

  // Search and Filter Operations
  searchTransactions(searchTerm: string, limit: number = 100): TransactionWithDetails[] {
    const stmt = this.db.prepare(`
      SELECT 
        t.*,
        a.name as account_name,
        a.type as account_type,
        e.name as envelope_name,
        e.type as envelope_type
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      JOIN envelopes e ON t.envelope_id = e.id
      WHERE 
        t.description LIKE ? OR
        a.name LIKE ? OR
        e.name LIKE ?
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT ?
    `);

    const searchPattern = `%${searchTerm}%`;
    return stmt.all(searchPattern, searchPattern, searchPattern, limit) as TransactionWithDetails[];
  }

  getTransactionsByStatus(status: TransactionStatus): TransactionWithDetails[] {
    const stmt = this.db.prepare(`
      SELECT 
        t.*,
        a.name as account_name,
        a.type as account_type,
        e.name as envelope_name,
        e.type as envelope_type
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      JOIN envelopes e ON t.envelope_id = e.id
      WHERE t.status = ?
      ORDER BY t.date DESC, t.created_at DESC
    `);
    return stmt.all(status) as TransactionWithDetails[];
  }

  getTransactionsByDateRange(startDate: string, endDate: string): TransactionWithDetails[] {
    const stmt = this.db.prepare(`
      SELECT 
        t.*,
        a.name as account_name,
        a.type as account_type,
        e.name as envelope_name,
        e.type as envelope_type
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      JOIN envelopes e ON t.envelope_id = e.id
      WHERE t.date BETWEEN ? AND ?
      ORDER BY t.date DESC, t.created_at DESC
    `);
    return stmt.all(startDate, endDate) as TransactionWithDetails[];
  }

  // Enhanced Transaction Management Methods
  
  // Check if transaction has payment allocations (for credit card payments)
  hasPaymentAllocations(transactionId: number): boolean {
    try {
      const stmt = this.db.prepare(`
        SELECT COUNT(*) as count 
        FROM payment_allocations pa
        JOIN credit_card_payments ccp ON pa.payment_id = ccp.id
        WHERE pa.transaction_id = ?
      `);
      const result = stmt.get(transactionId) as { count: number };
      return result.count > 0;
    } catch (error) {
      // If payment_allocations table doesn't exist, return false
      return false;
    }
  }

  // Get payment allocation details for a transaction
  getPaymentAllocationDetails(transactionId: number): any[] {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          pa.*,
          ccp.date as payment_date,
          ccp.description as payment_description,
          a.name as source_account_name,
          e.name as source_envelope_name
        FROM payment_allocations pa
        JOIN credit_card_payments ccp ON pa.payment_id = ccp.id
        JOIN accounts a ON ccp.source_account_id = a.id
        JOIN envelopes e ON pa.source_envelope_id = e.id
        WHERE pa.transaction_id = ?
        ORDER BY ccp.date DESC
      `);
      return stmt.all(transactionId);
    } catch (error) {
      return [];
    }
  }

  // Check if transaction is from a split (partial payment)
  isSplitTransaction(transactionId: number): { isSplit: boolean; originalAmount?: number; originalDate?: string } {
    const transaction = this.getTransactionById(transactionId);
    if (!transaction) {
      return { isSplit: false };
    }

    // Check if this transaction has a description indicating it's from a split
    // This is a simple check - you might want to add a dedicated split_transactions table
    if (transaction.description && transaction.description.includes('(Split from')) {
      // Extract original amount from description if present
      const match = transaction.description.match(/\(Split from \$([\d,\.]+) on ([\d-]+)\)/);
      if (match) {
        return {
          isSplit: true,
          originalAmount: parseFloat(match[1].replace(',', '')),
          originalDate: match[2]
        };
      }
      return { isSplit: true };
    }

    return { isSplit: false };
  }

  // Enhanced filtering with pagination
  getTransactionsWithFilters(options: {
    accountId?: number;
    startDate?: string;
    endDate?: string;
    status?: TransactionStatus;
    searchTerm?: string;
    limit?: number;
    offset?: number;
  }): { transactions: TransactionWithDetails[]; totalCount: number } {
    let whereConditions = [];
    let params = [];
    
    if (options.accountId) {
      whereConditions.push('t.account_id = ?');
      params.push(options.accountId);
    }
    
    if (options.startDate && options.endDate) {
      whereConditions.push('t.date BETWEEN ? AND ?');
      params.push(options.startDate, options.endDate);
    }
    
    if (options.status) {
      whereConditions.push('t.status = ?');
      params.push(options.status);
    }
    
    if (options.searchTerm) {
      whereConditions.push('(t.description LIKE ? OR a.name LIKE ? OR e.name LIKE ?)');
      const searchPattern = `%${options.searchTerm}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Get total count
    const countStmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      JOIN envelopes e ON t.envelope_id = e.id
      ${whereClause}
    `);
    const countResult = countStmt.get(...params) as { count: number };
    
    // Get transactions with pagination
    const limit = options.limit || 50;
    const offset = options.offset || 0;
    
    const dataStmt = this.db.prepare(`
      SELECT 
        t.*,
        a.name as account_name,
        a.type as account_type,
        e.name as envelope_name,
        e.type as envelope_type
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      JOIN envelopes e ON t.envelope_id = e.id
      ${whereClause}
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT ? OFFSET ?
    `);
    
    const transactions = dataStmt.all(...params, limit, offset) as TransactionWithDetails[];
    
    return {
      transactions,
      totalCount: countResult.count
    };
  }

  // Safe transaction update with validation and warnings
  updateTransactionSafe(id: number, updates: UpdateTransactionData): {
    success: boolean;
    transaction?: Transaction;
    warnings: string[];
    error?: string;
  } {
    const warnings: string[] = [];
    
    try {
      // Check for payment allocations
      if (this.hasPaymentAllocations(id)) {
        warnings.push('This transaction has credit card payment allocations. Editing may affect payment records.');
      }
      
      // Check if it's a split transaction
      const splitInfo = this.isSplitTransaction(id);
      if (splitInfo.isSplit) {
        warnings.push(`This transaction is part of a split from ${splitInfo.originalAmount || 'unknown'} on ${splitInfo.originalDate || 'unknown date'}.`);
      }
      
      // Perform the update
      const transaction = this.updateTransaction(id, updates);
      
      return {
        success: true,
        transaction,
        warnings
      };
    } catch (error) {
      return {
        success: false,
        warnings,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Safe transaction delete with validation and warnings
  deleteTransactionSafe(id: number): {
    success: boolean;
    warnings: string[];
    error?: string;
  } {
    const warnings: string[] = [];
    
    try {
      // Check for payment allocations
      if (this.hasPaymentAllocations(id)) {
        warnings.push('This transaction has credit card payment allocations. Deleting will affect payment records.');
      }
      
      // Check if it's a split transaction
      const splitInfo = this.isSplitTransaction(id);
      if (splitInfo.isSplit) {
        warnings.push(`This transaction is part of a split from ${splitInfo.originalAmount || 'unknown'} on ${splitInfo.originalDate || 'unknown date'}.`);
      }
      
      // Perform the delete
      const success = this.deleteTransaction(id);
      
      return {
        success,
        warnings
      };
    } catch (error) {
      return {
        success: false,
        warnings,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// Export singleton instance - but don't instantiate database connection yet
export const transactionDatabase = new TransactionDatabase();

// Export additional types for transaction management
export interface TransactionFilters {
  accountId?: number;
  startDate?: string;
  endDate?: string;
  status?: TransactionStatus;
  searchTerm?: string;
  limit?: number;
  offset?: number;
}

export interface TransactionUpdateResult {
  success: boolean;
  transaction?: Transaction;
  warnings: string[];
  error?: string;
}

export interface TransactionDeleteResult {
  success: boolean;
  warnings: string[];
  error?: string;
}

export interface PaginatedTransactions {
  transactions: TransactionWithDetails[];
  totalCount: number;
}