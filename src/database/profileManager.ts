// Enhanced profileManager.ts with Password Protection
// src/database/profileManager.ts

import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { app } from 'electron';

export interface Profile {
  name: string;
  displayName: string;
  created: string;
  lastUsed: string;
  hasPassword: boolean;
  description?: string;
  passwordHash?: string;
  salt?: string;
}

export interface ProfileMetadata {
  profiles: Profile[];
  currentProfile?: string;
  version: string;
}

export interface CreateProfileOptions {
  name: string;
  displayName?: string;
  description?: string;
  password?: string;
}

class ProfileManager {
  private profilesDirectory: string;
  private metadataFile: string;
  private currentDatabase: Database.Database | null = null;
  private currentProfileName: string | null = null;

  constructor() {
    // Store profiles in user documents
    const userDocuments = app.getPath('documents');
    this.profilesDirectory = path.join(userDocuments, 'PersonalFinanceApp', 'profiles');
    this.metadataFile = path.join(userDocuments, 'PersonalFinanceApp', 'profile-metadata.json');
    
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists(): void {
    const appDirectory = path.dirname(this.profilesDirectory);
    if (!fs.existsSync(appDirectory)) {
      fs.mkdirSync(appDirectory, { recursive: true });
    }
    if (!fs.existsSync(this.profilesDirectory)) {
      fs.mkdirSync(this.profilesDirectory, { recursive: true });
    }
  }

  private getMetadata(): ProfileMetadata {
    if (!fs.existsSync(this.metadataFile)) {
      const defaultMetadata: ProfileMetadata = {
        profiles: [],
        version: '1.0.0'
      };
      this.saveMetadata(defaultMetadata);
      return defaultMetadata;
    }

    try {
      const content = fs.readFileSync(this.metadataFile, 'utf8');
      return JSON.parse(content) as ProfileMetadata;
    } catch (error) {
      console.error('Failed to read profile metadata:', error);
      return { profiles: [], version: '1.0.0' };
    }
  }

  private saveMetadata(metadata: ProfileMetadata): void {
    try {
      fs.writeFileSync(this.metadataFile, JSON.stringify(metadata, null, 2));
    } catch (error) {
      console.error('Failed to save profile metadata:', error);
      throw new Error('Failed to save profile metadata');
    }
  }

  private sanitizeProfileName(name: string): string {
    // Remove only invalid filename characters, but preserve spaces for display
    // Use a more conservative approach - only remove truly problematic characters
    return name.replace(/[<>:"/\\|?*]/g, '_').replace(/_{2,}/g, '_');
  }

  private getProfileDbPath(profileName: string): string {
    const sanitizedName = this.sanitizeProfileName(profileName);
    return path.join(this.profilesDirectory, `${sanitizedName}.db`);
  }

  // Password utilities
  private generateSalt(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
  }

  private verifyPassword(password: string, hash: string, salt: string): boolean {
    const testHash = this.hashPassword(password, salt);
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(testHash, 'hex'));
  }

  private initializeDatabase(db: Database.Database): void {
    // Enable foreign keys and other pragmas
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    
    this.initializeSchema(db);
  }

  private initializeSchema(db: Database.Database): void {
    // Create accounts table
    const createAccountsTable = `
      CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'credit_card', 'cash')),
        initial_balance REAL NOT NULL DEFAULT 0,
        current_balance REAL NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    db.exec(createAccountsTable);
    
    // Create envelopes table
    const createEnvelopesTable = `
      CREATE TABLE IF NOT EXISTS envelopes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        account_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('cash', 'debt')),
        current_balance REAL NOT NULL DEFAULT 0,
        spending_limit REAL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE
      )
    `;
    
    db.exec(createEnvelopesTable);

    // Create envelope_transfers table
    const createEnvelopeTransfersTable = `
      CREATE TABLE IF NOT EXISTS envelope_transfers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_envelope_id INTEGER NOT NULL,
        to_envelope_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        date DATETIME NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (from_envelope_id) REFERENCES envelopes (id) ON DELETE CASCADE,
        FOREIGN KEY (to_envelope_id) REFERENCES envelopes (id) ON DELETE CASCADE
      )
    `;
    
    db.exec(createEnvelopeTransfersTable);

    // Create transactions table
    const createTransactionsTable = `
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER NOT NULL,
        envelope_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        date DATETIME NOT NULL,
        description TEXT,
        status TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'debit',
        reference_number TEXT,
        is_recurring BOOLEAN DEFAULT FALSE,
        parent_transaction_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE,
        FOREIGN KEY (envelope_id) REFERENCES envelopes (id) ON DELETE CASCADE,
        CHECK (status IN ('not_posted', 'pending', 'cleared', 'unpaid', 'paid')),
        CHECK (type IN ('debit', 'credit', 'transfer', 'payment'))
      )
    `;
    
    db.exec(createTransactionsTable);

    // Create account_transfers table
    const createAccountTransfersTable = `
      CREATE TABLE IF NOT EXISTS account_transfers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_account_id INTEGER NOT NULL,
        to_account_id INTEGER NOT NULL,
        from_envelope_id INTEGER NOT NULL,
        to_envelope_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        date DATETIME NOT NULL,
        description TEXT,
        status TEXT NOT NULL,
        from_transaction_id INTEGER,
        to_transaction_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (from_account_id) REFERENCES accounts (id) ON DELETE CASCADE,
        FOREIGN KEY (to_account_id) REFERENCES accounts (id) ON DELETE CASCADE,
        FOREIGN KEY (from_envelope_id) REFERENCES envelopes (id) ON DELETE CASCADE,
        FOREIGN KEY (to_envelope_id) REFERENCES envelopes (id) ON DELETE CASCADE
      )
    `;
    
    db.exec(createAccountTransfersTable);

    // Create credit_card_payments table
    const createCreditCardPaymentsTable = `
      CREATE TABLE IF NOT EXISTS credit_card_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        credit_card_account_id INTEGER NOT NULL,
        total_amount REAL NOT NULL,
        date DATETIME NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (credit_card_account_id) REFERENCES accounts (id) ON DELETE CASCADE
      )
    `;
    
    db.exec(createCreditCardPaymentsTable);

    // Create payment_allocations table
    const createPaymentAllocationsTable = `
      CREATE TABLE IF NOT EXISTS payment_allocations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        payment_id INTEGER NOT NULL,
        envelope_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (payment_id) REFERENCES credit_card_payments (id) ON DELETE CASCADE,
        FOREIGN KEY (envelope_id) REFERENCES envelopes (id) ON DELETE CASCADE
      )
    `;
    
    db.exec(createPaymentAllocationsTable);

    // Create funding_targets table (Compensation Creator)
    const createFundingTargetsTable = `
      CREATE TABLE IF NOT EXISTS funding_targets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        envelope_id INTEGER NOT NULL,
        target_type TEXT NOT NULL CHECK (target_type IN ('monthly_minimum', 'per_paycheck', 'monthly_stipend')),
        target_amount REAL NOT NULL,
        minimum_amount REAL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (envelope_id) REFERENCES envelopes (id) ON DELETE CASCADE
      )
    `;
    
    db.exec(createFundingTargetsTable);

    // Create database views for balance calculations
    this.createBalanceViews(db);

    // Create triggers for updated_at timestamps
    this.createUpdateTriggers(db);
  }

  private createBalanceViews(db: Database.Database): void {
    // Account balances by status view
    const createAccountBalancesView = `
      CREATE VIEW IF NOT EXISTS account_balances_by_status AS
      SELECT 
        a.id,
        a.name,
        a.type,
        a.initial_balance,
        CASE 
          WHEN a.type = 'credit_card' THEN
            a.initial_balance - COALESCE(SUM(
              CASE 
                WHEN t.status = 'unpaid' THEN t.amount 
                ELSE 0 
              END
            ), 0)
          ELSE
            a.initial_balance + COALESCE(SUM(
              CASE 
                WHEN t.status IN ('cleared', 'paid') THEN 
                  CASE WHEN t.type = 'credit' THEN t.amount ELSE -t.amount END
                WHEN t.status IN ('pending') THEN 
                  CASE WHEN t.type = 'credit' THEN t.amount ELSE -t.amount END
                ELSE 0 
              END
            ), 0)
        END as current_balance,
        a.created_at,
        a.updated_at
      FROM accounts a
      LEFT JOIN transactions t ON a.id = t.account_id
      GROUP BY a.id, a.name, a.type, a.initial_balance, a.created_at, a.updated_at
    `;
    
    db.exec(createAccountBalancesView);

    // Envelope balances by status view
    const createEnvelopeBalancesView = `
      CREATE VIEW IF NOT EXISTS envelope_balances_by_status AS
      SELECT 
        e.id,
        e.name,
        e.account_id,
        e.type,
        e.spending_limit,
        e.description,
        CASE 
          WHEN e.type = 'debt' THEN
            COALESCE(SUM(
              CASE 
                WHEN t.status = 'unpaid' THEN t.amount 
                ELSE 0 
              END
            ), 0)
          ELSE
            COALESCE(SUM(
              CASE 
                WHEN t.status IN ('cleared', 'paid') THEN 
                  CASE WHEN t.type = 'credit' THEN t.amount ELSE -t.amount END
                WHEN t.status IN ('pending') THEN 
                  CASE WHEN t.type = 'credit' THEN t.amount ELSE -t.amount END
                ELSE 0 
              END
            ), 0) + COALESCE(
              (SELECT SUM(
                CASE 
                  WHEN et.to_envelope_id = e.id THEN et.amount 
                  WHEN et.from_envelope_id = e.id THEN -et.amount 
                  ELSE 0 
                END
              ) FROM envelope_transfers et 
              WHERE et.to_envelope_id = e.id OR et.from_envelope_id = e.id), 0
            )
        END as current_balance,
        e.created_at,
        e.updated_at
      FROM envelopes e
      LEFT JOIN transactions t ON e.id = t.envelope_id
      GROUP BY e.id, e.name, e.account_id, e.type, e.spending_limit, e.description, e.created_at, e.updated_at
    `;
    
    db.exec(createEnvelopeBalancesView);
  }

  private createUpdateTriggers(db: Database.Database): void {
    const triggers = [
      `CREATE TRIGGER IF NOT EXISTS update_accounts_updated_at 
       AFTER UPDATE ON accounts
       FOR EACH ROW
       BEGIN
         UPDATE accounts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
       END`,
      `CREATE TRIGGER IF NOT EXISTS update_envelopes_updated_at 
       AFTER UPDATE ON envelopes
       FOR EACH ROW
       BEGIN
         UPDATE envelopes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
       END`,
      `CREATE TRIGGER IF NOT EXISTS update_transactions_updated_at 
       AFTER UPDATE ON transactions
       FOR EACH ROW
       BEGIN
         UPDATE transactions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
       END`,
      `CREATE TRIGGER IF NOT EXISTS update_funding_targets_updated_at 
       AFTER UPDATE ON funding_targets
       FOR EACH ROW
       BEGIN
         UPDATE funding_targets SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
       END`
    ];

    triggers.forEach(trigger => db.exec(trigger));
  }

  // Public API Methods
  public getAllProfiles(): Profile[] {
    const metadata = this.getMetadata();
    // Remove sensitive password data from public API
    return metadata.profiles.map(profile => ({
      name: profile.name,
      displayName: profile.displayName,
      created: profile.created,
      lastUsed: profile.lastUsed,
      hasPassword: profile.hasPassword,
      description: profile.description
    }));
  }

  public getCurrentProfile(): string | null {
    return this.currentProfileName;
  }

  public profileExists(name: string): boolean {
    const profiles = this.getAllProfiles();
    const sanitizedName = this.sanitizeProfileName(name);
    return profiles.some(p => p.name === sanitizedName || p.displayName === name);
  }

  public createProfile(options: CreateProfileOptions): Profile {
    const { name, displayName, description, password } = options;

    if (this.profileExists(name)) {
      throw new Error(`Profile "${name}" already exists`);
    }

    const sanitizedName = this.sanitizeProfileName(name);
    const dbPath = this.getProfileDbPath(name);

    // Create the database file
    const db = new Database(dbPath);
    this.initializeDatabase(db);
    db.close();

    // Handle password encryption
    let passwordHash: string | undefined;
    let salt: string | undefined;
    
    if (password) {
      salt = this.generateSalt();
      passwordHash = this.hashPassword(password, salt);
    }

    // Create profile metadata
    const profile: Profile = {
      name: sanitizedName,
      displayName: displayName || name,
      created: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      hasPassword: !!password,
      description,
      ...(passwordHash && salt && { passwordHash, salt })
    };

    // Save to metadata
    const metadata = this.getMetadata();
    metadata.profiles.push(profile);
    this.saveMetadata(metadata);

    console.log(`✅ Created profile: ${profile.displayName} ${password ? '(password protected)' : ''}`);
    return profile;
  }

  public verifyProfilePassword(name: string, password: string): boolean {
    const metadata = this.getMetadata();
    const profile = metadata.profiles.find(p => p.name === name);
    
    if (!profile) {
      throw new Error(`Profile "${name}" not found`);
    }

    if (!profile.hasPassword) {
      return true; // No password required
    }

    if (!profile.passwordHash || !profile.salt) {
      throw new Error('Profile password data is corrupted');
    }

    return this.verifyPassword(password, profile.passwordHash, profile.salt);
  }

  public deleteProfile(name: string): boolean {
    if (!this.profileExists(name)) {
      return false;
    }

    const dbPath = this.getProfileDbPath(name);
    
    try {
      // Close current database if it's the one being deleted
      if (this.currentProfileName === name) {
        this.closeCurrentDatabase();
      }

      // Delete database file
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
      }

      // Remove from metadata
      const metadata = this.getMetadata();
      metadata.profiles = metadata.profiles.filter(p => p.name !== name);
      
      // Clear current profile if it was deleted
      if (metadata.currentProfile === name) {
        metadata.currentProfile = undefined;
      }
      
      this.saveMetadata(metadata);

      console.log(`🗑️ Deleted profile: ${name}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete profile ${name}:`, error);
      return false;
    }
  }

  public switchToProfile(name: string, password?: string): Database.Database {
    if (!this.profileExists(name)) {
      throw new Error(`Profile "${name}" does not exist`);
    }

    // Verify password if required
    if (!this.verifyProfilePassword(name, password || '')) {
      throw new Error('Invalid password for profile');
    }

    // Close current database
    this.closeCurrentDatabase();

    // Open new profile database
    const dbPath = this.getProfileDbPath(name);
    this.currentDatabase = new Database(dbPath);
    this.currentProfileName = name;
    
    this.initializeDatabase(this.currentDatabase);

    // Update metadata
    const metadata = this.getMetadata();
    metadata.currentProfile = name;
    
    // Update last used time for the profile
    const profile = metadata.profiles.find(p => p.name === name);
    if (profile) {
      profile.lastUsed = new Date().toISOString();
    }
    
    this.saveMetadata(metadata);

    console.log(`🔄 Switched to profile: ${name}`);
    return this.currentDatabase;
  }

  public changeProfilePassword(name: string, oldPassword: string, newPassword: string): boolean {
    const metadata = this.getMetadata();
    const profile = metadata.profiles.find(p => p.name === name);
    
    if (!profile) {
      throw new Error(`Profile "${name}" not found`);
    }

    // Verify old password if profile has one
    if (profile.hasPassword && !this.verifyProfilePassword(name, oldPassword)) {
      throw new Error('Invalid current password');
    }

    // Set new password
    const salt = this.generateSalt();
    const passwordHash = this.hashPassword(newPassword, salt);
    
    profile.passwordHash = passwordHash;
    profile.salt = salt;
    profile.hasPassword = true;
    
    this.saveMetadata(metadata);
    console.log(`🔐 Changed password for profile: ${name}`);
    return true;
  }

  public removeProfilePassword(name: string, currentPassword: string): boolean {
    const metadata = this.getMetadata();
    const profile = metadata.profiles.find(p => p.name === name);
    
    if (!profile) {
      throw new Error(`Profile "${name}" not found`);
    }

    // Verify current password
    if (!this.verifyProfilePassword(name, currentPassword)) {
      throw new Error('Invalid current password');
    }

    // Remove password
    delete profile.passwordHash;
    delete profile.salt;
    profile.hasPassword = false;
    
    this.saveMetadata(metadata);
    console.log(`🔓 Removed password from profile: ${name}`);
    return true;
  }

  public getCurrentDatabase(): Database.Database {
    if (!this.currentDatabase) {
      throw new Error('No profile is currently active. Please select or create a profile first.');
    }
    return this.currentDatabase;
  }

  public closeCurrentDatabase(): void {
    if (this.currentDatabase) {
      this.currentDatabase.close();
      this.currentDatabase = null;
      this.currentProfileName = null;
    }
  }

  public getLastUsedProfile(): string | null {
    const metadata = this.getMetadata();
    return metadata.currentProfile || null;
  }

  public migrateExistingDatabase(): boolean {
    // Check if there's an existing database in the old location
    const userDataPath = app.getPath('userData');
    const oldDbPath = path.join(userDataPath, 'personal-finance.db');
    
    if (!fs.existsSync(oldDbPath)) {
      return false; // No existing database to migrate
    }

    try {
      // Check if Main profile already exists to prevent duplicates
      const existingProfiles = this.getAllProfiles();
      const mainProfileExists = existingProfiles.some(p => 
        p.displayName === 'Main' || p.name.toLowerCase().includes('main')
      );
      
      if (mainProfileExists) {
        console.log('🔄 Main profile already exists, skipping migration');
        return false;
      }

      // Create a "Main" profile from existing database
      const defaultProfileName = 'Main';
      const newDbPath = this.getProfileDbPath(defaultProfileName);
      
      // Copy the existing database
      fs.copyFileSync(oldDbPath, newDbPath);
      
      // Create profile metadata
      const profile: Profile = {
        name: this.sanitizeProfileName(defaultProfileName),
        displayName: defaultProfileName,
        created: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
        hasPassword: false,
        description: 'Migrated from existing database'
      };

      const metadata = this.getMetadata();
      metadata.profiles.push(profile);
      metadata.currentProfile = profile.name;
      this.saveMetadata(metadata);

      console.log(`🔄 Migrated existing database to profile: ${defaultProfileName}`);
      
      // Optionally remove old database file
      // fs.unlinkSync(oldDbPath);
      
      return true;
    } catch (error) {
      console.error('Failed to migrate existing database:', error);
      return false;
    }
  }

  // Clean up duplicate profiles
  public cleanupDuplicateProfiles(): boolean {
    try {
      const metadata = this.getMetadata();
      const mainProfiles = metadata.profiles.filter(p => 
        p.displayName === 'Main' || p.name.toLowerCase().includes('main')
      );
      
      if (mainProfiles.length <= 1) {
        return false; // No duplicates found
      }
      
      console.log(`🧹 Found ${mainProfiles.length} Main profiles - cleaning up...`);
      
      // Keep the first Main profile, remove others
      const keepProfile = mainProfiles[0];
      const removeProfiles = mainProfiles.slice(1);
      
      // Remove duplicate profiles from metadata
      metadata.profiles = metadata.profiles.filter(p => 
        !removeProfiles.some(rp => rp.name === p.name)
      );
      
      // Clean up database files for removed profiles
      removeProfiles.forEach(profile => {
        const dbFile = this.getProfileDbPath(profile.name);
        if (fs.existsSync(dbFile)) {
          fs.unlinkSync(dbFile);
          console.log(`🗑️ Removed duplicate database file: ${profile.name}.db`);
        }
      });
      
      // Update metadata
      this.saveMetadata(metadata);
      console.log(`✅ Cleaned up duplicate profiles - kept: ${keepProfile.displayName}`);
      
      return true;
    } catch (error) {
      console.error('Error cleaning up duplicate profiles:', error);
      return false;
    }
  }
}

// Export singleton instance
export const profileManager = new ProfileManager();