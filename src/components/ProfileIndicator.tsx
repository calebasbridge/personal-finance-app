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
    try {
      await safeProfileAPI.switchTo(profileName);
      setCurrentProfile(profileName);
      setIsDropdownOpen(false);
      // Refresh the page to update all components with new profile data
      window.location.reload();
    } catch (error) {
      console.error('Failed to switch profile:', error);
      alert('Failed to switch profile. Please try again.');
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
  };

  return (
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
                  <span style={styles.profileItemName}>{profile.displayName || profile.name}</span>
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
  );
};

export default ProfileIndicator;