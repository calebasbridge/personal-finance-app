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
  },
  // Transaction operations
  transactions: {
    create: (transactionData: any) => ipcRenderer.invoke('transaction:create', transactionData),
    getAll: () => ipcRenderer.invoke('transaction:getAll'),
    getById: (id: number) => ipcRenderer.invoke('transaction:getById', id),
    getWithDetailsById: (id: number) => ipcRenderer.invoke('transaction:getWithDetailsById', id),
    getByAccount: (accountId: number) => ipcRenderer.invoke('transaction:getByAccount', accountId),
    getByEnvelope: (envelopeId: number) => ipcRenderer.invoke('transaction:getByEnvelope', envelopeId),
    update: (id: number, updateData: any) => ipcRenderer.invoke('transaction:update', id, updateData),
    delete: (id: number) => ipcRenderer.invoke('transaction:delete', id),
    createBulk: (transactions: any[]) => ipcRenderer.invoke('transaction:createBulk', transactions),
    search: (searchTerm: string, limit?: number) => ipcRenderer.invoke('transaction:search', searchTerm, limit),
    getByStatus: (status: string) => ipcRenderer.invoke('transaction:getByStatus', status),
    getByDateRange: (startDate: string, endDate: string) => ipcRenderer.invoke('transaction:getByDateRange', startDate, endDate)
  },
  // Account Transfer operations
  accountTransfers: {
    create: (transferData: any) => ipcRenderer.invoke('accountTransfer:create', transferData),
    getAll: () => ipcRenderer.invoke('accountTransfer:getAll'),
    getById: (id: number) => ipcRenderer.invoke('accountTransfer:getById', id)
  },
  // Balance operations
  balances: {
    getAccountBalancesByStatus: () => ipcRenderer.invoke('balance:getAccountBalancesByStatus'),
    getAccountBalanceByStatusById: (accountId: number) => ipcRenderer.invoke('balance:getAccountBalanceByStatusById', accountId),
    getEnvelopeBalancesByStatus: () => ipcRenderer.invoke('balance:getEnvelopeBalancesByStatus'),
    getEnvelopeBalanceByStatusById: (envelopeId: number) => ipcRenderer.invoke('balance:getEnvelopeBalanceByStatusById', envelopeId),
    validateIntegrity: () => ipcRenderer.invoke('balance:validateIntegrity')
  },
  // Credit Card Payment operations
  creditCardPayments: {
    create: (paymentData: any) => ipcRenderer.invoke('creditCardPayment:create', paymentData),
    getAll: () => ipcRenderer.invoke('creditCardPayment:getAll'),
    getById: (id: number) => ipcRenderer.invoke('creditCardPayment:getById', id),
    getWithAllocationsById: (id: number) => ipcRenderer.invoke('creditCardPayment:getWithAllocationsById', id),
    getByAccount: (accountId: number) => ipcRenderer.invoke('creditCardPayment:getByAccount', accountId),
    delete: (id: number) => ipcRenderer.invoke('creditCardPayment:delete', id)
  },
  // Debt Analysis operations
  debt: {
    getByEnvelopeCategory: () => ipcRenderer.invoke('debt:getByEnvelopeCategory'),
    getCashEnvelopeBalances: () => ipcRenderer.invoke('debt:getCashEnvelopeBalances'),
    simulatePayment: (creditCardAccountId: number, allocations: any[]) => ipcRenderer.invoke('debt:simulatePayment', creditCardAccountId, allocations),
    suggestPaymentAllocation: (creditCardAccountId: number, targetAmount: number) => ipcRenderer.invoke('debt:suggestPaymentAllocation', creditCardAccountId, targetAmount),
    getUnpaidTransactionsByCreditCard: (creditCardAccountId: number) => ipcRenderer.invoke('debt:getUnpaidTransactionsByCreditCard', creditCardAccountId)
  },
  // Compensation Creator operations
  compensation: {
    // Funding Target CRUD
    createFundingTarget: (targetData: any) => ipcRenderer.invoke('compensation:createFundingTarget', targetData),
    getFundingTargetById: (id: number) => ipcRenderer.invoke('compensation:getFundingTargetById', id),
    getAllFundingTargets: () => ipcRenderer.invoke('compensation:getAllFundingTargets'),
    getActiveFundingTargets: () => ipcRenderer.invoke('compensation:getActiveFundingTargets'),
    getFundingTargetsByEnvelopeId: (envelopeId: number) => ipcRenderer.invoke('compensation:getFundingTargetsByEnvelopeId', envelopeId),
    getFundingTargetsWithEnvelopeInfo: () => ipcRenderer.invoke('compensation:getFundingTargetsWithEnvelopeInfo'),
    updateFundingTarget: (id: number, updateData: any) => ipcRenderer.invoke('compensation:updateFundingTarget', id, updateData),
    deleteFundingTarget: (id: number) => ipcRenderer.invoke('compensation:deleteFundingTarget', id),
    // Compensation Calculation
    getCurrentDebtByEnvelope: () => ipcRenderer.invoke('compensation:getCurrentDebtByEnvelope'),
    calculateCompensation: (paycheckDate: string, customAmount?: number) => ipcRenderer.invoke('compensation:calculateCompensation', paycheckDate, customAmount),
    getNextPaycheckDate: () => ipcRenderer.invoke('compensation:getNextPaycheckDate'),
    suggestFundingTargets: () => ipcRenderer.invoke('compensation:suggestFundingTargets')
  }
});