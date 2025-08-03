// src/utils/electronAPI.ts - Safe ElectronAPI access utility

import type { ElectronAPI } from '../types/electron';

/**
 * Safe access to the Electron API with proper error handling
 * This utility helps avoid TypeScript compilation issues while maintaining type safety
 */
export const getElectronAPI = (): ElectronAPI => {
  if (typeof window === 'undefined') {
    throw new Error('ElectronAPI is only available in the renderer process');
  }

  const api = (window as any).electronAPI;
  
  if (!api) {
    throw new Error('ElectronAPI is not available. Make sure you are running in an Electron context.');
  }

  return api as ElectronAPI;
};

/**
 * Check if the Electron API is available
 */
export const isElectronAPIAvailable = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof (window as any).electronAPI !== 'undefined';
};

/**
 * Get a specific API section with error handling
 */
export const getAPISection = <T extends keyof ElectronAPI>(
  sectionName: T
): ElectronAPI[T] => {
  const api = getElectronAPI();
  
  if (!api[sectionName]) {
    throw new Error(`API section '${sectionName}' is not available`);
  }
  
  return api[sectionName];
};

// Convenience accessors for each API section
export const useDatabase = () => getAPISection('database');
export const useAccounts = () => getAPISection('accounts');
export const useEnvelopes = () => getAPISection('envelopes');
export const useTransactions = () => getAPISection('transactions');
export const useAccountTransfers = () => getAPISection('accountTransfers');
export const useBalances = () => getAPISection('balances');
export const useCreditCardPayments = () => getAPISection('creditCardPayments');
export const useDebt = () => getAPISection('debt');
export const useCompensation = () => getAPISection('compensation');

export default getElectronAPI;
