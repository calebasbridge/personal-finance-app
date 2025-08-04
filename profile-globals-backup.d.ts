// Global type definitions for the Profile system
declare global {
  interface Window {
    electronAPI: {
      database: any;
      accounts: any;
      envelopes: any;
      transactions: any;
      accountTransfers: any;
      balances: any;
      creditCardPayments: any;
      debt: any;
      compensation: any;
      profile: {
        create: (name: string, description?: string) => Promise<{ success: boolean; profileName: string }>;
        delete: (name: string) => Promise<{ success: boolean }>;
        switchTo: (name: string) => Promise<{ success: boolean; profileName: string }>;
        getCurrentProfile: () => Promise<{ profileName: string }>;
        listProfiles: () => Promise<{ profiles: Array<{
          name: string;
          description?: string;
          isActive: boolean;
          createdAt: string;
        }> }>;
        migrateExistingDatabase: () => Promise<{ 
          success: boolean; 
          migrated: boolean; 
          profileName?: string 
        }>;
      };
    };
  }
}

export {};