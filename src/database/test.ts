import { accountsRepository } from './accounts';
import { NewAccount } from './types';

export function runDatabaseTest(): void {
  console.log('🧪 Starting database test...');
  
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
    
    const createdChecking = accountsRepository.create(checkingAccount);
    const createdSavings = accountsRepository.create(savingsAccount);
    const createdCreditCard = accountsRepository.create(creditCardAccount);
    const createdCash = accountsRepository.create(cashAccount);
    
    console.log('✅ Created accounts:', {
      checking: createdChecking.id,
      savings: createdSavings.id,
      creditCard: createdCreditCard.id,
      cash: createdCash.id
    });
    
    // Test 2: Read individual account
    console.log('🔍 Testing individual account retrieval...');
    const retrievedAccount = accountsRepository.getById(createdChecking.id);
    if (retrievedAccount?.name === checkingAccount.name) {
      console.log('✅ Individual account retrieval successful');
    } else {
      throw new Error('Account retrieval failed');
    }
    
    // Test 3: Read all accounts
    console.log('📋 Testing all accounts retrieval...');
    const allAccounts = accountsRepository.getAll();
    if (allAccounts.length >= 4) {
      console.log(`✅ Retrieved ${allAccounts.length} accounts`);
    } else {
      throw new Error('All accounts retrieval failed');
    }
    
    // Test 4: Get accounts by type
    console.log('🏷️ Testing accounts by type...');
    const checkingAccounts = accountsRepository.getByType('checking');
    const creditCardAccounts = accountsRepository.getByType('credit_card');
    console.log(`✅ Found ${checkingAccounts.length} checking account(s), ${creditCardAccounts.length} credit card account(s)`);
    
    // Test 5: Update account
    console.log('✏️ Testing account update...');
    const updatedAccount = accountsRepository.update({
      id: createdSavings.id,
      current_balance: 5250.75
    });
    if (updatedAccount?.current_balance === 5250.75) {
      console.log('✅ Account update successful');
    } else {
      throw new Error('Account update failed');
    }
    
    // Test 6: Balance calculations
    console.log('💰 Testing balance calculations...');
    const totalBalance = accountsRepository.getTotalBalance();
    const checkingBalance = accountsRepository.getBalanceByType('checking');
    console.log(`✅ Total balance: $${totalBalance.toFixed(2)}, Checking balance: $${checkingBalance.toFixed(2)}`);
    
    // Test 7: Delete account (clean up one test account)
    console.log('🗑️ Testing account deletion...');
    const deleteSuccess = accountsRepository.delete(createdCash.id);
    if (deleteSuccess) {
      console.log('✅ Account deletion successful');
    } else {
      throw new Error('Account deletion failed');
    }
    
    // Final verification
    const finalAccountCount = accountsRepository.getAll().length;
    console.log(`📊 Final account count: ${finalAccountCount}`);
    
    console.log('🎉 All database tests passed successfully!');
    console.log('🏁 Database foundation is ready for UI integration.');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    throw error;
  }
}