import React, { useState } from 'react';

interface BalanceDiscrepancy {
  account_id: number;
  account_name: string;
  difference: number;
}

const BalanceIntegrityTest: React.FC = () => {
  const [discrepancies, setDiscrepancies] = useState<BalanceDiscrepancy[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runBalanceIntegrityTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    setDiscrepancies([]);

    try {
      addResult('🔍 Starting balance integrity validation test...');

      // First, check current integrity
      const initialDiscrepancies = await (window as any).electronAPI.envelopes.validateIntegrity();
      if (initialDiscrepancies.length > 0) {
        addResult(`❌ Found ${initialDiscrepancies.length} initial balance discrepancies`);
        setDiscrepancies(initialDiscrepancies);
      } else {
        addResult('✅ No initial balance discrepancies found');
      }

      // Clear any existing test data
      addResult('🧹 Clearing any existing test data...');
      const allAccounts = await (window as any).electronAPI.database.getAllAccounts();
      const testAccounts = allAccounts.filter((acc: any) => 
        acc.name.includes('Balance Test') || acc.name.includes('Updated Balance Test')
      );
      
      for (const account of testAccounts) {
        await (window as any).electronAPI.database.deleteAccount(account.id);
      }
      addResult(`Cleared ${testAccounts.length} existing test accounts`);

      // Create a new test account
      addResult('📝 Creating test account...');
      const testAccount = await (window as any).electronAPI.database.createAccount({
        name: "Balance Test Account",
        type: "checking",
        initial_balance: 1000,
        current_balance: 1000
      });
      addResult(`✅ Created account: ${testAccount.name} with $${testAccount.current_balance}`);

      // Verify envelope was created with matching balance
      const envelopes = await (window as any).electronAPI.envelopes.getByAccountId(testAccount.id);
      const unassignedEnvelope = envelopes.find((env: any) => env.name.includes('Unassigned'));
      
      if (unassignedEnvelope) {
        addResult(`✅ Unassigned envelope created: ${unassignedEnvelope.name} with $${unassignedEnvelope.current_balance}`);
        
        if (Math.abs(testAccount.current_balance - unassignedEnvelope.current_balance) < 0.01) {
          addResult('✅ Account and envelope balances match perfectly');
        } else {
          addResult(`❌ Balance mismatch: Account $${testAccount.current_balance} vs Envelope $${unassignedEnvelope.current_balance}`);
        }
      } else {
        addResult('❌ No unassigned envelope found for test account');
      }

      // Test 1: Try to update account balance without updating envelopes (should fail)
      addResult('🧪 TEST 1: Attempting account balance update without envelope adjustment (should be blocked)...');
      try {
        await (window as any).electronAPI.database.updateAccount({
          id: testAccount.id,
          current_balance: 1375.25  // This should be blocked!
        });
        addResult('❌ ERROR: Account balance update was allowed when it should have been blocked!');
      } catch (error) {
        addResult('✅ SUCCESS: Account balance update correctly blocked!');
        addResult(`📋 Error message: ${String(error).substring(0, 200)}...`);
      }

      // Test 2: Update envelope first, then account (should work)
      addResult('🧪 TEST 2: First updating envelope, then account balance (should work)...');
      
      // Step 1: Update the unassigned envelope balance
      const updatedEnvelope = await (window as any).electronAPI.envelopes.update(unassignedEnvelope.id, {
        current_balance: 1375.25
      });
      addResult(`✅ Updated envelope balance to $${updatedEnvelope.current_balance}`);
      
      // Step 2: Now update account balance to match
      try {
        const updatedAccount = await (window as any).electronAPI.database.updateAccount({
          id: testAccount.id,
          name: "Updated Balance Test Account",
          current_balance: 1375.25
        });
        addResult(`✅ Account balance update successful: ${updatedAccount.name} with $${updatedAccount.current_balance}`);
      } catch (error) {
        addResult(`❌ Account balance update failed: ${error}`);
      }

      // Test 3: Verify perfect synchronization
      addResult('🔍 TEST 3: Verifying final balance synchronization...');
      const finalAccount = await (window as any).electronAPI.database.getAccountById(testAccount.id);
      const finalEnvelopes = await (window as any).electronAPI.envelopes.getByAccountId(testAccount.id);
      const finalEnvelopeTotal = finalEnvelopes.reduce((sum: number, env: any) => sum + env.current_balance, 0);
      
      if (Math.abs(finalAccount.current_balance - finalEnvelopeTotal) < 0.01) {
        addResult('🎉 SUCCESS: Perfect balance synchronization maintained!');
        addResult(`Account: $${finalAccount.current_balance}, Envelopes Total: $${finalEnvelopeTotal}`);
      } else {
        addResult(`❌ FAIL: Balance discrepancy: Account $${finalAccount.current_balance} vs Envelopes $${finalEnvelopeTotal}`);
      }

      // Final integrity check
      addResult('🔍 Running final system-wide integrity validation...');
      const finalDiscrepancies = await (window as any).electronAPI.envelopes.validateIntegrity();
      
      if (finalDiscrepancies.length === 0) {
        addResult('🎉 FINAL RESULT: Perfect balance integrity across entire system!');
      } else {
        addResult(`❌ FINAL RESULT: ${finalDiscrepancies.length} balance discrepancies found`);
        setDiscrepancies(finalDiscrepancies);
      }

    } catch (error) {
      addResult(`❌ Test error: ${error}`);
    }

    setIsRunning(false);
  };

  const clearTestData = async () => {
    try {
      const allAccounts = await (window as any).electronAPI.database.getAllAccounts();
      const testAccounts = allAccounts.filter((acc: any) => 
        acc.name.includes('Balance Test') || acc.name.includes('Updated Balance Test')
      );
      
      for (const account of testAccounts) {
        await (window as any).electronAPI.database.deleteAccount(account.id);
      }
      
      setTestResults([]);
      setDiscrepancies([]);
      alert(`Cleared ${testAccounts.length} test accounts`);
    } catch (error) {
      alert(`Error clearing data: ${error}`);
    }
  };

  return (
    <div style={{ textAlign: 'left', maxWidth: '1000px', margin: '0 auto' }}>
      <h2>🔍 Balance Integrity Validation Test</h2>
      <p><strong>This test verifies the new validation system:</strong></p>
      <ul style={{ marginBottom: '20px', paddingLeft: '20px' }}>
        <li>✅ <strong>Blocks account updates</strong> that would create balance discrepancies</li>
        <li>✅ <strong>Requires explicit envelope updates</strong> before account balance changes</li>
        <li>✅ <strong>Maintains perfect synchronization</strong> between accounts and envelopes</li>
        <li>✅ <strong>Validates integrity</strong> across the entire system</li>
      </ul>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={runBalanceIntegrityTest}
          disabled={isRunning}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: isRunning ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {isRunning ? 'Running Validation...' : '🚀 Run Balance Validation Test'}
        </button>
        
        <button 
          onClick={clearTestData}
          disabled={isRunning}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🧹 Clear Test Data
        </button>
      </div>

      {testResults.length > 0 && (
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '4px',
          marginBottom: '20px',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          <h3>Test Results:</h3>
          {testResults.map((result, index) => (
            <div key={index} style={{ 
              marginBottom: '8px',
              padding: '4px',
              fontFamily: 'monospace',
              fontSize: '14px'
            }}>
              {result}
            </div>
          ))}
        </div>
      )}

      {discrepancies.length > 0 && (
        <div style={{ 
          backgroundColor: '#f8d7da', 
          padding: '20px', 
          borderRadius: '4px',
          border: '1px solid #f5c6cb'
        }}>
          <h3>🚨 Balance Discrepancies Found:</h3>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            backgroundColor: 'white'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ border: '1px solid #dee2e6', padding: '8px' }}>Account ID</th>
                <th style={{ border: '1px solid #dee2e6', padding: '8px' }}>Account Name</th>
                <th style={{ border: '1px solid #dee2e6', padding: '8px' }}>Difference</th>
              </tr>
            </thead>
            <tbody>
              {discrepancies.map((discrepancy, index) => (
                <tr key={index}>
                  <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>{discrepancy.account_id}</td>
                  <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>{discrepancy.account_name}</td>
                  <td style={{ 
                    border: '1px solid #dee2e6', 
                    padding: '8px',
                    color: Math.abs(discrepancy.difference) > 0.01 ? '#dc3545' : '#28a745'
                  }}>
                    ${discrepancy.difference.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BalanceIntegrityTest;