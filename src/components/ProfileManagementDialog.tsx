// Enhanced ProfileManagementDialog.tsx with Fixed Z-Index Layering
import React, { useState, useEffect } from 'react';
import { safeProfileAPI } from '../utils/profileAPI';

interface ProfileManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileChanged: () => void;
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

const ProfileManagementDialog: React.FC<ProfileManagementDialogProps> = ({ 
  isOpen, 
  onClose, 
  onProfileChanged 
}) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDescription, setNewProfileDescription] = useState('');
  const [newProfilePassword, setNewProfilePassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingSwitch, setPendingSwitch] = useState<string | null>(null);
  const [switchPassword, setSwitchPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadProfiles();
    }
  }, [isOpen]);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const result = await safeProfileAPI.listProfiles();
      setProfiles(result.profiles);
      setError(null);
    } catch (err) {
      console.error('Failed to load profiles:', err);
      setError('Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = () => {
    if (!usePassword) return true;
    
    if (!newProfilePassword) {
      setError('Password is required when password protection is enabled');
      return false;
    }
    
    if (newProfilePassword.length < 4) {
      setError('Password must be at least 4 characters long');
      return false;
    }
    
    if (newProfilePassword !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) {
      setError('Profile name is required');
      return;
    }

    if (!validatePassword()) {
      return;
    }

    try {
      setLoading(true);
      await safeProfileAPI.create(
        newProfileName.trim(), 
        newProfileDescription.trim(),
        usePassword ? newProfilePassword : undefined
      );
      
      // Reset form
      setNewProfileName('');
      setNewProfileDescription('');
      setNewProfilePassword('');
      setConfirmPassword('');
      setUsePassword(false);
      setIsCreating(false);
      
      await loadProfiles();
      onProfileChanged();
      setError(null);
    } catch (err) {
      console.error('Failed to create profile:', err);
      setError('Failed to create profile. Name may already exist.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchProfile = async (profileName: string) => {
    const profile = profiles.find(p => p.name === profileName);
    
    if (profile?.hasPassword) {
      setPendingSwitch(profileName);
      setSwitchPassword('');
      setPasswordError(null);
      return;
    }

    await performSwitch(profileName);
  };

  const performSwitch = async (profileName: string, password?: string) => {
    try {
      setLoading(true);
      setPasswordError(null);
      
      // First verify password if profile is protected
      if (password && profiles.find(p => p.name === profileName)?.hasPassword) {
        console.log('Verifying password for profile:', profileName);
        const verification = await safeProfileAPI.verifyPassword(profileName, password);
        if (!verification.valid) {
          setPasswordError('Incorrect password. Please try again.');
          return;
        }
      }
      
      // Now attempt the switch
      console.log('Attempting to switch to profile:', profileName);
      await safeProfileAPI.switchTo(profileName, password);
      
      // Success - close all dialogs and refresh
      await loadProfiles();
      onProfileChanged();
      setError(null);
      setPasswordError(null);
      setPendingSwitch(null);
      setSwitchPassword('');
      
      // Close dialog and refresh page
      onClose();
      window.location.reload();
      
    } catch (err) {
      console.error('Failed to switch profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Handle specific error types
      if (errorMessage.includes('Invalid password')) {
        setPasswordError('Incorrect password. Please try again.');
      } else if (errorMessage.includes('not found')) {
        setError('Profile not found. Please refresh and try again.');
      } else if (errorMessage.includes('password')) {
        setPasswordError('Password verification failed. Please check your password.');
      } else {
        setError(`Failed to switch profile: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSwitch = async () => {
    const profile = profiles.find(p => p.name === pendingSwitch);
    
    if (!profile) {
      setPasswordError('Profile not found');
      return;
    }
    
    if (profile.hasPassword && !switchPassword.trim()) {
      setPasswordError('Password is required for this profile');
      return;
    }
    
    if (pendingSwitch) {
      await performSwitch(pendingSwitch, switchPassword);
    }
  };

  const handleDeleteProfile = async (profileName: string) => {
    if (profiles.find(p => p.name === profileName)?.isActive) {
      setError('Cannot delete the active profile');
      return;
    }

    const profile = profiles.find(p => p.name === profileName);
    const displayName = profile?.displayName || profileName;

    const confirmed = window.confirm(
      `Are you sure you want to delete the profile "${displayName}"?\n\nThis will permanently delete all financial data in this profile. This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      await safeProfileAPI.delete(profileName);
      await loadProfiles();
      onProfileChanged();
      setError(null);
    } catch (err) {
      console.error('Failed to delete profile:', err);
      setError('Failed to delete profile');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsCreating(false);
    setNewProfileName('');
    setNewProfileDescription('');
    setNewProfilePassword('');
    setConfirmPassword('');
    setUsePassword(false);
    setPendingSwitch(null);
    setSwitchPassword('');
    setError(null);
    setPasswordError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
      <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '80vh' }}>
        <div className="modal-header">
          <h2 className="modal-title">Manage Profiles</h2>
          <button className="modal-close-btn" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="message message-error">
              <span>⚠️</span>
              {error}
            </div>
          )}

          {/* Existing Profiles */}
          <div className="section-group">
            <h3 className="section-title">Existing Profiles</h3>
            {loading && profiles.length === 0 ? (
              <div className="text-center text-muted">Loading profiles...</div>
            ) : (
              <div className="d-flex flex-col gap-3">
                {profiles.map((profile) => (
                  <div 
                    key={profile.name} 
                    className={`finance-card ${profile.isActive ? 'border-primary' : ''}`}
                  >
                    <div className="finance-card-content">
                      <div className="d-flex justify-between align-center">
                        <div className="flex-1">
                          <div className="d-flex align-center gap-3 mb-1">
                            <span className="font-semibold text-lg text-dark">{profile.displayName || profile.name}</span>
                            {profile.isActive && <span className="badge badge-success">ACTIVE</span>}
                            {profile.hasPassword && <span className="badge badge-warning">🔒 PROTECTED</span>}
                          </div>
                          {profile.description && (
                            <div className="text-muted mb-1">{profile.description}</div>
                          )}
                          <div className="text-xs text-muted">
                            Created: {new Date(profile.created).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="d-flex gap-2">
                          {!profile.isActive && (
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleSwitchProfile(profile.name)}
                              disabled={loading}
                            >
                              Switch
                            </button>
                          )}
                          {!profile.isActive && (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDeleteProfile(profile.name)}
                              disabled={loading}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create New Profile */}
          <div className="section-group">
            <h3 className="section-title">Create New Profile</h3>
            {!isCreating ? (
              <button
                className="btn btn-success"
                onClick={() => setIsCreating(true)}
                disabled={loading}
              >
                + Create New Profile
              </button>
            ) : (
              <div className="form-container">
                <div className="form-group">
                  <label className="form-label required" htmlFor="profileName">Profile Name</label>
                  <input
                    id="profileName"
                    type="text"
                    className="form-input"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    placeholder="e.g., Personal, Business, Family"
                    maxLength={50}
                    disabled={loading}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="profileDescription">Description (Optional)</label>
                  <input
                    id="profileDescription"
                    type="text"
                    className="form-input"
                    value={newProfileDescription}
                    onChange={(e) => setNewProfileDescription(e.target.value)}
                    placeholder="Brief description of this profile"
                    maxLength={200}
                    disabled={loading}
                  />
                </div>

                <div className="d-flex align-center gap-2 mb-3">
                  <input
                    id="usePassword"
                    type="checkbox"
                    checked={usePassword}
                    onChange={(e) => setUsePassword(e.target.checked)}
                    disabled={loading}
                  />
                  <label 
                    htmlFor="usePassword" 
                    className="form-label mb-0"
                    style={{ cursor: 'pointer' }}
                    onClick={() => !loading && setUsePassword(!usePassword)}
                  >
                    🔒 Password protect this profile
                  </label>
                </div>

                {usePassword && (
                  <>
                    <div className="form-group">
                      <label className="form-label required" htmlFor="profilePassword">Password</label>
                      <input
                        id="profilePassword"
                        type="password"
                        className="form-input"
                        value={newProfilePassword}
                        onChange={(e) => setNewProfilePassword(e.target.value)}
                        placeholder="Enter password (min 4 characters)"
                        disabled={loading}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label required" htmlFor="confirmPassword">Confirm Password</label>
                      <input
                        id="confirmPassword"
                        type="password"
                        className="form-input"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        disabled={loading}
                      />
                    </div>
                  </>
                )}

                <div className="form-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setIsCreating(false)}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    className={`btn btn-success ${loading || !newProfileName.trim() ? 'disabled' : ''}`}
                    onClick={handleCreateProfile}
                    disabled={loading || !newProfileName.trim()}
                  >
                    {loading ? 'Creating...' : 'Create Profile'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Password Modal for Profile Switching - HIGHEST Z-INDEX */}
      {pendingSwitch && (
        <div className="modal-overlay" style={{ zIndex: 4000 }}>
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title text-center">
                🔒 Enter Password
              </h3>
              <div className="text-center text-muted">
                Profile: "{profiles.find(p => p.name === pendingSwitch)?.displayName}"
              </div>
            </div>
            <div className="modal-body">
              {passwordError && (
                <div className="message message-error mb-3">
                  <span>⚠️</span>
                  {passwordError}
                </div>
              )}
              
              <div className="form-group">
                <label className="form-label" htmlFor="switchPassword">Password</label>
                <input
                  id="switchPassword"
                  type="password"
                  className="form-input"
                  value={switchPassword}
                  onChange={(e) => {
                    setSwitchPassword(e.target.value);
                    setPasswordError(null); // Clear error when user types
                  }}
                  placeholder="Enter profile password"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && switchPassword.trim()) {
                      handlePasswordSwitch();
                    }
                  }}
                  autoFocus
                  disabled={loading}
                />
              </div>
              
              <div className="form-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setPendingSwitch(null);
                    setSwitchPassword('');
                    setPasswordError(null);
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-success"
                  onClick={handlePasswordSwitch}
                  disabled={loading || !switchPassword.trim()}
                >
                  {loading ? 'Switching...' : 'Switch Profile'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileManagementDialog;