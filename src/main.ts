import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { runDatabaseTest } from './database/test';
import { closeDatabase, accountsRepository, envelopeRepository } from './database';

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