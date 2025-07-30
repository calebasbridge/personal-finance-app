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