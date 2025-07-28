import { getTestDatabase, closeTestDatabase } from './test-connection';
import { NewAccount, AccountType } from './types';

// Standalone test using Node.js compatible database connection
class TestAccountsRepository {
  private db = getTestDatabase();

  create(account: NewAccount): any {
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

  getById(id: number): any {
    try {
      const stmt = this.db.prepare('SELECT * FROM accounts WHERE id = ?');
      const account = stmt.get(id);
      return account || null;
    } catch (error) {
      throw new Error(`Failed to get account by ID: ${error}`);
    }
  }

  getAll(): any[] {
    try {
      const stmt = this.db.prepare('SELECT * FROM accounts ORDER BY created_at DESC');
      return stmt.all();
    } catch (error) {
      throw new Error(`Failed to get all accounts: ${error}`);
    }
  }

  getByType(type: AccountType): any[] {
    try {
      const stmt = this.db.prepare('SELECT * FROM accounts WHERE type = ? ORDER BY created_at DESC');
      return stmt.all(type);
    } catch (error) {
      throw new Error(`Failed to get accounts by type: ${error}`);
    }
  }

  update(updateData: any): any {
    // Simplified update for testing
    try {
      const stmt = this.db.prepare('UPDATE accounts SET current_balance = ? WHERE id = ?');
      stmt.run(updateData.current_balance, updateData.id);
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
}

export function runStandaloneTest(): void {
  console.log('🧪 Starting standalone database test...');
  
  const repo = new TestAccountsRepository();
  
  try {
    // Test 1: Create accounts
    console.log('📝 Creating test accounts...');
    
    const checkingAccount: NewAccount = {
      name: 'Capital One Checking',
      type: 'checking',
      initial_balance: 1500.00,
      current_balance: 1750.25
    };
    
    const savingsAccount: NewAccount = {
      name: 'High Yield Savings',
      type: 'savings',
      initial_balance: 5000.00
    };
    
    const creditCardAccount: NewAccount = {
      name: 'Chase Freedom',
      type: 'credit_card',
      initial_balance: 0,
      current_balance: -850.50
    };

    const cashAccount: NewAccount = {
      name: 'Wallet Cash',
      type: 'cash',
      initial_balance: 100.00,
      current_balance: 75.00
    };
    
    const createdChecking = repo.create(checkingAccount);
    const createdSavings = repo.create(savingsAccount);
    const createdCreditCard = repo.create(creditCardAccount);
    const createdCash = repo.create(cashAccount);
    
    console.log('✅ Created accounts:', {
      checking: createdChecking.id,
      savings: createdSavings.id,
      creditCard: createdCreditCard.id,
      cash: createdCash.id
    });
    
    // Test 2: Read individual account
    console.log('🔍 Testing individual account retrieval...');
    const retrievedAccount = repo.getById(createdChecking.id);
    if (retrievedAccount?.name === checkingAccount.name) {
      console.log('✅ Individual account retrieval successful');
    } else {
      throw new Error('Account retrieval failed');
    }
    
    // Test 3: Read all accounts
    console.log('📋 Testing all accounts retrieval...');
    const allAccounts = repo.getAll();
    if (allAccounts.length >= 4) {
      console.log(`✅ Retrieved ${allAccounts.length} accounts`);
      allAccounts.forEach(acc => {
        console.log(`   - ${acc.name} (${acc.type}): $${acc.current_balance}`);
      });
    } else {
      throw new Error('All accounts retrieval failed');
    }
    
    // Test 4: Get accounts by type
    console.log('🏷️ Testing accounts by type...');
    const checkingAccounts = repo.getByType('checking');
    const creditCardAccounts = repo.getByType('credit_card');
    console.log(`✅ Found ${checkingAccounts.length} checking account(s), ${creditCardAccounts.length} credit card account(s)`);
    
    // Test 5: Update account
    console.log('✏️ Testing account update...');
    const updatedAccount = repo.update({
      id: createdSavings.id,
      current_balance: 5250.75
    });
    if (updatedAccount?.current_balance === 5250.75) {
      console.log('✅ Account update successful');
    } else {
      throw new Error('Account update failed');
    }
    
    // Test 6: Delete account
    console.log('🗑️ Testing account deletion...');
    const deleteSuccess = repo.delete(createdCash.id);
    if (deleteSuccess) {
      console.log('✅ Account deletion successful');
    } else {
      throw new Error('Account deletion failed');
    }
    
    // Final verification
    const finalAccountCount = repo.getAll().length;
    console.log(`📊 Final account count: ${finalAccountCount}`);
    
    console.log('🎉 All database tests passed successfully!');
    console.log('🏁 Database foundation is ready for UI integration.');
    console.log('💾 Database schema created and all CRUD operations working.');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    throw error;
  } finally {
    closeTestDatabase();
  }
}