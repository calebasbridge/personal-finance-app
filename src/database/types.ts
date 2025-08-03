export type AccountType = 'checking' | 'savings' | 'credit_card' | 'cash';

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  initial_balance: number;
  current_balance: number;
  created_at: string;
  updated_at: string;
}

export interface NewAccount {
  name: string;
  type: AccountType;
  initial_balance: number;
  current_balance?: number;
}

export interface UpdateAccount {
  id: number;
  name?: string;
  type?: AccountType;
  initial_balance?: number;
  current_balance?: number;
}

// Envelope System Types
export type EnvelopeType = 'cash' | 'debt';

export interface Envelope {
  id: number;
  name: string;
  account_id: number;
  type: EnvelopeType;
  current_balance: number;
  spending_limit?: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEnvelopeData {
  name: string;
  account_id: number;
  type: EnvelopeType;
  current_balance?: number;
  spending_limit?: number;
  description?: string;
}

export interface UpdateEnvelopeData {
  name?: string;
  current_balance?: number;
  spending_limit?: number;
  description?: string;
}

export interface EnvelopeTransfer {
  id: number;
  from_envelope_id: number;
  to_envelope_id: number;
  amount: number;
  date: string;
  description?: string;
  created_at: string;
}

export interface CreateEnvelopeTransferData {
  from_envelope_id: number;
  to_envelope_id: number;
  amount: number;
  date: string;
  description?: string;
}

// Enhanced Account interface with envelope relationship
export interface AccountWithEnvelopes extends Account {
  envelopes: Envelope[];
  envelope_total: number;
  balance_difference: number; // account balance - envelope total (should be 0)
}

// Envelope with account information
export interface EnvelopeWithAccount extends Envelope {
  account_name: string;
  account_type: AccountType;
}

// Transaction System Types
export type BankTransactionStatus = 'not_posted' | 'pending' | 'cleared';
export type CreditCardTransactionStatus = 'unpaid' | 'paid';
export type TransactionStatus = BankTransactionStatus | CreditCardTransactionStatus;

export interface Transaction {
  id: number;
  account_id: number;
  envelope_id: number;
  amount: number;
  date: string;
  status: TransactionStatus;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionInput {
  account_id: number;
  envelope_id: number;
  amount: number;
  date: string;
  status: TransactionStatus;
  description?: string;
}

export interface TransactionWithDetails extends Transaction {
  account_name: string;
  account_type: AccountType;
  envelope_name: string;
  envelope_type: EnvelopeType;
}

export interface UpdateTransactionData {
  amount?: number;
  date?: string;
  status?: TransactionStatus;
  description?: string;
}

// Account Transfer Types
export interface AccountTransfer {
  id: number;
  from_account_id: number;
  to_account_id: number;
  from_envelope_id: number;
  to_envelope_id: number;
  amount: number;
  date: string;
  description?: string;
  created_at: string;
}

export interface CreateAccountTransferData {
  from_account_id: number;
  to_account_id: number;
  from_envelope_id: number;
  to_envelope_id: number;
  amount: number;
  date: string;
  description?: string;
}

// Credit Card Payment Types
export interface CreditCardPayment {
  id: number;
  credit_card_account_id: number;
  total_amount: number;
  date: string;
  description?: string;
  created_at: string;
}

export interface PaymentAllocation {
  id: number;
  payment_id: number;
  envelope_id: number;
  amount: number;
  created_at: string;
}

export interface CreateCreditCardPaymentData {
  credit_card_account_id: number;
  total_amount: number;
  date: string;
  description?: string;
  allocations: {
    envelope_id: number;
    amount: number;
  }[];
}

export interface CreditCardPaymentWithAllocations extends CreditCardPayment {
  allocations: (PaymentAllocation & {
    envelope_name: string;
    envelope_account_name: string;
  })[];
}

// Balance Calculation Types
export interface AccountBalanceByStatus {
  account_id: number;
  account_name: string;
  account_type: AccountType;
  not_posted_balance?: number;
  pending_balance?: number;
  cleared_balance?: number;
  unpaid_balance?: number;
  paid_balance?: number;
  total_balance: number;
  available_balance: number; // For planning - includes pending for bank accounts
}

export interface EnvelopeBalanceByStatus {
  envelope_id: number;
  envelope_name: string;
  account_id: number;
  account_name: string;
  envelope_type: EnvelopeType;
  not_posted_balance?: number;
  pending_balance?: number;
  cleared_balance?: number;
  unpaid_balance?: number;
  paid_balance?: number;
  total_balance: number;
  available_balance: number;
}

// Form Data Types for UI
export interface TransactionFormData {
  account_id: string;
  envelope_id: string;
  amount: string;
  date: string;
  status: TransactionStatus;
  description: string;
}

export interface AccountTransferFormData {
  from_account_id: string;
  to_account_id: string;
  from_envelope_id: string;
  to_envelope_id: string;
  amount: string;
  date: string;
  description: string;
}

export interface CreditCardPaymentFormData {
  credit_card_account_id: string;
  total_amount: string;
  date: string;
  description: string;
  allocations: {
    envelope_id: string;
    amount: string;
  }[];
}

// Compensation Creator System Types
export type FundingTargetType = 'monthly_minimum' | 'per_paycheck' | 'monthly_stipend';

export interface FundingTarget {
  id: number;
  envelope_id: number;
  target_type: FundingTargetType;
  target_amount: number;
  minimum_amount?: number; // For monthly_stipend type
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateFundingTargetData {
  envelope_id: number;
  target_type: FundingTargetType;
  target_amount: number;
  minimum_amount?: number;
  description?: string;
  is_active?: boolean;
}

export interface UpdateFundingTargetData {
  target_type?: FundingTargetType;
  target_amount?: number;
  minimum_amount?: number;
  description?: string;
  is_active?: boolean;
}

export interface FundingTargetWithEnvelope extends FundingTarget {
  envelope_name: string;
  envelope_type: EnvelopeType;
  account_name: string;
  current_balance: number;
  available_balance: number;
}

export interface CompensationCalculation {
  paycheck_date: string;
  total_payment: number;
  w2_amount: number; // 75%
  dividend_amount: number; // 25%
  debt_by_envelope: {
    envelope_id: number;
    envelope_name: string;
    debt_amount: number;
  }[];
  funding_targets: {
    envelope_id: number;
    envelope_name: string;
    target_type: FundingTargetType;
    target_amount: number;
    current_balance: number;
    shortfall: number;
  }[];
  total_debt: number;
  total_shortfall: number;
  recommended_payment: number;
}

export interface CompensationFormData {
  paycheck_date: string;
  custom_amount?: string;
  include_debt_payment: boolean;
  include_funding_targets: boolean;
  additional_amount: string;
  notes: string;
}

// Helper Functions for Status Validation
export function isValidTransactionStatus(accountType: AccountType, status: TransactionStatus): boolean {
  if (accountType === 'credit_card') {
    return status === 'unpaid' || status === 'paid';
  } else {
    return status === 'not_posted' || status === 'pending' || status === 'cleared';
  }
}

export function getValidStatusesForAccountType(accountType: AccountType): TransactionStatus[] {
  if (accountType === 'credit_card') {
    return ['unpaid', 'paid'];
  } else {
    return ['not_posted', 'pending', 'cleared'];
  }
}

export function statusAffectsBalance(accountType: AccountType, status: TransactionStatus): boolean {
  if (accountType === 'credit_card') {
    return status === 'unpaid';
  } else {
    return status === 'cleared';
  }
}

export function statusAffectsAvailableBalance(accountType: AccountType, status: TransactionStatus): boolean {
  if (accountType === 'credit_card') {
    return status === 'unpaid';
  } else {
    return status === 'pending' || status === 'cleared';
  }
}