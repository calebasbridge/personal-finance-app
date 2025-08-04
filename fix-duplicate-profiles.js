// Fix for duplicate Main profiles issue
// This script will clean up the duplicate profiles

const fs = require('fs');
const path = require('path');
const os = require('os');

function fixDuplicateProfiles() {
  try {
    // Path to profile metadata
    const userDocuments = path.join(os.homedir(), 'Documents');
    const metadataFile = path.join(userDocuments, 'PersonalFinanceApp', 'profile-metadata.json');
    
    if (!fs.existsSync(metadataFile)) {
      console.log('No profile metadata found - nothing to fix');
      return;
    }
    
    // Read current metadata
    const metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
    console.log('Current profiles:', metadata.profiles.map(p => p.displayName || p.name));
    
    // Find duplicate Main profiles
    const mainProfiles = metadata.profiles.filter(p => 
      (p.displayName && p.displayName === 'Main') || 
      p.name.toLowerCase().includes('main')
    );
    
    if (mainProfiles.length <= 1) {
      console.log('No duplicate Main profiles found');
      return;
    }
    
    console.log(`Found ${mainProfiles.length} Main profiles - cleaning up...`);
    
    // Keep the first Main profile (usually the oldest/original), remove others
    const keepProfile = mainProfiles[0];
    const removeProfiles = mainProfiles.slice(1);
    
    console.log(`Keeping profile: ${keepProfile.displayName || keepProfile.name}`);
    console.log(`Removing profiles: ${removeProfiles.map(p => p.displayName || p.name).join(', ')}`);
    
    // Remove duplicate profiles from metadata
    metadata.profiles = metadata.profiles.filter(p => 
      !removeProfiles.some(rp => rp.name === p.name)
    );
    
    // Clean up database files for removed profiles
    const profilesDir = path.join(userDocuments, 'PersonalFinanceApp', 'profiles');
    if (fs.existsSync(profilesDir)) {
      removeProfiles.forEach(profile => {
        const dbFile = path.join(profilesDir, `${profile.name}.db`);
        if (fs.existsSync(dbFile)) {
          fs.unlinkSync(dbFile);
          console.log(`Removed database file: ${profile.name}.db`);
        }
      });
    }
    
    // Ensure the current profile is still valid
    if (metadata.currentProfile && removeProfiles.some(rp => rp.name === metadata.currentProfile)) {
      metadata.currentProfile = keepProfile.name;
      console.log(`Updated current profile to: ${keepProfile.displayName || keepProfile.name}`);
    }
    
    // Update metadata
    fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
    console.log(`✅ Fixed duplicate profiles - kept: ${keepProfile.displayName || keepProfile.name}`);
    console.log('Remaining profiles:', metadata.profiles.map(p => p.displayName || p.name));
    
  } catch (error) {
    console.error('Error fixing duplicate profiles:', error);
  }
}

console.log('🔧 Starting duplicate profile cleanup...');
fixDuplicateProfiles();
console.log('🏁 Duplicate profile cleanup complete!');
