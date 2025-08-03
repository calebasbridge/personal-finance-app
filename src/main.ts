import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { runDatabaseTest } from './database/test';
import { closeDatabase, accountsRepository, envelopeRepository, TransactionDatabase, CreditCardPaymentDatabase, compensationCreatorDatabase } from './database';

// Initialize transaction databases
const transactionDb = new TransactionDatabase();
const creditCardPaymentDb = new CreditCardPaymentDatabase();

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
  
  if (isDev) {
    // Load the built files instead of trying to connect to dev server
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null as any;
  });
}

// Set up IPC handlers for database operations
function setupIpcHandlers(): void {
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
      return transactionDb.createTransaction(transactionData);
    } catch (error) {
      throw new Error(`Failed to create transaction: ${error}`);
    }
  });

  ipcMain.handle('transaction:getById', async (_, id) => {
    try {
      return transactionDb.getTransactionById(id);
    } catch (error) {
      throw new Error(`Failed to get transaction by ID: ${error}`);
    }
  });

  ipcMain.handle('transaction:getWithDetailsById', async (_, id) => {
    try {
      return transactionDb.getTransactionWithDetailsById(id);
    } catch (error) {
      throw new Error(`Failed to get transaction with details by ID: ${error}`);
    }
  });

  ipcMain.handle('transaction:getAll', async () => {
    try {
      return transactionDb.getAllTransactions();
    } catch (error) {
      throw new Error(`Failed to get all transactions: ${error}`);
    }
  });

  ipcMain.handle('transaction:getByAccount', async (_, accountId) => {
    try {
      return transactionDb.getTransactionsByAccount(accountId);
    } catch (error) {
      throw new Error(`Failed to get transactions by account: ${error}`);
    }
  });

  ipcMain.handle('transaction:getByEnvelope', async (_, envelopeId) => {
    try {
      return transactionDb.getTransactionsByEnvelope(envelopeId);
    } catch (error) {
      throw new Error(`Failed to get transactions by envelope: ${error}`);
    }
  });

  ipcMain.handle('transaction:update', async (_, id, updateData) => {
    try {
      return transactionDb.updateTransaction(id, updateData);
    } catch (error) {
      throw new Error(`Failed to update transaction: ${error}`);
    }
  });

  ipcMain.handle('transaction:delete', async (_, id) => {
    try {
      return transactionDb.deleteTransaction(id);
    } catch (error) {
      throw new Error(`Failed to delete transaction: ${error}`);
    }
  });

  ipcMain.handle('transaction:createBulk', async (_, transactions) => {
    try {
      return transactionDb.createBulkTransactions(transactions);
    } catch (error) {
      throw new Error(`Failed to create bulk transactions: ${error}`);
    }
  });

  ipcMain.handle('transaction:search', async (_, searchTerm, limit) => {
    try {
      return transactionDb.searchTransactions(searchTerm, limit);
    } catch (error) {
      throw new Error(`Failed to search transactions: ${error}`);
    }
  });

  ipcMain.handle('transaction:getByStatus', async (_, status) => {
    try {
      return transactionDb.getTransactionsByStatus(status);
    } catch (error) {
      throw new Error(`Failed to get transactions by status: ${error}`);
    }
  });

  ipcMain.handle('transaction:getByDateRange', async (_, startDate, endDate) => {
    try {
      return transactionDb.getTransactionsByDateRange(startDate, endDate);
    } catch (error) {
      throw new Error(`Failed to get transactions by date range: ${error}`);
    }
  });

  // Account Transfer IPC handlers
  ipcMain.handle('accountTransfer:create', async (_, transferData) => {
    try {
      return transactionDb.createAccountTransfer(transferData);
    } catch (error) {
      throw new Error(`Failed to create account transfer: ${error}`);
    }
  });

  ipcMain.handle('accountTransfer:getById', async (_, id) => {
    try {
      return transactionDb.getAccountTransferById(id);
    } catch (error) {
      throw new Error(`Failed to get account transfer by ID: ${error}`);
    }
  });

  ipcMain.handle('accountTransfer:getAll', async () => {
    try {
      return transactionDb.getAllAccountTransfers();
    } catch (error) {
      throw new Error(`Failed to get all account transfers: ${error}`);
    }
  });

  // Balance Calculation IPC handlers
  ipcMain.handle('balance:getAccountBalancesByStatus', async () => {
    try {
      return transactionDb.getAccountBalancesByStatus();
    } catch (error) {
      throw new Error(`Failed to get account balances by status: ${error}`);
    }
  });

  ipcMain.handle('balance:getAccountBalanceByStatusById', async (_, accountId) => {
    try {
      return transactionDb.getAccountBalanceByStatusById(accountId);
    } catch (error) {
      throw new Error(`Failed to get account balance by status by ID: ${error}`);
    }
  });

  ipcMain.handle('balance:getEnvelopeBalancesByStatus', async () => {
    try {
      return transactionDb.getEnvelopeBalancesByStatus();
    } catch (error) {
      throw new Error(`Failed to get envelope balances by status: ${error}`);
    }
  });

  ipcMain.handle('balance:getEnvelopeBalanceByStatusById', async (_, envelopeId) => {
    try {
      return transactionDb.getEnvelopeBalanceByStatusById(envelopeId);
    } catch (error) {
      throw new Error(`Failed to get envelope balance by status by ID: ${error}`);
    }
  });

  ipcMain.handle('balance:validateIntegrity', async () => {
    try {
      return transactionDb.validateBalanceIntegrity();
    } catch (error) {
      throw new Error(`Failed to validate balance integrity: ${error}`);
    }
  });

  // Credit Card Payment IPC handlers
  ipcMain.handle('creditCardPayment:create', async (_, paymentData) => {
    try {
      return creditCardPaymentDb.createCreditCardPayment(paymentData);
    } catch (error) {
      throw new Error(`Failed to create credit card payment: ${error}`);
    }
  });

  ipcMain.handle('creditCardPayment:getById', async (_, id) => {
    try {
      return creditCardPaymentDb.getCreditCardPaymentById(id);
    } catch (error) {
      throw new Error(`Failed to get credit card payment by ID: ${error}`);
    }
  });

  ipcMain.handle('creditCardPayment:getWithAllocationsById', async (_, id) => {
    try {
      return creditCardPaymentDb.getCreditCardPaymentWithAllocationsById(id);
    } catch (error) {
      throw new Error(`Failed to get credit card payment with allocations by ID: ${error}`);
    }
  });

  ipcMain.handle('creditCardPayment:getAll', async () => {
    try {
      return creditCardPaymentDb.getAllCreditCardPayments();
    } catch (error) {
      throw new Error(`Failed to get all credit card payments: ${error}`);
    }
  });

  ipcMain.handle('creditCardPayment:getByAccount', async (_, accountId) => {
    try {
      return creditCardPaymentDb.getCreditCardPaymentsByAccount(accountId);
    } catch (error) {
      throw new Error(`Failed to get credit card payments by account: ${error}`);
    }
  });

  ipcMain.handle('creditCardPayment:delete', async (_, id) => {
    try {
      return creditCardPaymentDb.deleteCreditCardPayment(id);
    } catch (error) {
      throw new Error(`Failed to delete credit card payment: ${error}`);
    }
  });

  // Debt Analysis IPC handlers
  ipcMain.handle('debt:getByEnvelopeCategory', async () => {
    try {
      return creditCardPaymentDb.getDebtByEnvelopeCategory();
    } catch (error) {
      throw new Error(`Failed to get debt by envelope category: ${error}`);
    }
  });

  ipcMain.handle('debt:getCashEnvelopeBalances', async () => {
    try {
      return creditCardPaymentDb.getCashEnvelopeBalances();
    } catch (error) {
      throw new Error(`Failed to get cash envelope balances: ${error}`);
    }
  });

  ipcMain.handle('debt:simulatePayment', async (_, creditCardAccountId, allocations) => {
    try {
      return creditCardPaymentDb.simulatePayment(creditCardAccountId, allocations);
    } catch (error) {
      throw new Error(`Failed to simulate payment: ${error}`);
    }
  });

  ipcMain.handle('debt:suggestPaymentAllocation', async (_, creditCardAccountId, targetAmount) => {
    try {
      return creditCardPaymentDb.suggestPaymentAllocation(creditCardAccountId, targetAmount);
    } catch (error) {
      throw new Error(`Failed to suggest payment allocation: ${error}`);
    }
  });

  ipcMain.handle('debt:getUnpaidTransactionsByCreditCard', async (_, creditCardAccountId) => {
    try {
      return creditCardPaymentDb.getUnpaidTransactionsByCreditCard(creditCardAccountId);
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
  
  // Run database test first
  console.log('🚀 Initializing Personal Finance App...');
  try {
    runDatabaseTest();
  } catch (error) {
    console.error('Database initialization failed:', error);
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