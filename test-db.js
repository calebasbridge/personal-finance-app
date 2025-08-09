const Database = require('better-sqlite3');
const path = require('path');

// Open the Caleb Test Profile database
const dbPath = path.join('C:\\Users\\caleb\\OneDrive\\Documents\\PersonalFinanceApp\\profiles', 'Caleb Te_t Profile 1.db');

console.log('Opening database:', dbPath);

try {
  const db = new Database(dbPath, { readonly: true });
  
  // Check what tables exist
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('\nTables in database:', tables.map(t => t.name));
  
  // Check accounts
  const accountCount = db.prepare("SELECT COUNT(*) as count FROM accounts").get();
  console.log('\nNumber of accounts:', accountCount.count);
  
  if (accountCount.count > 0) {
    const accounts = db.prepare("SELECT * FROM accounts LIMIT 5").all();
    console.log('\nSample accounts:', accounts);
  }
  
  // Check envelopes
  const envelopeCount = db.prepare("SELECT COUNT(*) as count FROM envelopes").get();
  console.log('\nNumber of envelopes:', envelopeCount.count);
  
  if (envelopeCount.count > 0) {
    const envelopes = db.prepare("SELECT * FROM envelopes LIMIT 5").all();
    console.log('\nSample envelopes:', envelopes);
  }
  
  db.close();
} catch (error) {
  console.error('Error:', error);
}
