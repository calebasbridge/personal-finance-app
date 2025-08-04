// Enhanced profileAPI.ts with Password Protection Support
// src/utils/profileAPI.ts

/**
 * Safe Profile API wrapper for TypeScript compatibility
 * Provides password protection and error handling for all profile operations
 */

// Import types explicitly to ensure TypeScript recognizes them
import type { ElectronAPI } from '../types/electron';

interface Profile {
  name: string;
  displayName: string;
  created: string;
  lastUsed: string;
  hasPassword: boolean;
  description?: string;
  isActive?: boolean;
}

interface ProfileAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

class SafeProfileAPI {
  private ensureElectronAPI(): ElectronAPI {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    // Cast to ElectronAPI to ensure we have the full interface
    return window.electronAPI as ElectronAPI;
  }

  async listProfiles(): Promise<{ profiles: Profile[] }> {
    try {
      const api = this.ensureElectronAPI();
      const result = await api.profile.listProfiles();
      return result;
    } catch (error) {
      console.error('Profile API Error (listProfiles):', error);
      throw new Error(`Failed to list profiles: ${error}`);
    }
  }

  async getCurrentProfile(): Promise<{ profileName: string | null }> {
    try {
      const api = this.ensureElectronAPI();
      const result = await api.profile.getCurrentProfile();
      return result;
    } catch (error) {
      console.error('Profile API Error (getCurrentProfile):', error);
      throw new Error(`Failed to get current profile: ${error}`);
    }
  }

  async create(name: string, description?: string, password?: string): Promise<{ success: boolean; profileName: string }> {
    try {
      const api = this.ensureElectronAPI();
      const result = await api.profile.create(name, description, password);
      return result;
    } catch (error) {
      console.error('Profile API Error (create):', error);
      throw new Error(`Failed to create profile: ${error}`);
    }
  }

  async switchTo(name: string, password?: string): Promise<{ success: boolean; profileName: string }> {
    try {
      const api = this.ensureElectronAPI();
      const result = await api.profile.switchTo(name, password);
      return result;
    } catch (error) {
      console.error('Profile API Error (switchTo):', error);
      throw new Error(`Failed to switch to profile: ${error}`);
    }
  }

  async delete(name: string): Promise<{ success: boolean }> {
    try {
      const api = this.ensureElectronAPI();
      const result = await api.profile.delete(name);
      return result;
    } catch (error) {
      console.error('Profile API Error (delete):', error);
      throw new Error(`Failed to delete profile: ${error}`);
    }
  }

  async exists(name: string): Promise<boolean> {
    try {
      const api = this.ensureElectronAPI();
      const result = await api.profile.exists(name);
      return result;
    } catch (error) {
      console.error('Profile API Error (exists):', error);
      throw new Error(`Failed to check if profile exists: ${error}`);
    }
  }

  async getLastUsed(): Promise<string | null> {
    try {
      const api = this.ensureElectronAPI();
      const result = await api.profile.getLastUsed();
      return result;
    } catch (error) {
      console.error('Profile API Error (getLastUsed):', error);
      throw new Error(`Failed to get last used profile: ${error}`);
    }
  }

  async migrateExistingDatabase(): Promise<{ success: boolean; migrated: boolean; profileName?: string }> {
    try {
      const api = this.ensureElectronAPI();
      const result = await api.profile.migrateExistingDatabase();
      return result;
    } catch (error) {
      console.error('Profile API Error (migrateExistingDatabase):', error);
      throw new Error(`Failed to migrate existing database: ${error}`);
    }
  }

  async changePassword(profileName: string, oldPassword: string, newPassword: string): Promise<{ success: boolean }> {
    try {
      const api = this.ensureElectronAPI();
      const result = await api.profile.changePassword(profileName, oldPassword, newPassword);
      return result;
    } catch (error) {
      console.error('Profile API Error (changePassword):', error);
      throw new Error(`Failed to change password: ${error}`);
    }
  }

  async removePassword(profileName: string, currentPassword: string): Promise<{ success: boolean }> {
    try {
      const api = this.ensureElectronAPI();
      const result = await api.profile.removePassword(profileName, currentPassword);
      return result;
    } catch (error) {
      console.error('Profile API Error (removePassword):', error);
      throw new Error(`Failed to remove password: ${error}`);
    }
  }

  async addPassword(profileName: string, newPassword: string): Promise<{ success: boolean }> {
    try {
      const api = this.ensureElectronAPI();
      const result = await api.profile.addPassword(profileName, newPassword);
      return result;
    } catch (error) {
      console.error('Profile API Error (addPassword):', error);
      throw new Error(`Failed to add password: ${error}`);
    }
  }

  async verifyPassword(profileName: string, password: string): Promise<{ valid: boolean }> {
    try {
      const api = this.ensureElectronAPI();
      const result = await api.profile.verifyPassword(profileName, password);
      return result;
    } catch (error) {
      console.error('Profile API Error (verifyPassword):', error);
      throw new Error(`Failed to verify password: ${error}`);
    }
  }

  async cleanupDuplicates(): Promise<{ success: boolean; cleaned: boolean }> {
    try {
      const api = this.ensureElectronAPI();
      const result = await api.profile.cleanupDuplicates();
      return result;
    } catch (error) {
      console.error('Profile API Error (cleanupDuplicates):', error);
      throw new Error(`Failed to cleanup duplicate profiles: ${error}`);
    }
  }
}

// Export singleton instance
export const safeProfileAPI = new SafeProfileAPI();

// Type exports for consumers
export type { Profile, ProfileAPIResponse };
