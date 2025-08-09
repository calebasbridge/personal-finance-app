/// <reference types="electron" />
// Enhanced TypeScript definitions for Electron API

interface DatabaseAPI {
  createAccount: (accountData: any) => Promise<any>;
  getAllAccounts: () => Promise<any[]>;
  getAccountById: (id: number) => Promise<any>;
  getAccountsByType: (type: string) => Promise<any[]>;
  updateAccount: (updateData: any) => Promise<any>;
  deleteAccount: (id: number) => Promise<boolean>;
  getTotalBalance: () => Promise<number>;
  getBalanceByType: (type: string) => Promise<number>;
}

interface AccountsAPI {
  create: (accountData: any) => Promise<any>;
  getAll: () => Promise<any[]>;
  getById: (id: number) => Promise<any>;
  getByType: (type: string) => Promise<any[]>;
  update: (id: number, updateData: any) => Promise<any>;
  delete: (id: number) => Promise<boolean>;
  createMissingUnassignedEnvelopes: () => Promise<{ created: number; errors: string[] }>;
}

interface EnvelopesAPI {
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
}

interface TransactionsAPI {
  create: (transactionData: any) => Promise<any>;
  getAll: () => Promise<any[]>;
  getById: (id: number) => Promise<any>;
  getWithDetailsById: (id: number) => Promise<any>;
  getByAccount: (accountId: number) => Promise<any[]>;
  getByEnvelope: (envelopeId: number) => Promise<any[]>;
  update: (id: number, updateData: any) => Promise<any>;
  delete: (id: number) => Promise<boolean>;
  createBulk: (transactions: any[]) => Promise<any[]>;
  search: (searchTerm: string, limit?: number) => Promise<any[]>;
  getByStatus: (status: string) => Promise<any[]>;
  getByDateRange: (startDate: string, endDate: string) => Promise<any[]>;
  // Enhanced Transaction Management
  getWithFilters: (filters: {
    accountId?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
    searchTerm?: string;
    limit?: number;
    offset?: number;
  }) => Promise<{ transactions: any[]; totalCount: number }>;
  updateSafe: (id: number, updateData: any) => Promise<{
    success: boolean;
    transaction?: any;
    warnings: string[];
    error?: string;
  }>;
  deleteSafe: (id: number) => Promise<{
    success: boolean;
    warnings: string[];
    error?: string;
  }>;
  hasPaymentAllocations: (transactionId: number) => Promise<boolean>;
  getPaymentAllocationDetails: (transactionId: number) => Promise<any[]>;
  isSplitTransaction: (transactionId: number) => Promise<{
    isSplit: boolean;
    originalAmount?: number;
    originalDate?: string;
  }>;
}

interface AccountTransfersAPI {
  create: (transferData: any) => Promise<any>;
  getAll: () => Promise<any[]>;
  getById: (id: number) => Promise<any>;
}

interface BalancesAPI {
  getAccountBalancesByStatus: () => Promise<any[]>;
  getAccountBalanceByStatusById: (accountId: number) => Promise<any>;
  getEnvelopeBalancesByStatus: () => Promise<any[]>;
  getEnvelopeBalanceByStatusById: (envelopeId: number) => Promise<any>;
  validateIntegrity: () => Promise<{ valid: boolean; discrepancies: any[] }>;
}

interface CreditCardPaymentsAPI {
  create: (paymentData: any) => Promise<any>;
  getAll: () => Promise<any[]>;
  getById: (id: number) => Promise<any>;
  getWithAllocationsById: (id: number) => Promise<any>;
  getByAccount: (accountId: number) => Promise<any[]>;
  delete: (id: number) => Promise<boolean>;
}

interface DebtAPI {
  getByEnvelopeCategory: () => Promise<any[]>;
  getCashEnvelopeBalances: () => Promise<any[]>;
  simulatePayment: (creditCardAccountId: number, allocations: any[]) => Promise<any>;
  suggestPaymentAllocation: (creditCardAccountId: number, targetAmount: number) => Promise<any>;
  getUnpaidTransactionsByCreditCard: (creditCardAccountId: number) => Promise<Array<{
    transaction_id: number;
    envelope_id: number;
    envelope_name: string;
    amount: number;
    date: string;
    description: string;
    status: 'unpaid';
  }>>;
}

interface CompensationAPI {
  // Funding Target CRUD
  createFundingTarget: (targetData: any) => Promise<any>;
  getFundingTargetById: (id: number) => Promise<any>;
  getAllFundingTargets: () => Promise<any[]>;
  getActiveFundingTargets: () => Promise<any[]>;
  getFundingTargetsByEnvelopeId: (envelopeId: number) => Promise<any[]>;
  getFundingTargetsWithEnvelopeInfo: () => Promise<any[]>;
  updateFundingTarget: (id: number, updateData: any) => Promise<any>;
  deleteFundingTarget: (id: number) => Promise<boolean>;
  // Compensation Calculation
  getCurrentDebtByEnvelope: () => Promise<Array<{
    envelope_id: number;
    envelope_name: string;
    debt_amount: number;
  }>>;
  calculateCompensation: (paycheckDate: string, customAmount?: number) => Promise<{
    paycheck_date: string;
    total_payment: number;
    w2_amount: number;
    dividend_amount: number;
    debt_by_envelope: Array<{
      envelope_id: number;
      envelope_name: string;
      debt_amount: number;
    }>;
    funding_targets: Array<{
      envelope_id: number;
      envelope_name: string;
      target_type: 'monthly_minimum' | 'per_paycheck' | 'monthly_stipend';
      target_amount: number;
      current_balance: number;
      shortfall: number;
    }>;
    total_debt: number;
    total_shortfall: number;
    recommended_payment: number;
  }>;
  getNextPaycheckDate: () => Promise<string>;
  suggestFundingTargets: () => Promise<Array<{
    envelope_id: number;
    envelope_name: string;
    suggested_amount: number;
    reasoning: string;
  }>>;
}

interface Profile {
  name: string;
  displayName: string;
  created: string;
  lastUsed: string;
  hasPassword: boolean;
  description?: string;
  isActive?: boolean;
}

interface ProfileAPI {
  create: (name: string, description?: string, password?: string) => Promise<{ success: boolean; profileName: string }>;
  delete: (name: string) => Promise<{ success: boolean }>;
  switchTo: (name: string, password?: string) => Promise<{ success: boolean; profileName: string }>;
  getCurrentProfile: () => Promise<{ profileName: string | null }>;
  listProfiles: () => Promise<{ profiles: Profile[] }>;
  migrateExistingDatabase: () => Promise<{ 
    success: boolean; 
    migrated: boolean; 
    profileName?: string 
  }>;
  exists: (name: string) => Promise<boolean>;
  getLastUsed: () => Promise<string | null>;
  changePassword: (profileName: string, oldPassword: string, newPassword: string) => Promise<{ success: boolean }>;
  removePassword: (profileName: string, currentPassword: string) => Promise<{ success: boolean }>;
  addPassword: (profileName: string, newPassword: string) => Promise<{ success: boolean }>;
  verifyPassword: (profileName: string, password: string) => Promise<{ valid: boolean }>;
  cleanupDuplicates: () => Promise<{ success: boolean; cleaned: boolean }>;
}

export interface ElectronAPI {
  database: DatabaseAPI;
  accounts: AccountsAPI;
  envelopes: EnvelopesAPI;
  transactions: TransactionsAPI;
  accountTransfers: AccountTransfersAPI;
  balances: BalancesAPI;
  creditCardPayments: CreditCardPaymentsAPI;
  debt: DebtAPI;
  compensation: CompensationAPI;
  profile: ProfileAPI;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
