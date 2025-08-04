// src/database/connection.ts - Updated to use ProfileManager with password support

import Database from 'better-sqlite3';
import { profileManager } from './profileManager';

export function getDatabase(): Database.Database {
  return profileManager.getCurrentDatabase();
}

export function closeDatabase(): void {
  profileManager.closeCurrentDatabase();
}

// Profile management functions
export function getAllProfiles() {
  return profileManager.getAllProfiles();
}

export function getCurrentProfile() {
  return profileManager.getCurrentProfile();
}

export function createProfile(options: any) {
  return profileManager.createProfile(options);
}

export function switchToProfile(name: string, password?: string) {
  return profileManager.switchToProfile(name, password);
}

export function deleteProfile(name: string) {
  return profileManager.deleteProfile(name);
}

export function getLastUsedProfile() {
  return profileManager.getLastUsedProfile();
}

export function migrateExistingDatabase() {
  return profileManager.migrateExistingDatabase();
}

export function profileExists(name: string) {
  return profileManager.profileExists(name);
}

// Enhanced password management functions
export function verifyProfilePassword(name: string, password: string) {
  return profileManager.verifyProfilePassword(name, password);
}

export function changeProfilePassword(name: string, oldPassword: string, newPassword: string) {
  return profileManager.changeProfilePassword(name, oldPassword, newPassword);
}

export function removeProfilePassword(name: string, currentPassword: string) {
  return profileManager.removeProfilePassword(name, currentPassword);
}

export function cleanupDuplicateProfiles() {
  return profileManager.cleanupDuplicateProfiles();
}