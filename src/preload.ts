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
  },
  // Accounts operations (cleaner API as documented in prompt)
  accounts: {
    create: (accountData: any) => ipcRenderer.invoke('db:createAccount', accountData),
    getAll: () => ipcRenderer.invoke('db:getAllAccounts'),
    getById: (id: number) => ipcRenderer.invoke('db:getAccountById', id),
    getByType: (type: string) => ipcRenderer.invoke('db:getAccountsByType', type),
    update: (id: number, updateData: any) => ipcRenderer.invoke('db:updateAccount', { id, ...updateData }),
    delete: (id: number) => ipcRenderer.invoke('db:deleteAccount', id),
    createMissingUnassignedEnvelopes: () => ipcRenderer.invoke('db:createMissingUnassignedEnvelopes')
  },
  // Envelope operations
  envelopes: {
    create: (envelopeData: any) => ipcRenderer.invoke('envelope:create', envelopeData),
    getAll: () => ipcRenderer.invoke('envelope:getAll'),
    getById: (id: number) => ipcRenderer.invoke('envelope:getById', id),
    getByAccountId: (accountId: number) => ipcRenderer.invoke('envelope:getByAccountId', accountId),
    getByType: (type: 'cash' | 'debt') => ipcRenderer.invoke('envelope:getByType', type),
    getWithAccount: () => ipcRenderer.invoke('envelope:getWithAccount'),
    update: (id: number, updateData: any) => ipcRenderer.invoke('envelope:update', id, updateData),
    delete: (id: number) => ipcRenderer.invoke('envelope:delete', id),
    transfer: (transferData: any) => ipcRenderer.invoke('envelope:transfer', transferData),
    getTransferHistory: (envelopeId?: number) => ipcRenderer.invoke('envelope:transferHistory', envelopeId),
    getAccountWithEnvelopes: (accountId: number) => ipcRenderer.invoke('envelope:getAccountWithEnvelopes', accountId),
    validateIntegrity: () => ipcRenderer.invoke('envelope:validateIntegrity')
  }
});