export interface ElectronAPI {
  database: {
    createAccount: (accountData: any) => Promise<any>;
    getAllAccounts: () => Promise<any[]>;
    getAccountById: (id: number) => Promise<any>;
    getAccountsByType: (type: string) => Promise<any[]>;
    updateAccount: (updateData: any) => Promise<any>;
    deleteAccount: (id: number) => Promise<boolean>;
    getTotalBalance: () => Promise<number>;
    getBalanceByType: (type: string) => Promise<number>;
  };
  accounts: {
    create: (accountData: any) => Promise<any>;
    getAll: () => Promise<any[]>;
    getById: (id: number) => Promise<any>;
    getByType: (type: string) => Promise<any[]>;
    update: (id: number, updateData: any) => Promise<any>;
    delete: (id: number) => Promise<boolean>;
    createMissingUnassignedEnvelopes: () => Promise<{ created: number; errors: string[] }>;
  };
  envelopes: {
    create: (envelopeData: any) => Promise<any>;
    getAll: () => Promise<any[]>;
    getById: (id: number) => Promise<any>;
    getByAccountId: (accountId: number) => Promise<any[]>;
    getByType: (type: 'cash' | 'debt') => Promise<any[]>;
    getWithAccount: () => Promise<any[]>;
    update: (id: number, updateData: any) => Promise<any>;
    delete: (id: number) => Promise<boolean>;
    transfer: (transferData: any) => Promise<any>;
    getTransferHistory: (envelopeId?: number) => Promise<any[]>;
    getAccountWithEnvelopes: (accountId: number) => Promise<any>;
    validateIntegrity: () => Promise<any[]>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}