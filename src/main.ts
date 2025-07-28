import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { runDatabaseTest } from './database/test';
import { closeDatabase, accountsRepository } from './database';

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