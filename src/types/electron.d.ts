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
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}