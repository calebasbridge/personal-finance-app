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
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}