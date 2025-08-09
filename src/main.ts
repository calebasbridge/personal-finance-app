import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { 
  closeDatabase, 
  accountsRepository, 
  envelopeRepository, 
  transactionDatabase,
  creditCardPaymentDatabase, 
  compensationCreatorDatabase,
  getAllProfiles,
  getCurrentProfile,
  createProfile,
  switchToProfile,
  deleteProfile,
  getLastUsedProfile,
  migrateExistingDatabase,
  profileExists,
  verifyProfilePassword,
  changeProfilePassword,
  removeProfilePassword,
  cleanupDuplicateProfiles
} from './database';

let mainWindow: BrowserWindow;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    height: 800,
    width: 1200,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default',
    show: false
  });

  const isDev = process.env.NODE_ENV === 'development';
  
  // Load the built application files
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  
  // DevTools can be opened manually with F12 or Ctrl+Shift+I if needed during development

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null as any;
  });
}

// Set up IPC handlers for database operations
function setupIpcHandlers(): void {
  // Profile Management IPC handlers
  ipcMain.handle('profile:listProfiles', async () => {
    try {
      const profiles = getAllProfiles();
      const currentProfile = getCurrentProfile();
      
      // Mark the current profile as active
      const profilesWithStatus = profiles.map(profile => ({
        ...profile,
        isActive: profile.name === currentProfile
      }));
      
      return { profiles: profilesWithStatus };
    } catch (error) {
      throw new Error(`Failed to get profiles: ${error}`);
    }
  });

  ipcMain.handle('profile:getCurrentProfile', async () => {
    try {
      const currentProfileName = getCurrentProfile();
      const profiles = getAllProfiles();
      const currentProfile = profiles.find(p => p.name === currentProfileName);
      
      return { 
        profileName: currentProfile ? currentProfile.displayName : currentProfileName 
      };
    } catch (error) {
      throw new Error(`Failed to get current profile: ${error}`);
    }
  });

  ipcMain.handle('profile:create', async (_, name, description, password) => {
    try {
      const result = createProfile({ 
        name, 
        displayName: name, 
        description,
        password 
      });
      return { success: true, profileName: result.displayName };
    } catch (error) {
      console.error('Profile creation error:', error);
      throw new Error(`Failed to create profile: ${error}`);
    }
  });

  ipcMain.handle('profile:switchTo', async (_, name, password) => {
    try {
      // Reset all database connections before switching
      accountsRepository.resetConnection();
      envelopeRepository.resetConnection();
      transactionDatabase.resetConnection();
      creditCardPaymentDatabase.resetConnection();
      compensationCreatorDatabase.resetConnection();
      
      // Now switch to the new profile with password if provided
      switchToProfile(name, password);
      return { success: true, profileName: name };
    } catch (error) {
      throw new Error(`Failed to switch to profile: ${error}`);
    }
  });

  ipcMain.handle('profile:delete', async (_, name) => {
    try {
      deleteProfile(name);
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete profile: ${error}`);
    }
  });

  ipcMain.handle('profile:getLastUsed', async () => {
    try {
      return getLastUsedProfile();
    } catch (error) {
      throw new Error(`Failed to get last used profile: ${error}`);
    }
  });

  ipcMain.handle('profile:migrateExistingDatabase', async () => {
    try {
      const migrated = migrateExistingDatabase();
      return { 
        success: true, 
        migrated, 
        profileName: migrated ? 'Main' : undefined 
      };
    } catch (error) {
      throw new Error(`Failed to migrate existing database: ${error}`);
    }
  });

  ipcMain.handle('profile:exists', async (_, name) => {
    try {
      return profileExists(name);
    } catch (error) {
      throw new Error(`Failed to check if profile exists: ${error}`);
    }
  });

  // Enhanced password management handlers
  ipcMain.handle('profile:changePassword', async (_, profileName, oldPassword, newPassword) => {
    try {
      const result = changeProfilePassword(profileName, oldPassword, newPassword);
      return { success: result };
    } catch (error) {
      throw new Error(`Failed to change password: ${error}`);
    }
  });

  ipcMain.handle('profile:removePassword', async (_, profileName, currentPassword) => {
    try {
      const result = removeProfilePassword(profileName, currentPassword);
      return { success: result };
    } catch (error) {
      throw new Error(`Failed to remove password: ${error}`);
    }
  });

  ipcMain.handle('profile:addPassword', async (_, profileName, newPassword) => {
    try {
      const result = changeProfilePassword(profileName, '', newPassword);
      return { success: result };
    } catch (error) {
      throw new Error(`Failed to add password: ${error}`);
    }
  });

  ipcMain.handle('profile:verifyPassword', async (_, profileName, password) => {
    try {
      const valid = verifyProfilePassword(profileName, password);
      return { valid };
    } catch (error) {
      throw new Error(`Failed to verify password: ${error}`);
    }
  });

  // Cleanup handler for duplicate profiles
  ipcMain.handle('profile:cleanupDuplicates', async () => {
    try {
      const cleaned = cleanupDuplicateProfiles();
      return { success: true, cleaned };
    } catch (error) {
      throw new Error(`Failed to cleanup duplicate profiles: ${error}`);
    }
  });

  // Account IPC handlers
  ipcMain.handle('db:createAccount', async (_, accountData) => {
    try {
      return accountsRepository.create(accountData);
    } catch (error) {
      throw new Error(`Failed to create account: ${error}`);
    }
  });

  ipcMain.handle('db:getAllAccounts', async () => {
    try {
      return accountsRepository.getAll();
    } catch (error) {
      throw new Error(`Failed to get all accounts: ${error}`);
    }
  });

  ipcMain.handle('db:getAccountById', async (_, id) => {
    try {
      return accountsRepository.getById(id);
    } catch (error) {
      throw new Error(`Failed to get account by ID: ${error}`);
    }
  });

  ipcMain.handle('db:getAccountsByType', async (_, type) => {
    try {
      return accountsRepository.getByType(type);
    } catch (error) {
      throw new Error(`Failed to get accounts by type: ${error}`);
    }
  });

  ipcMain.handle('db:updateAccount', async (_, updateData) => {
    try {
      return accountsRepository.update(updateData);
    } catch (error) {
      throw new Error(`Failed to update account: ${error}`);
    }
  });

  ipcMain.handle('db:deleteAccount', async (_, id) => {
    try {
      return accountsRepository.delete(id);
    } catch (error) {
      throw new Error(`Failed to delete account: ${error}`);
    }
  });

  ipcMain.handle('db:getTotalBalance', async () => {
    try {
      return accountsRepository.getTotalBalance();
    } catch (error) {
      throw new Error(`Failed to get total balance: ${error}`);
    }
  });

  ipcMain.handle('db:getBalanceByType', async (_, type) => {
    try {
      return accountsRepository.getBalanceByType(type);
    } catch (error) {
      throw new Error(`Failed to get balance by type: ${error}`);
    }
  });

  ipcMain.handle('db:createMissingUnassignedEnvelopes', async () => {
    try {
      return accountsRepository.createMissingUnassignedEnvelopes();
    } catch (error) {
      throw new Error(`Failed to create missing unassigned envelopes: ${error}`);
    }
  });

  // Envelope IPC handlers
  ipcMain.handle('envelope:create', async (_, envelopeData) => {
    try {
      return envelopeRepository.createEnvelope(envelopeData);
    } catch (error) {
      throw new Error(`Failed to create envelope: ${error}`);
    }
  });

  ipcMain.handle('envelope:getById', async (_, id) => {
    try {
      return envelopeRepository.getEnvelopeById(id);
    } catch (error) {
      throw new Error(`Failed to get envelope by ID: ${error}`);
    }
  });

  ipcMain.handle('envelope:getAll', async () => {
    try {
      return envelopeRepository.getAllEnvelopes();
    } catch (error) {
      throw new Error(`Failed to get all envelopes: ${error}`);
    }
  });

  ipcMain.handle('envelope:getByAccountId', async (_, accountId) => {
    try {
      return envelopeRepository.getEnvelopesByAccountId(accountId);
    } catch (error) {
      throw new Error(`Failed to get envelopes by account ID: ${error}`);
    }
  });

  ipcMain.handle('envelope:getByType', async (_, type) => {
    try {
      return envelopeRepository.getEnvelopesByType(type);
    } catch (error) {
      throw new Error(`Failed to get envelopes by type: ${error}`);
    }
  });

  ipcMain.handle('envelope:getWithAccount', async () => {
    try {
      return envelopeRepository.getEnvelopesWithAccount();
    } catch (error) {
      throw new Error(`Failed to get envelopes with account info: ${error}`);
    }
  });

  ipcMain.handle('envelope:update', async (_, id, updateData) => {
    try {
      return envelopeRepository.updateEnvelope(id, updateData);
    } catch (error) {
      throw new Error(`Failed to update envelope: ${error}`);
    }
  });

  ipcMain.handle('envelope:delete', async (_, id) => {
    try {
      return envelopeRepository.deleteEnvelope(id);
    } catch (error) {
      throw new Error(`Failed to delete envelope: ${error}`);
    }
  });

  ipcMain.handle('envelope:transfer', async (_, transferData) => {
    try {
      return envelopeRepository.transferBetweenEnvelopes(transferData);
    } catch (error) {
      throw new Error(`Failed to transfer between envelopes: ${error}`);
    }
  });

  ipcMain.handle('envelope:transferHistory', async (_, envelopeId) => {
    try {
      return envelopeRepository.getTransferHistory(envelopeId);
    } catch (error) {
      throw new Error(`Failed to get transfer history: ${error}`);
    }
  });

  ipcMain.handle('envelope:getAccountWithEnvelopes', async (_, accountId) => {
    try {
      return envelopeRepository.getAccountWithEnvelopes(accountId);
    } catch (error) {
      throw new Error(`Failed to get account with envelopes: ${error}`);
    }
  });

  ipcMain.handle('envelope:validateIntegrity', async () => {
    try {
      return envelopeRepository.validateAccountEnvelopeIntegrity();
    } catch (error) {
      throw new Error(`Failed to validate account-envelope integrity: ${error}`);
    }
  });

  // Transaction IPC handlers
  ipcMain.handle('transaction:create', async (_, transactionData) => {
    try {
      return transactionDatabase.createTransaction(transactionData);
    } catch (error) {
      throw new Error(`Failed to create transaction: ${error}`);
    }
  });

  ipcMain.handle('transaction:getById', async (_, id) => {
    try {
      return transactionDatabase.getTransactionById(id);
    } catch (error) {
      throw new Error(`Failed to get transaction by ID: ${error}`);
    }
  });

  ipcMain.handle('transaction:getWithDetailsById', async (_, id) => {
    try {
      return transactionDatabase.getTransactionWithDetailsById(id);
    } catch (error) {
      throw new Error(`Failed to get transaction with details by ID: ${error}`);
    }
  });

  ipcMain.handle('transaction:getAll', async () => {
    try {
      return transactionDatabase.getAllTransactions();
    } catch (error) {
      throw new Error(`Failed to get all transactions: ${error}`);
    }
  });

  ipcMain.handle('transaction:getByAccount', async (_, accountId) => {
    try {
      return transactionDatabase.getTransactionsByAccount(accountId);
    } catch (error) {
      throw new Error(`Failed to get transactions by account: ${error}`);
    }
  });

  ipcMain.handle('transaction:getByEnvelope', async (_, envelopeId) => {
    try {
      return transactionDatabase.getTransactionsByEnvelope(envelopeId);
    } catch (error) {
      throw new Error(`Failed to get transactions by envelope: ${error}`);
    }
  });

  ipcMain.handle('transaction:update', async (_, id, updateData) => {
    try {
      return transactionDatabase.updateTransaction(id, updateData);
    } catch (error) {
      throw new Error(`Failed to update transaction: ${error}`);
    }
  });

  ipcMain.handle('transaction:delete', async (_, id) => {
    try {
      return transactionDatabase.deleteTransaction(id);
    } catch (error) {
      throw new Error(`Failed to delete transaction: ${error}`);
    }
  });

  ipcMain.handle('transaction:createBulk', async (_, transactions) => {
    try {
      return transactionDatabase.createBulkTransactions(transactions);
    } catch (error) {
      throw new Error(`Failed to create bulk transactions: ${error}`);
    }
  });

  ipcMain.handle('transaction:search', async (_, searchTerm, limit) => {
    try {
      return transactionDatabase.searchTransactions(searchTerm, limit);
    } catch (error) {
      throw new Error(`Failed to search transactions: ${error}`);
    }
  });

  ipcMain.handle('transaction:getByStatus', async (_, status) => {
    try {
      return transactionDatabase.getTransactionsByStatus(status);
    } catch (error) {
      throw new Error(`Failed to get transactions by status: ${error}`);
    }
  });

  ipcMain.handle('transaction:getByDateRange', async (_, startDate, endDate) => {
    try {
      return transactionDatabase.getTransactionsByDateRange(startDate, endDate);
    } catch (error) {
      throw new Error(`Failed to get transactions by date range: ${error}`);
    }
  });

  // Enhanced Transaction Management IPC handlers
  ipcMain.handle('transaction:getWithFilters', async (_, filters) => {
    try {
      return transactionDatabase.getTransactionsWithFilters(filters);
    } catch (error) {
      throw new Error(`Failed to get transactions with filters: ${error}`);
    }
  });

  ipcMain.handle('transaction:updateSafe', async (_, id, updateData) => {
    try {
      return transactionDatabase.updateTransactionSafe(id, updateData);
    } catch (error) {
      throw new Error(`Failed to safely update transaction: ${error}`);
    }
  });

  ipcMain.handle('transaction:deleteSafe', async (_, id) => {
    try {
      return transactionDatabase.deleteTransactionSafe(id);
    } catch (error) {
      throw new Error(`Failed to safely delete transaction: ${error}`);
    }
  });

  ipcMain.handle('transaction:hasPaymentAllocations', async (_, transactionId) => {
    try {
      return transactionDatabase.hasPaymentAllocations(transactionId);
    } catch (error) {
      throw new Error(`Failed to check payment allocations: ${error}`);
    }
  });

  ipcMain.handle('transaction:getPaymentAllocationDetails', async (_, transactionId) => {
    try {
      return transactionDatabase.getPaymentAllocationDetails(transactionId);
    } catch (error) {
      throw new Error(`Failed to get payment allocation details: ${error}`);
    }
  });

  ipcMain.handle('transaction:isSplitTransaction', async (_, transactionId) => {
    try {
      return transactionDatabase.isSplitTransaction(transactionId);
    } catch (error) {
      throw new Error(`Failed to check if transaction is split: ${error}`);
    }
  });

  // Account Transfer IPC handlers
  ipcMain.handle('accountTransfer:create', async (_, transferData) => {
    try {
      return transactionDatabase.createAccountTransfer(transferData);
    } catch (error) {
      throw new Error(`Failed to create account transfer: ${error}`);
    }
  });

  ipcMain.handle('accountTransfer:getById', async (_, id) => {
    try {
      return transactionDatabase.getAccountTransferById(id);
    } catch (error) {
      throw new Error(`Failed to get account transfer by ID: ${error}`);
    }
  });

  ipcMain.handle('accountTransfer:getAll', async () => {
    try {
      return transactionDatabase.getAllAccountTransfers();
    } catch (error) {
      throw new Error(`Failed to get all account transfers: ${error}`);
    }
  });

  // Balance Calculation IPC handlers
  ipcMain.handle('balance:getAccountBalancesByStatus', async () => {
    try {
      return transactionDatabase.getAccountBalancesByStatus();
    } catch (error) {
      throw new Error(`Failed to get account balances by status: ${error}`);
    }
  });

  ipcMain.handle('balance:getAccountBalanceByStatusById', async (_, accountId) => {
    try {
      return transactionDatabase.getAccountBalanceByStatusById(accountId);
    } catch (error) {
      throw new Error(`Failed to get account balance by status by ID: ${error}`);
    }
  });

  ipcMain.handle('balance:getEnvelopeBalancesByStatus', async () => {
    try {
      return transactionDatabase.getEnvelopeBalancesByStatus();
    } catch (error) {
      throw new Error(`Failed to get envelope balances by status: ${error}`);
    }
  });

  ipcMain.handle('balance:getEnvelopeBalanceByStatusById', async (_, envelopeId) => {
    try {
      return transactionDatabase.getEnvelopeBalanceByStatusById(envelopeId);
    } catch (error) {
      throw new Error(`Failed to get envelope balance by status by ID: ${error}`);
    }
  });

  ipcMain.handle('balance:validateIntegrity', async () => {
    try {
      return transactionDatabase.validateBalanceIntegrity();
    } catch (error) {
      throw new Error(`Failed to validate balance integrity: ${error}`);
    }
  });

  // Credit Card Payment IPC handlers
  ipcMain.handle('creditCardPayment:create', async (_, paymentData) => {
    try {
      return creditCardPaymentDatabase.createCreditCardPayment(paymentData);
    } catch (error) {
      throw new Error(`Failed to create credit card payment: ${error}`);
    }
  });

  ipcMain.handle('creditCardPayment:getById', async (_, id) => {
    try {
      return creditCardPaymentDatabase.getCreditCardPaymentById(id);
    } catch (error) {
      throw new Error(`Failed to get credit card payment by ID: ${error}`);
    }
  });

  ipcMain.handle('creditCardPayment:getWithAllocationsById', async (_, id) => {
    try {
      return creditCardPaymentDatabase.getCreditCardPaymentWithAllocationsById(id);
    } catch (error) {
      throw new Error(`Failed to get credit card payment with allocations by ID: ${error}`);
    }
  });

  ipcMain.handle('creditCardPayment:getAll', async () => {
    try {
      return creditCardPaymentDatabase.getAllCreditCardPayments();
    } catch (error) {
      throw new Error(`Failed to get all credit card payments: ${error}`);
    }
  });

  ipcMain.handle('creditCardPayment:getByAccount', async (_, accountId) => {
    try {
      return creditCardPaymentDatabase.getCreditCardPaymentsByAccount(accountId);
    } catch (error) {
      throw new Error(`Failed to get credit card payments by account: ${error}`);
    }
  });

  ipcMain.handle('creditCardPayment:delete', async (_, id) => {
    try {
      return creditCardPaymentDatabase.deleteCreditCardPayment(id);
    } catch (error) {
      throw new Error(`Failed to delete credit card payment: ${error}`);
    }
  });

  // Debt Analysis IPC handlers
  ipcMain.handle('debt:getByEnvelopeCategory', async () => {
    try {
      return creditCardPaymentDatabase.getDebtByEnvelopeCategory();
    } catch (error) {
      throw new Error(`Failed to get debt by envelope category: ${error}`);
    }
  });

  ipcMain.handle('debt:getCashEnvelopeBalances', async () => {
    try {
      return creditCardPaymentDatabase.getCashEnvelopeBalances();
    } catch (error) {
      throw new Error(`Failed to get cash envelope balances: ${error}`);
    }
  });

  ipcMain.handle('debt:simulatePayment', async (_, creditCardAccountId, allocations) => {
    try {
      return creditCardPaymentDatabase.simulatePayment(creditCardAccountId, allocations);
    } catch (error) {
      throw new Error(`Failed to simulate payment: ${error}`);
    }
  });

  ipcMain.handle('debt:suggestPaymentAllocation', async (_, creditCardAccountId, targetAmount) => {
    try {
      return creditCardPaymentDatabase.suggestPaymentAllocation(creditCardAccountId, targetAmount);
    } catch (error) {
      throw new Error(`Failed to suggest payment allocation: ${error}`);
    }
  });

  ipcMain.handle('debt:getUnpaidTransactionsByCreditCard', async (_, creditCardAccountId) => {
    try {
      return creditCardPaymentDatabase.getUnpaidTransactionsByCreditCard(creditCardAccountId);
    } catch (error) {
      throw new Error(`Failed to get unpaid transactions by credit card: ${error}`);
    }
  });

  // Compensation Creator IPC handlers
  ipcMain.handle('compensation:createFundingTarget', async (_, targetData) => {
    try {
      return compensationCreatorDatabase.createFundingTarget(targetData);
    } catch (error) {
      throw new Error(`Failed to create funding target: ${error}`);
    }
  });

  ipcMain.handle('compensation:getFundingTargetById', async (_, id) => {
    try {
      return compensationCreatorDatabase.getFundingTargetById(id);
    } catch (error) {
      throw new Error(`Failed to get funding target by ID: ${error}`);
    }
  });

  ipcMain.handle('compensation:getAllFundingTargets', async () => {
    try {
      return compensationCreatorDatabase.getAllFundingTargets();
    } catch (error) {
      throw new Error(`Failed to get all funding targets: ${error}`);
    }
  });

  ipcMain.handle('compensation:getActiveFundingTargets', async () => {
    try {
      return compensationCreatorDatabase.getActiveFundingTargets();
    } catch (error) {
      throw new Error(`Failed to get active funding targets: ${error}`);
    }
  });

  ipcMain.handle('compensation:getFundingTargetsByEnvelopeId', async (_, envelopeId) => {
    try {
      return compensationCreatorDatabase.getFundingTargetsByEnvelopeId(envelopeId);
    } catch (error) {
      throw new Error(`Failed to get funding targets by envelope ID: ${error}`);
    }
  });

  ipcMain.handle('compensation:getFundingTargetsWithEnvelopeInfo', async () => {
    try {
      return compensationCreatorDatabase.getFundingTargetsWithEnvelopeInfo();
    } catch (error) {
      throw new Error(`Failed to get funding targets with envelope info: ${error}`);
    }
  });

  ipcMain.handle('compensation:updateFundingTarget', async (_, id, updateData) => {
    try {
      return compensationCreatorDatabase.updateFundingTarget(id, updateData);
    } catch (error) {
      throw new Error(`Failed to update funding target: ${error}`);
    }
  });

  ipcMain.handle('compensation:deleteFundingTarget', async (_, id) => {
    try {
      return compensationCreatorDatabase.deleteFundingTarget(id);
    } catch (error) {
      throw new Error(`Failed to delete funding target: ${error}`);
    }
  });

  ipcMain.handle('compensation:getCurrentDebtByEnvelope', async () => {
    try {
      return compensationCreatorDatabase.getCurrentDebtByEnvelope();
    } catch (error) {
      throw new Error(`Failed to get current debt by envelope: ${error}`);
    }
  });

  ipcMain.handle('compensation:calculateCompensation', async (_, paycheckDate, customAmount) => {
    try {
      return compensationCreatorDatabase.calculateCompensation(paycheckDate, customAmount);
    } catch (error) {
      throw new Error(`Failed to calculate compensation: ${error}`);
    }
  });

  ipcMain.handle('compensation:getNextPaycheckDate', async () => {
    try {
      return compensationCreatorDatabase.getNextPaycheckDate();
    } catch (error) {
      throw new Error(`Failed to get next paycheck date: ${error}`);
    }
  });

  ipcMain.handle('compensation:suggestFundingTargets', async () => {
    try {
      return compensationCreatorDatabase.suggestFundingTargets();
    } catch (error) {
      throw new Error(`Failed to suggest funding targets: ${error}`);
    }
  });
}

app.on('ready', () => {
  // Set up IPC handlers
  setupIpcHandlers();
  
  // Initialize enhanced profile system with duplicate cleanup
  try {
    console.log('🔧 Initializing enhanced profile system...');
    
    // First, clean up any duplicate profiles
    const cleaned = cleanupDuplicateProfiles();
    if (cleaned) {
      console.log('🧹 Cleaned up duplicate profiles');
    }
    
    // Check for existing database migration
    const migrated = migrateExistingDatabase();
    if (migrated) {
      console.log('🔄 Migrated existing database to profile system');
      // Switch to the migrated "Main" profile using the actual profile name
      const migratedProfile = getAllProfiles().find(p => p.displayName === 'Main');
      if (migratedProfile) {
        switchToProfile(migratedProfile.name);
        console.log(`✅ Switched to migrated profile: ${migratedProfile.displayName}`);
      }
    } else {
      // Check if we have any profiles
      const profiles = getAllProfiles();
      console.log(`📋 Found ${profiles.length} existing profiles`);
      
      if (profiles.length === 0) {
        // No profiles exist - create a default one
        console.log('📝 No profiles found, creating default profile...');
        try {
          const defaultProfile = createProfile({
            name: 'Main',
            displayName: 'Main',
            description: 'Default profile'
          });
          switchToProfile(defaultProfile.name);
          console.log('✅ Created and switched to default Main profile');
        } catch (createError) {
          console.error('Failed to create default profile:', createError);
          // If Main already exists somehow, just switch to it
          const existingMain = profiles.find(p => p.displayName === 'Main' || p.name.toLowerCase().includes('main'));
          if (existingMain) {
            switchToProfile(existingMain.name);
            console.log(`✅ Switched to existing profile: ${existingMain.displayName}`);
          }
        }
      } else {
        // We have profiles - use the last used one or first available
        const lastUsed = getLastUsedProfile();
        if (lastUsed && profiles.find(p => p.name === lastUsed)) {
          // Only switch if the last used profile still exists
          switchToProfile(lastUsed);
          console.log(`✅ Switched to last used profile: ${lastUsed}`);
        } else {
          // Switch to first available profile (preferably one without password)
          const accessibleProfile = profiles.find(p => !p.hasPassword) || profiles[0];
          switchToProfile(accessibleProfile.name);
          console.log(`✅ Switched to profile: ${accessibleProfile.displayName}`);
        }
      }
    }
  } catch (error) {
    console.error('Profile initialization failed:', error);
    console.log('🚨 Attempting emergency profile creation...');
    
    // Try to get existing profiles first
    try {
      const existingProfiles = getAllProfiles();
      if (existingProfiles.length > 0) {
        // Find a profile without password or use first one
        const accessibleProfile = existingProfiles.find(p => !p.hasPassword) || existingProfiles[0];
        switchToProfile(accessibleProfile.name);
        console.log(`🔄 Switched to accessible profile: ${accessibleProfile.displayName}`);
      } else {
        // Create emergency profile with unique name
        const emergencyName = `Emergency_${Date.now()}`;
        const emergencyProfile = createProfile({
          name: emergencyName,
          displayName: 'Emergency',
          description: 'Emergency default profile'
        });
        switchToProfile(emergencyProfile.name);
        console.log('🚨 Created emergency profile');
      }
    } catch (emergencyError) {
      console.error('Emergency profile handling failed:', emergencyError);
      console.log('⚠️ Application will run without profiles - some features may not work');
    }
  }
  
  // Initialize app
  console.log('🚀 Starting Personal Finance App...');
  console.log('👥 Enhanced profile system ready - password protection supported');
  
  // Log current profile status
  try {
    const currentProfile = getCurrentProfile();
    const allProfiles = getAllProfiles();
    console.log(`📊 Current profile: ${currentProfile || 'None'}`);
    console.log(`📁 Total profiles: ${allProfiles.length}`);
    if (allProfiles.length > 0) {
      console.log('📋 Available profiles:', allProfiles.map(p => `${p.displayName}${p.hasPassword ? ' 🔒' : ''}`).join(', '));
    }
  } catch (statusError) {
    console.log('⚠️ Could not retrieve profile status:', statusError);
  }
  
  createWindow();
});

app.on('window-all-closed', () => {
  closeDatabase();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});