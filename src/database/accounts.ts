import { getDatabase } from './connection';
import { Account, NewAccount, UpdateAccount, AccountType } from './types';

export class AccountsRepository {
  private db = getDatabase();

  create(account: NewAccount): Account {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO accounts (name, type, initial_balance, current_balance)
        VALUES (?, ?, ?, ?)
      `);
      
      const currentBalance = account.current_balance ?? account.initial_balance;
      const result = stmt.run(
        account.name,
        account.type,
        account.initial_balance,
        currentBalance
      );
      
      return this.getById(result.lastInsertRowid as number)!;
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

      const fields = [];
      const values = [];

      if (updateData.name !== undefined) {
        fields.push('name = ?');
        values.push(updateData.name);
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

      values.push(updateData.id);
      const stmt = this.db.prepare(`
        UPDATE accounts 
        SET ${fields.join(', ')}
        WHERE id = ?
      `);
      
      stmt.run(...values);
      return this.getById(updateData.id);
    } catch (error) {
      throw new Error(`Failed to update account: ${error}`);
    }
  }

  delete(id: number): boolean {
    try {
      const stmt = this.db.prepare('DELETE FROM accounts WHERE id = ?');
      const result = stmt.run(id);
      return result.changes > 0;
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
}

// Export singleton instance
export const accountsRepository = new AccountsRepository();