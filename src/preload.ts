import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  database: {
    createAccount: (accountData: any) => ipcRenderer.invoke('db:createAccount', accountData),
    getAllAccounts: () => ipcRenderer.invoke('db:getAllAccounts'),
    getAccountById: (id: number) => ipcRenderer.invoke('db:getAccountById', id),
    getAccountsByType: (type: string) => ipcRenderer.invoke('db:getAccountsByType', type),
    updateAccount: (updateData: any) => ipcRenderer.invoke('db:updateAccount', updateData),
    deleteAccount: (id: number) => ipcRenderer.invoke('db:deleteAccount', id),
    getTotalBalance: () => ipcRenderer.invoke('db:getTotalBalance'),
    getBalanceByType: (type: string) => ipcRenderer.invoke('db:getBalanceByType', type)
  }
});