// Database exports
export { getDatabase, closeDatabase } from './connection';
export { accountsRepository, AccountsRepository } from './accounts';
export { envelopeRepository, EnvelopeOperations } from './envelopes';
export { TransactionDatabase, transactionDatabase } from './transactions';
export { CreditCardPaymentDatabase, creditCardPaymentDatabase } from './creditCardPayments';
export { CompensationCreatorDatabase, compensationCreatorDatabase } from './compensationCreator';

// Enhanced profile management exports with password support
export { 
  getAllProfiles, 
  getCurrentProfile, 
  createProfile, 
  switchToProfile, 
  deleteProfile, 
  getLastUsedProfile,
  migrateExistingDatabase,
  profileExists,
  verifyProfilePassword,
  changeProfilePassword,
  removeProfilePassword,
  cleanupDuplicateProfiles
} from './connection';
export { profileManager } from './profileManager';
export type { Profile, CreateProfileOptions } from './profileManager';

export * from './types';