import { getDatabase } from './connection';
import { Account, NewAccount, UpdateAccount, AccountType, CreateEnvelopeData } from './types';

export class AccountsRepository {
  private _db: any = null;

  private get db() {
    if (!this._db) {
      this._db = getDatabase();
    }
    return this._db;
  }

  // Reset database connection when switching profiles
  public resetConnection() {
    this._db = null;
  }

  create(account: NewAccount): Account {
    try {
      // Use a transaction to ensure both account and envelope are created together
      const transaction = this.db.transaction(() => {
        // Create the account
        const accountStmt = this.db.prepare(`
          INSERT INTO accounts (name, type, initial_balance, current_balance)
          VALUES (?, ?, ?, ?)
        `);
        
        const currentBalance = account.current_balance ?? account.initial_balance;
        const accountResult = accountStmt.run(
          account.name,
          account.type,
          account.initial_balance,
          currentBalance
        );
        
        const accountId = accountResult.lastInsertRowid as number;
        const newAccount = this.getById(accountId)!;
        
        // Determine envelope type based on account type
        const envelopeType = account.type === 'credit_card' ? 'debt' : 'cash';
        
        // Create the corresponding unassigned envelope
        const envelopeStmt = this.db.prepare(`
          INSERT INTO envelopes (name, account_id, type, current_balance, description)
          VALUES (?, ?, ?, ?, ?)
        `);
        
        envelopeStmt.run(
          `Unassigned ${account.name}`,
          accountId,
          envelopeType,
          currentBalance,
          `Automatically created unassigned envelope for ${account.name}`
        );
        
        return newAccount;
      });
      
      return transaction();
    } catch (error) {
      throw new Error(`Failed to create account: ${error}`);
    }
  }

  getById(id: number): Account | null {
    try {
      const stmt = this.db.prepare('SELECT * FROM accounts WHERE id = ?');
      const account = stmt.get(id) as Account | undefined;
      return account || null;
    } catch (error) {
      throw new Error(`Failed to get account by ID: ${error}`);
    }
  }

  getAll(): Account[] {
    try {
      const stmt = this.db.prepare('SELECT * FROM accounts ORDER BY created_at DESC');
      return stmt.all() as Account[];
    } catch (error) {
      throw new Error(`Failed to get all accounts: ${error}`);
    }
  }

  getByType(type: AccountType): Account[] {
    try {
      const stmt = this.db.prepare('SELECT * FROM accounts WHERE type = ? ORDER BY created_at DESC');
      return stmt.all(type) as Account[];
    } catch (error) {
      throw new Error(`Failed to get accounts by type: ${error}`);
    }
  }

  update(updateData: UpdateAccount): Account | null {
    try {
      const existingAccount = this.getById(updateData.id);
      if (!existingAccount) {
        return null;
      }

      // Use a transaction to ensure account and envelope updates are atomic
      const transaction = this.db.transaction(() => {
        // If updating account balance, validate envelope integrity first
        if (updateData.current_balance !== undefined && updateData.current_balance !== existingAccount.current_balance) {
          // Get all envelopes for this account
          const getEnvelopesStmt = this.db.prepare(`
            SELECT id, name, current_balance FROM envelopes 
            WHERE account_id = ?
          `);
          const envelopes = getEnvelopesStmt.all(updateData.id) as { id: number; name: string; current_balance: number }[];
          
          // Calculate total envelope balance
          const totalEnvelopeBalance = envelopes.reduce((sum, env) => sum + env.current_balance, 0);
          const newAccountBalance = updateData.current_balance;
          const balanceDifference = newAccountBalance - totalEnvelopeBalance;
          
          // If there would be a discrepancy, block the update and provide detailed error
          if (Math.abs(balanceDifference) > 0.01) {
            const errorDetails = {
              accountName: existingAccount.name,
              currentAccountBalance: existingAccount.current_balance,
              newAccountBalance: newAccountBalance,
              totalEnvelopeBalance: totalEnvelopeBalance,
              difference: balanceDifference,
              envelopes: envelopes.map(env => ({
                name: env.name,
                balance: env.current_balance
              })),
              message: `Cannot update account balance: Would create ${balanceDifference.toFixed(2)} discrepancy.\n\n` +
                      `New account balance: ${newAccountBalance.toFixed(2)}\n` +
                      `Total envelope balance: ${totalEnvelopeBalance.toFixed(2)}\n` +
                      `Difference: ${balanceDifference.toFixed(2)}\n\n` +
                      `Please first update envelope balances to match your intended allocation, then update the account balance.`
            };
            
            throw new Error(JSON.stringify(errorDetails));
          }
        }

        // Proceed with account update only if balance integrity is maintained
        const fields = [];
        const values = [];
        let nameChanged = false;

        if (updateData.name !== undefined) {
          fields.push('name = ?');
          values.push(updateData.name);
          nameChanged = true;
        }
        if (updateData.type !== undefined) {
          fields.push('type = ?');
          values.push(updateData.type);
        }
        if (updateData.initial_balance !== undefined) {
          fields.push('initial_balance = ?');
          values.push(updateData.initial_balance);
        }
        if (updateData.current_balance !== undefined) {
          fields.push('current_balance = ?');
          values.push(updateData.current_balance);
        }

        if (fields.length === 0) {
          return existingAccount;
        }

        // Update the account
        values.push(updateData.id);
        const stmt = this.db.prepare(`
          UPDATE accounts 
          SET ${fields.join(', ')}
          WHERE id = ?
        `);
        
        stmt.run(...values);

        // Update envelope names if account name changed (but not balances)
        if (nameChanged) {
          // Find and update unassigned envelope name
          const findUnassignedStmt = this.db.prepare(`
            SELECT id FROM envelopes 
            WHERE account_id = ? AND name LIKE 'Unassigned %'
            LIMIT 1
          `);
          const unassignedEnvelope = findUnassignedStmt.get(updateData.id) as { id: number } | undefined;

          if (unassignedEnvelope) {
            const updateEnvelopeNameStmt = this.db.prepare(`
              UPDATE envelopes 
              SET name = ?
              WHERE id = ?
            `);
            updateEnvelopeNameStmt.run(`Unassigned ${updateData.name}`, unassignedEnvelope.id);
          }
        }

        return this.getById(updateData.id);
      });

      return transaction();
    } catch (error) {
      // Try to parse error as JSON for detailed balance error, otherwise throw original
      try {
        const errorData = JSON.parse(String(error).replace('Error: ', ''));
        if (errorData.message) {
          throw new Error(errorData.message);
        }
      } catch {
        // Not a JSON error, throw original
      }
      throw new Error(`Failed to update account: ${error}`);
    }
  }

  delete(id: number): boolean {
    try {
      // Use a transaction to ensure both account and related envelopes are deleted together
      const transaction = this.db.transaction(() => {
        // Delete all envelopes associated with this account (CASCADE should handle this, but being explicit)
        const deleteEnvelopesStmt = this.db.prepare('DELETE FROM envelopes WHERE account_id = ?');
        deleteEnvelopesStmt.run(id);
        
        // Delete the account
        const deleteAccountStmt = this.db.prepare('DELETE FROM accounts WHERE id = ?');
        const result = deleteAccountStmt.run(id);
        
        return result.changes > 0;
      });
      
      return transaction();
    } catch (error) {
      throw new Error(`Failed to delete account: ${error}`);
    }
  }

  getTotalBalance(): number {
    try {
      const stmt = this.db.prepare('SELECT SUM(current_balance) as total FROM accounts');
      const result = stmt.get() as { total: number | null };
      return result.total || 0;
    } catch (error) {
      throw new Error(`Failed to get total balance: ${error}`);
    }
  }

  getBalanceByType(type: AccountType): number {
    try {
      const stmt = this.db.prepare('SELECT SUM(current_balance) as total FROM accounts WHERE type = ?');
      const result = stmt.get(type) as { total: number | null };
      return result.total || 0;
    } catch (error) {
      throw new Error(`Failed to get balance by type: ${error}`);
    }
  }

  // Utility method to create unassigned envelopes for existing accounts that don't have them
  createMissingUnassignedEnvelopes(): { created: number; errors: string[] } {
    try {
      const transaction = this.db.transaction(() => {
        const results = { created: 0, errors: [] as string[] };
        
        // Get all accounts
        const accounts = this.getAll();
        
        for (const account of accounts) {
          try {
            // Check if this account already has an unassigned envelope
            const checkStmt = this.db.prepare(`
              SELECT id FROM envelopes 
              WHERE account_id = ? AND name = ?
            `);
            const existingUnassigned = checkStmt.get(account.id, `Unassigned ${account.name}`);
            
            if (!existingUnassigned) {
              // Create unassigned envelope for this account
              const envelopeType = account.type === 'credit_card' ? 'debt' : 'cash';
              
              // Calculate unassigned balance (account balance minus sum of existing envelopes)
              const envelopeSumStmt = this.db.prepare(`
                SELECT COALESCE(SUM(current_balance), 0) as total 
                FROM envelopes WHERE account_id = ?
              `);
              const envelopeSum = envelopeSumStmt.get(account.id) as { total: number };
              const unassignedBalance = account.current_balance - envelopeSum.total;
              
              const createEnvelopeStmt = this.db.prepare(`
                INSERT INTO envelopes (name, account_id, type, current_balance, description)
                VALUES (?, ?, ?, ?, ?)
              `);
              
              createEnvelopeStmt.run(
                `Unassigned ${account.name}`,
                account.id,
                envelopeType,
                unassignedBalance,
                `Automatically created unassigned envelope for existing account ${account.name}`
              );
              
              results.created++;
            }
          } catch (error) {
            results.errors.push(`Failed to create unassigned envelope for ${account.name}: ${error}`);
          }
        }
        
        return results;
      });
      
      return transaction();
    } catch (error) {
      throw new Error(`Failed to create missing unassigned envelopes: ${error}`);
    }
  }
}

// Export singleton instance - but don't instantiate database connection yet
export const accountsRepository = new AccountsRepository();