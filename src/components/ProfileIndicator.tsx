import React, { useState, useEffect } from 'react';
import { safeProfileAPI } from '../utils/profileAPI';

interface ProfileIndicatorProps {
  onManageProfilesClick: () => void;
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

const ProfileIndicator: React.FC<ProfileIndicatorProps> = ({ onManageProfilesClick }) => {
  const [currentProfile, setCurrentProfile] = useState<string>('Loading...');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [pendingSwitch, setPendingSwitch] = useState<string | null>(null);
  const [switchPassword, setSwitchPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCurrentProfile();
    loadAllProfiles();
  }, []);

  const loadCurrentProfile = async () => {
    try {
      const result = await safeProfileAPI.getCurrentProfile();
      setCurrentProfile(result.profileName || 'Unknown');
    } catch (error) {
      console.error('Failed to load current profile:', error);
      setCurrentProfile('Unknown');
    }
  };

  const loadAllProfiles = async () => {
    try {
      const result = await safeProfileAPI.listProfiles();
      setProfiles(result.profiles);
    } catch (error) {
      console.error('Failed to load profiles:', error);
    }
  };

  const handleProfileSwitch = async (profileName: string) => {
    const profile = profiles.find(p => p.name === profileName);
    
    if (profile?.hasPassword) {
      setIsDropdownOpen(false);
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
      setCurrentProfile(profileName);
      setIsDropdownOpen(false);
      setPendingSwitch(null);
      setSwitchPassword('');
      setPasswordError(null);
      
      // Refresh the page to update all components with new profile data
      window.location.reload();
      
    } catch (err) {
      console.error('Failed to switch profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Handle specific error types
      if (errorMessage.includes('Invalid password')) {
        setPasswordError('Incorrect password. Please try again.');
      } else if (errorMessage.includes('not found')) {
        alert('Profile not found. Please refresh and try again.');
      } else if (errorMessage.includes('password')) {
        setPasswordError('Password verification failed. Please check your password.');
      } else {
        alert(`Failed to switch profile: ${errorMessage}`);
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

  const styles = {
    profileIndicator: {
      position: 'relative' as const,
      zIndex: 1000,
    },
    profileDropdown: {
      position: 'relative' as const,
      display: 'inline-block',
    },
    profileButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      background: '#2a2a2a',
      border: '1px solid #4a4a4a',
      borderRadius: '6px',
      color: '#ffffff',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'all 0.2s ease',
    },
    profileIcon: {
      fontSize: '16px',
    },
    profileName: {
      fontWeight: 500,
      maxWidth: '120px',
      whiteSpace: 'nowrap' as const,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    dropdownArrow: {
      fontSize: '10px',
      opacity: 0.7,
      transition: 'transform 0.2s ease',
    },
    profileDropdownMenu: {
      position: 'absolute' as const,
      top: '100%',
      right: 0,
      minWidth: '220px',
      background: '#2a2a2a',
      border: '1px solid #4a4a4a',
      borderRadius: '6px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      padding: '4px 0',
      marginTop: '4px',
      zIndex: 1100,
    },
    dropdownHeader: {
      padding: '8px 12px',
      fontSize: '12px',
      fontWeight: 600,
      color: '#888',
      borderBottom: '1px solid #3a3a3a',
      marginBottom: '4px',
    },
    dropdownItem: {
      width: '100%',
      padding: '8px 12px',
      background: 'none',
      border: 'none',
      color: '#ffffff',
      textAlign: 'left' as const,
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'background-color 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dropdownItemActive: {
      background: '#1e3a8a',
    },
    dropdownItemDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
    profileItemName: {
      fontWeight: 500,
    },
    activeIndicator: {
      color: '#10b981',
      fontWeight: 'bold',
    },
    profileDescription: {
      fontSize: '12px',
      opacity: 0.7,
      marginTop: '2px',
    },
    dropdownDivider: {
      height: '1px',
      background: '#3a3a3a',
      margin: '4px 0',
    },
    manageProfiles: {
      color: '#60a5fa',
      fontWeight: 500,
    },
    manageIcon: {
      marginRight: '8px',
    },
    protectedIcon: {
      fontSize: '12px',
      marginLeft: '4px',
      color: '#f59e0b',
    },
    // Password Modal Styles
    modalOverlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.90)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000, // Very high z-index to appear above everything
    },
    modalContent: {
      background: '#2a2a2a',
      border: '2px solid #4a4a4a',
      borderRadius: '12px',
      padding: '24px',
      maxWidth: '400px',
      width: '90%',
      boxShadow: '0 25px 70px rgba(0, 0, 0, 0.9)',
    },
    modalHeader: {
      textAlign: 'center' as const,
      marginBottom: '20px',
    },
    modalTitle: {
      color: '#ffffff',
      fontSize: '20px',
      fontWeight: 600,
      marginBottom: '8px',
    },
    modalSubtitle: {
      color: '#888',
      fontSize: '14px',
    },
    formGroup: {
      marginBottom: '20px',
    },
    formLabel: {
      display: 'block',
      color: '#ffffff',
      fontSize: '14px',
      fontWeight: 500,
      marginBottom: '8px',
    },
    formInput: {
      width: '100%',
      padding: '12px',
      background: '#1a1a1a',
      border: '1px solid #4a4a4a',
      borderRadius: '6px',
      color: '#ffffff',
      fontSize: '14px',
      outline: 'none',
    },
    formActions: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end',
    },
    button: {
      padding: '10px 20px',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    buttonSecondary: {
      background: '#4a4a4a',
      color: '#ffffff',
    },
    buttonPrimary: {
      background: '#10b981',
      color: '#ffffff',
    },
    errorMessage: {
      background: '#dc2626',
      color: '#ffffff',
      padding: '12px',
      borderRadius: '6px',
      marginBottom: '16px',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
  };

  return (
    <>
      <div style={styles.profileIndicator}>
        <div style={styles.profileDropdown}>
          <button 
            style={{
              ...styles.profileButton,
              ...(isDropdownOpen ? { background: '#3a3a3a', borderColor: '#5a5a5a' } : {})
            }}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            title="Current Profile - Click to switch"
            onMouseEnter={(e) => {
              if (!isDropdownOpen) {
                e.currentTarget.style.background = '#3a3a3a';
                e.currentTarget.style.borderColor = '#5a5a5a';
              }
            }}
            onMouseLeave={(e) => {
              if (!isDropdownOpen) {
                e.currentTarget.style.background = '#2a2a2a';
                e.currentTarget.style.borderColor = '#4a4a4a';
              }
            }}
          >
            <span style={styles.profileIcon}>👤</span>
            <span style={styles.profileName}>{currentProfile}</span>
            <span style={styles.dropdownArrow}>{isDropdownOpen ? '▲' : '▼'}</span>
          </button>

          {isDropdownOpen && (
            <div style={styles.profileDropdownMenu}>
              <div style={styles.dropdownHeader}>Switch Profile</div>
              
              {profiles.map((profile) => (
                <button
                  key={profile.name}
                  style={{
                    ...styles.dropdownItem,
                    ...(profile.isActive ? styles.dropdownItemActive : {}),
                    ...(profile.isActive ? styles.dropdownItemDisabled : {})
                  }}
                  onClick={() => handleProfileSwitch(profile.name)}
                  disabled={profile.isActive}
                  onMouseEnter={(e) => {
                    if (!profile.isActive) {
                      e.currentTarget.style.background = '#3a3a3a';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!profile.isActive) {
                      e.currentTarget.style.background = profile.isActive ? '#1e3a8a' : 'none';
                    }
                  }}
                >
                  <div>
                    <span style={styles.profileItemName}>
                      {profile.displayName || profile.name}
                      {profile.hasPassword && <span style={styles.protectedIcon}>🔒</span>}
                    </span>
                    {profile.description && (
                      <div style={styles.profileDescription}>{profile.description}</div>
                    )}
                  </div>
                  {profile.isActive && <span style={styles.activeIndicator}>✓</span>}
                </button>
              ))}
              
              <div style={styles.dropdownDivider}></div>
              
              <button
                style={{
                  ...styles.dropdownItem,
                  ...styles.manageProfiles
                }}
                onClick={() => {
                  setIsDropdownOpen(false);
                  onManageProfilesClick();
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1e3a8a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                }}
              >
                <span style={styles.manageIcon}>⚙️</span>
                Manage Profiles...
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Password Modal for Profile Switching */}
      {pendingSwitch && (
        <div style={styles.modalOverlay} onClick={(e) => {
          if (e.target === e.currentTarget) {
            setPendingSwitch(null);
            setSwitchPassword('');
            setPasswordError(null);
          }
        }}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>🔒 Enter Password</h3>
              <div style={styles.modalSubtitle}>
                Profile: "{profiles.find(p => p.name === pendingSwitch)?.displayName}"
              </div>
            </div>
            
            {passwordError && (
              <div style={styles.errorMessage}>
                <span>⚠️</span>
                {passwordError}
              </div>
            )}
            
            <div style={styles.formGroup}>
              <label style={styles.formLabel} htmlFor="switchPassword">Password</label>
              <input
                id="switchPassword"
                type="password"
                style={styles.formInput}
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
            
            <div style={styles.formActions}>
              <button
                style={{
                  ...styles.button,
                  ...styles.buttonSecondary
                }}
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
                style={{
                  ...styles.button,
                  ...styles.buttonPrimary,
                  ...(loading || !switchPassword.trim() ? { opacity: 0.6, cursor: 'not-allowed' } : {})
                }}
                onClick={handlePasswordSwitch}
                disabled={loading || !switchPassword.trim()}
              >
                {loading ? 'Switching...' : 'Switch Profile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileIndicator;