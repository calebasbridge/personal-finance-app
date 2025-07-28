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