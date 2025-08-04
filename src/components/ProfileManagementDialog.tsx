// Enhanced ProfileManagementDialog.tsx with Password Protection
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
      return;
    }

    await performSwitch(profileName);
  };

  const performSwitch = async (profileName: string, password?: string) => {
    try {
      setLoading(true);
      await safeProfileAPI.switchTo(profileName, password);
      await loadProfiles();
      onProfileChanged();
      setError(null);
      setPendingSwitch(null);
      setSwitchPassword('');
      // Close dialog and refresh page
      onClose();
      window.location.reload();
    } catch (err) {
      console.error('Failed to switch profile:', err);
      setError('Failed to switch profile. Check password if protected.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSwitch = async () => {
    if (!switchPassword && profiles.find(p => p.name === pendingSwitch)?.hasPassword) {
      setError('Password is required for this profile');
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
    onClose();
  };

  if (!isOpen) return null;

  const styles = {
    dialogOverlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
    },
    dialogContent: {
      background: '#1a1a1a',
      borderRadius: '8px',
      width: '90%',
      maxWidth: '600px',
      maxHeight: '80vh',
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
    },
    dialogHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px',
      borderBottom: '1px solid #333',
    },
    dialogTitle: {
      margin: 0,
      color: '#ffffff',
      fontSize: '24px',
    },
    closeButton: {
      background: 'none',
      border: 'none',
      color: '#888',
      fontSize: '24px',
      cursor: 'pointer',
      padding: 0,
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '4px',
    },
    dialogBody: {
      padding: '20px',
      maxHeight: '60vh',
      overflowY: 'auto' as const,
    },
    errorMessage: {
      background: '#dc2626',
      color: 'white',
      padding: '12px',
      borderRadius: '6px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    loading: {
      textAlign: 'center' as const,
      color: '#888',
      padding: '20px',
    },
    section: {
      marginBottom: '32px',
    },
    sectionTitle: {
      margin: '0 0 16px 0',
      color: '#ffffff',
      fontSize: '18px',
    },
    profilesList: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px',
    },
    profileItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px',
      background: '#2a2a2a',
      border: '1px solid #3a3a3a',
      borderRadius: '6px',
    },
    profileItemActive: {
      borderColor: '#1e40af',
      background: '#1e3a8a',
    },
    profileInfo: {
      flex: 1,
    },
    profileHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '4px',
    },
    profileName: {
      color: '#ffffff',
      fontWeight: 600,
      fontSize: '16px',
    },
    activeBadge: {
      background: '#10b981',
      color: 'white',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 500,
    },
    passwordBadge: {
      background: '#f59e0b',
      color: 'white',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 500,
    },
    profileDescription: {
      color: '#888',
      fontSize: '14px',
      marginBottom: '4px',
    },
    profileDate: {
      color: '#666',
      fontSize: '12px',
    },
    profileActions: {
      display: 'flex',
      gap: '8px',
    },
    actionButton: {
      padding: '6px 12px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 500,
    },
    switchButton: {
      background: '#1e40af',
      color: 'white',
    },
    deleteButton: {
      background: '#dc2626',
      color: 'white',
    },
    createNewButton: {
      background: '#10b981',
      color: 'white',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: 500,
    },
    createForm: {
      background: '#2a2a2a',
      padding: '20px',
      borderRadius: '6px',
      border: '1px solid #3a3a3a',
    },
    formGroup: {
      marginBottom: '16px',
    },
    formLabel: {
      display: 'block',
      marginBottom: '6px',
      color: '#ffffff',
      fontWeight: 500,
    },
    formInput: {
      width: '100%',
      padding: '10px',
      background: '#1a1a1a',
      border: '1px solid #4a4a4a',
      borderRadius: '4px',
      color: '#ffffff',
      fontSize: '14px',
      boxSizing: 'border-box' as const,
    },
    checkboxGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '16px',
    },
    checkbox: {
      width: '16px',
      height: '16px',
    },
    checkboxLabel: {
      color: '#ffffff',
      fontSize: '14px',
      cursor: 'pointer',
    },
    formActions: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end',
    },
    cancelButton: {
      padding: '10px 20px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 500,
      background: '#4a4a4a',
      color: 'white',
    },
    createButton: {
      padding: '10px 20px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 500,
      background: '#10b981',
      color: 'white',
    },
    passwordModal: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2100,
    },
    passwordModalContent: {
      background: '#1a1a1a',
      borderRadius: '8px',
      padding: '24px',
      width: '90%',
      maxWidth: '400px',
      border: '1px solid #3a3a3a',
    },
    passwordModalTitle: {
      margin: '0 0 16px 0',
      color: '#ffffff',
      fontSize: '18px',
      textAlign: 'center' as const,
    },
    passwordModalActions: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end',
      marginTop: '16px',
    },
  };

  return (
    <div style={styles.dialogOverlay}>
      <div style={styles.dialogContent}>
        <div style={styles.dialogHeader}>
          <h2 style={styles.dialogTitle}>Manage Profiles</h2>
          <button 
            style={styles.closeButton} 
            onClick={handleClose}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.background = '#333';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#888';
              e.currentTarget.style.background = 'none';
            }}
          >
            ×
          </button>
        </div>

        <div style={styles.dialogBody}>
          {error && (
            <div style={styles.errorMessage}>
              <span>⚠️</span>
              {error}
            </div>
          )}

          {/* Existing Profiles */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Existing Profiles</h3>
            {loading && profiles.length === 0 ? (
              <div style={styles.loading}>Loading profiles...</div>
            ) : (
              <div style={styles.profilesList}>
                {profiles.map((profile) => (
                  <div 
                    key={profile.name} 
                    style={{
                      ...styles.profileItem,
                      ...(profile.isActive ? styles.profileItemActive : {})
                    }}
                  >
                    <div style={styles.profileInfo}>
                      <div style={styles.profileHeader}>
                        <span style={styles.profileName}>{profile.displayName || profile.name}</span>
                        {profile.isActive && <span style={styles.activeBadge}>Active</span>}
                        {profile.hasPassword && <span style={styles.passwordBadge}>🔒 Protected</span>}
                      </div>
                      {profile.description && (
                        <div style={styles.profileDescription}>{profile.description}</div>
                      )}
                      <div style={styles.profileDate}>
                        Created: {new Date(profile.created).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={styles.profileActions}>
                      {!profile.isActive && (
                        <button
                          style={{...styles.actionButton, ...styles.switchButton}}
                          onClick={() => handleSwitchProfile(profile.name)}
                          disabled={loading}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#1e3a8a';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#1e40af';
                          }}
                        >
                          Switch
                        </button>
                      )}
                      {!profile.isActive && (
                        <button
                          style={{...styles.actionButton, ...styles.deleteButton}}
                          onClick={() => handleDeleteProfile(profile.name)}
                          disabled={loading}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#b91c1c';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#dc2626';
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create New Profile */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Create New Profile</h3>
            {!isCreating ? (
              <button
                style={styles.createNewButton}
                onClick={() => setIsCreating(true)}
                disabled={loading}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#059669';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#10b981';
                }}
              >
                + Create New Profile
              </button>
            ) : (
              <div style={styles.createForm}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel} htmlFor="profileName">Profile Name *</label>
                  <input
                    id="profileName"
                    type="text"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    placeholder="e.g., Personal, Business, Family"
                    maxLength={50}
                    disabled={loading}
                    style={{
                      ...styles.formInput,
                      ...(loading ? { opacity: 0.5 } : {})
                    }}
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.formLabel} htmlFor="profileDescription">Description (Optional)</label>
                  <input
                    id="profileDescription"
                    type="text"
                    value={newProfileDescription}
                    onChange={(e) => setNewProfileDescription(e.target.value)}
                    placeholder="Brief description of this profile"
                    maxLength={200}
                    disabled={loading}
                    style={{
                      ...styles.formInput,
                      ...(loading ? { opacity: 0.5 } : {})
                    }}
                  />
                </div>

                <div style={styles.checkboxGroup}>
                  <input
                    id="usePassword"
                    type="checkbox"
                    checked={usePassword}
                    onChange={(e) => setUsePassword(e.target.checked)}
                    disabled={loading}
                    style={styles.checkbox}
                  />
                  <label 
                    htmlFor="usePassword" 
                    style={styles.checkboxLabel}
                    onClick={() => !loading && setUsePassword(!usePassword)}
                  >
                    🔒 Password protect this profile
                  </label>
                </div>

                {usePassword && (
                  <>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel} htmlFor="profilePassword">Password *</label>
                      <input
                        id="profilePassword"
                        type="password"
                        value={newProfilePassword}
                        onChange={(e) => setNewProfilePassword(e.target.value)}
                        placeholder="Enter password (min 4 characters)"
                        disabled={loading}
                        style={{
                          ...styles.formInput,
                          ...(loading ? { opacity: 0.5 } : {})
                        }}
                      />
                    </div>
                    
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel} htmlFor="confirmPassword">Confirm Password *</label>
                      <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        disabled={loading}
                        style={{
                          ...styles.formInput,
                          ...(loading ? { opacity: 0.5 } : {})
                        }}
                      />
                    </div>
                  </>
                )}

                <div style={styles.formActions}>
                  <button
                    style={styles.cancelButton}
                    onClick={() => setIsCreating(false)}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    style={{
                      ...styles.createButton,
                      ...(loading || !newProfileName.trim() ? { opacity: 0.5, cursor: 'not-allowed' } : {})
                    }}
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

      {/* Password Modal for Profile Switching */}
      {pendingSwitch && (
        <div style={styles.passwordModal}>
          <div style={styles.passwordModalContent}>
            <h3 style={styles.passwordModalTitle}>
              Enter Password for "{profiles.find(p => p.name === pendingSwitch)?.displayName}"
            </h3>
            <div style={styles.formGroup}>
              <input
                type="password"
                value={switchPassword}
                onChange={(e) => setSwitchPassword(e.target.value)}
                placeholder="Enter profile password"
                style={styles.formInput}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePasswordSwitch();
                  }
                }}
                autoFocus
              />
            </div>
            <div style={styles.passwordModalActions}>
              <button
                style={styles.cancelButton}
                onClick={() => {
                  setPendingSwitch(null);
                  setSwitchPassword('');
                }}
              >
                Cancel
              </button>
              <button
                style={styles.createButton}
                onClick={handlePasswordSwitch}
                disabled={loading}
              >
                {loading ? 'Switching...' : 'Switch Profile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileManagementDialog;