import React, { useState, useEffect } from 'react';
import { 
  Envelope, 
  Account, 
  CreateEnvelopeData, 
  EnvelopeWithAccount,
  AccountWithEnvelopes 
} from '../database/types';

interface EnvelopeTestProps {
  onNavigateBack: () => void;
}

export const EnvelopeTest: React.FC<EnvelopeTestProps> = ({ onNavigateBack }) => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);

  const addResult = (message: string, success: boolean = true) => {
    const prefix = success ? '✅' : '❌';
    setTestResults(prev => [...prev, `${prefix} ${message}`]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const loadData = async () => {
    try {
      const allAccounts = await (window as any).electronAPI.accounts.getAll();
      const allEnvelopes = await (window as any).electronAPI.envelopes.getAll();
      setAccounts(allAccounts);
      setEnvelopes(allEnvelopes);
    } catch (error) {
      addResult(`Failed to load data: ${error}`, false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const testUnassignedEnvelopes = async () => {
    setIsRunning(true);
    clearResults();

    try {
      addResult('🧪 Testing Automatic Unassigned Envelope System...');

      // Test 1: Create a new account and verify unassigned envelope is auto-created
      const newAccountData = {
        name: 'Test Auto-Unassigned Account',
        type: 'checking' as const,
        initial_balance: 1500.00,
        current_balance: 1500.00
      };

      const newAccount = await (window as any).electronAPI.accounts.create(newAccountData);
      if (!newAccount) {
        addResult('Failed to create test account', false);
        return;
      }
      addResult(`Created new account: ${newAccount.name} (ID: ${newAccount.id})`);

      // Test 2: Check that unassigned envelope was automatically created
      const accountEnvelopes = await (window as any).electronAPI.envelopes.getByAccountId(newAccount.id);
      const unassignedEnvelope = accountEnvelopes.find((env: Envelope) => 
        env.name === `Unassigned ${newAccount.name}`
      );

      if (!unassignedEnvelope) {
        addResult('❌ Unassigned envelope was NOT automatically created', false);
        return;
      }
      
      addResult(`Auto-created unassigned envelope: ${unassignedEnvelope.name}`);
      addResult(`Unassigned envelope balance: $${unassignedEnvelope.current_balance}`);
      addResult(`Account balance: $${newAccount.current_balance}`);
      
      if (unassignedEnvelope.current_balance === newAccount.current_balance) {
        addResult('✅ Account and unassigned envelope balances match perfectly!');
      } else {
        addResult(`❌ Balance mismatch: Account ${newAccount.current_balance} vs Envelope ${unassignedEnvelope.current_balance}`, false);
      }

      // Test 3: Create additional envelope and transfer from unassigned
      const groceriesEnvelopeData: CreateEnvelopeData = {
        name: 'Groceries',
        account_id: newAccount.id,
        type: 'cash',
        current_balance: 0, // Start with zero, we'll transfer from unassigned
        spending_limit: 400.00,
        description: 'Groceries envelope'
      };

      const groceriesEnvelope = await (window as any).electronAPI.envelopes.create(groceriesEnvelopeData);
      if (!groceriesEnvelope) {
        addResult('Failed to create groceries envelope', false);
        return;
      }
      addResult(`Created groceries envelope: ${groceriesEnvelope.name}`);

      // Test 4: Transfer from unassigned to groceries (simulating allocation)
      const transferAmount = 300.00;
      const transferData = {
        from_envelope_id: unassignedEnvelope.id,
        to_envelope_id: groceriesEnvelope.id,
        amount: transferAmount,
        date: new Date().toISOString(),
        description: 'Allocating funds from unassigned to groceries'
      };

      const transfer = await (window as any).electronAPI.envelopes.transfer(transferData);
      if (!transfer) {
        addResult('Failed to transfer from unassigned to groceries', false);
        return;
      }
      addResult(`Transferred $${transferAmount} from unassigned to groceries`);

      // Test 5: Verify balances after transfer
      const updatedUnassigned = await (window as any).electronAPI.envelopes.getById(unassignedEnvelope.id);
      const updatedGroceries = await (window as any).electronAPI.envelopes.getById(groceriesEnvelope.id);
      
      if (!updatedUnassigned || !updatedGroceries) {
        addResult('Failed to retrieve updated envelope balances', false);
        return;
      }

      addResult(`After allocation - Unassigned: $${updatedUnassigned.current_balance}, Groceries: $${updatedGroceries.current_balance}`);
      
      const expectedUnassigned = 1500 - transferAmount;
      if (updatedUnassigned.current_balance === expectedUnassigned && updatedGroceries.current_balance === transferAmount) {
        addResult('✅ Allocation transfer worked perfectly!');
      } else {
        addResult(`❌ Allocation transfer failed - Expected Unassigned: ${expectedUnassigned}, Got: ${updatedUnassigned.current_balance}`, false);
      }

      // Test 6: Verify account-envelope balance integrity
      const accountWithEnvelopes = await (window as any).electronAPI.envelopes.getAccountWithEnvelopes(newAccount.id);
      if (!accountWithEnvelopes) {
        addResult('Failed to get account with envelopes', false);
        return;
      }

      addResult(`Account total: $${accountWithEnvelopes.current_balance}, Envelope total: $${accountWithEnvelopes.envelope_total}`);
      
      if (accountWithEnvelopes.balance_difference === 0) {
        addResult('🎉 Perfect balance integrity - No unallocated money!');
      } else {
        addResult(`❌ Balance discrepancy: $${accountWithEnvelopes.balance_difference}`, false);
      }

      // Test 7: Test credit card account (debt envelope)
      const creditCardData = {
        name: 'Test Credit Card',
        type: 'credit_card' as const,
        initial_balance: -250.00, // Negative balance for credit card debt
        current_balance: -250.00
      };

      const creditAccount = await (window as any).electronAPI.accounts.create(creditCardData);
      if (!creditAccount) {
        addResult('Failed to create credit card account', false);
        return;
      }
      addResult(`Created credit card account: ${creditAccount.name}`);

      // Check for auto-created debt unassigned envelope
      const creditEnvelopes = await (window as any).electronAPI.envelopes.getByAccountId(creditAccount.id);
      const unassignedDebtEnvelope = creditEnvelopes.find((env: Envelope) => 
        env.name === `Unassigned ${creditAccount.name}` && env.type === 'debt'
      );

      if (!unassignedDebtEnvelope) {
        addResult('❌ Unassigned debt envelope was NOT automatically created', false);
        return;
      }

      addResult(`Auto-created unassigned debt envelope: ${unassignedDebtEnvelope.name}`);
      addResult(`Debt envelope balance: $${unassignedDebtEnvelope.current_balance} (type: ${unassignedDebtEnvelope.type})`);

      if (unassignedDebtEnvelope.current_balance === creditAccount.current_balance) {
        addResult('✅ Credit card account and debt envelope balances match!');
      } else {
        addResult(`❌ Credit card balance mismatch`, false);
      }

      addResult('🎉 Automatic unassigned envelope system tests completed!');

      // Refresh data
      await loadData();

    } catch (error) {
      addResult(`Test failed with error: ${error}`, false);
    } finally {
      setIsRunning(false);
    }
  };

  const createMissingUnassignedEnvelopes = async () => {
    try {
      addResult('🔧 Creating missing unassigned envelopes for existing accounts...');
      const result = await (window as any).electronAPI.accounts.createMissingUnassignedEnvelopes();
      
      addResult(`Created ${result.created} unassigned envelopes`);
      
      if (result.errors.length > 0) {
        result.errors.forEach((error: string) => {
          addResult(`Error: ${error}`, false);
        });
      }

      await loadData();
    } catch (error) {
      addResult(`Failed to create missing unassigned envelopes: ${error}`, false);
    }
  };

  const runEnvelopeTests = async () => {
    setIsRunning(true);
    clearResults();

    try {
      addResult('🧪 Starting Basic Envelope System Tests...');

      // Test 1: Create test account if needed
      let testAccount = accounts.find(acc => acc.name === 'Test Envelope Account');
      if (!testAccount) {
        const accountData = {
          name: 'Test Envelope Account',
          type: 'checking' as const,
          initial_balance: 1000.00,
          current_balance: 1000.00
        };
        testAccount = await (window as any).electronAPI.accounts.create(accountData);
        if (!testAccount) {
          addResult('Failed to create test account', false);
          return;
        }
        addResult(`Created test account: ${testAccount.name} (ID: ${testAccount.id})`);
      } else {
        addResult(`Using existing test account: ${testAccount.name} (ID: ${testAccount.id})`);
      }

      // Test 2: Create cash envelope
      const cashEnvelopeData: CreateEnvelopeData = {
        name: 'Test Groceries',
        account_id: testAccount.id,
        type: 'cash',
        current_balance: 300.00,
        spending_limit: 400.00,
        description: 'Test cash envelope for groceries'
      };

      const cashEnvelope = await (window as any).electronAPI.envelopes.create(cashEnvelopeData);
      if (!cashEnvelope) {
        addResult('Failed to create cash envelope', false);
        return;
      }
      addResult(`Created cash envelope: ${cashEnvelope.name} (Balance: $${cashEnvelope.current_balance})`);

      // Test 3: Create debt envelope
      const debtEnvelopeData: CreateEnvelopeData = {
        name: 'Test Credit Card Groceries',
        account_id: testAccount.id,
        type: 'debt',
        current_balance: 150.00,
        description: 'Test debt envelope for credit card groceries'
      };

      const debtEnvelope = await (window as any).electronAPI.envelopes.create(debtEnvelopeData);
      if (!debtEnvelope) {
        addResult('Failed to create debt envelope', false);
        return;
      }
      addResult(`Created debt envelope: ${debtEnvelope.name} (Balance: $${debtEnvelope.current_balance})`);

      // Test 4: Get envelopes by account
      const accountEnvelopes = await (window as any).electronAPI.envelopes.getByAccountId(testAccount.id);
      addResult(`Found ${accountEnvelopes.length} envelopes for account ${testAccount.name}`);

      // Test 5: Get envelopes by type
      const cashEnvelopes = await (window as any).electronAPI.envelopes.getByType('cash');
      const debtEnvelopes = await (window as any).electronAPI.envelopes.getByType('debt');
      addResult(`Found ${cashEnvelopes.length} cash envelopes and ${debtEnvelopes.length} debt envelopes`);

      // Test 6: Update envelope
      const updatedEnvelope = await (window as any).electronAPI.envelopes.update(cashEnvelope.id, {
        current_balance: 350.00,
        description: 'Updated test cash envelope'
      });
      if (!updatedEnvelope) {
        addResult('Failed to update envelope', false);
        return;
      }
      addResult(`Updated envelope balance from $${cashEnvelope.current_balance} to $${updatedEnvelope.current_balance}`);

      // Test 7: Create second cash envelope for transfer test
      const cashEnvelope2Data: CreateEnvelopeData = {
        name: 'Test Gas',
        account_id: testAccount.id,
        type: 'cash',
        current_balance: 100.00,
        spending_limit: 200.00,
        description: 'Test cash envelope for gas'
      };

      const gasEnvelope = await (window as any).electronAPI.envelopes.create(cashEnvelope2Data);
      if (!gasEnvelope) {
        addResult('Failed to create gas envelope', false);
        return;
      }
      addResult(`Created second cash envelope: ${gasEnvelope.name} (Balance: $${gasEnvelope.current_balance})`);

      // Test 8: Transfer between envelopes
      const transferData = {
        from_envelope_id: updatedEnvelope.id,
        to_envelope_id: gasEnvelope.id,
        amount: 50.00,
        date: new Date().toISOString(),
        description: 'Test transfer from groceries to gas'
      };

      const transfer = await (window as any).electronAPI.envelopes.transfer(transferData);
      if (!transfer) {
        addResult('Failed to create transfer', false);
        return;
      }
      addResult(`Transferred $${transfer.amount} from ${updatedEnvelope.name} to ${gasEnvelope.name}`);

      // Test 9: Verify balances after transfer
      const updatedGroceries = await (window as any).electronAPI.envelopes.getById(updatedEnvelope.id);
      const updatedGas = await (window as any).electronAPI.envelopes.getById(gasEnvelope.id);
      if (!updatedGroceries || !updatedGas) {
        addResult('Failed to retrieve updated envelope balances', false);
        return;
      }
      addResult(`After transfer - Groceries: $${updatedGroceries.current_balance}, Gas: $${updatedGas.current_balance}`);

      // Test 10: Get transfer history
      const transferHistory = await (window as any).electronAPI.envelopes.getTransferHistory();
      addResult(`Found ${transferHistory.length} transfers in history`);

      // Test 11: Get envelopes with account info
      const envelopesWithAccount = await (window as any).electronAPI.envelopes.getWithAccount();
      addResult(`Retrieved ${envelopesWithAccount.length} envelopes with account information`);

      // Test 12: Get account with envelopes
      const accountWithEnvelopes = await (window as any).electronAPI.envelopes.getAccountWithEnvelopes(testAccount.id);
      if (!accountWithEnvelopes) {
        addResult('Failed to get account with envelopes', false);
        return;
      }
      addResult(`Account ${accountWithEnvelopes.name} has ${accountWithEnvelopes.envelopes.length} envelopes`);
      addResult(`Account balance: $${accountWithEnvelopes.current_balance}, Envelope total: $${accountWithEnvelopes.envelope_total}`);
      addResult(`Balance difference: $${accountWithEnvelopes.balance_difference} ${accountWithEnvelopes.balance_difference === 0 ? '(Perfect!)' : '(Needs adjustment)'}`);

      // Test 13: Validate account-envelope integrity
      const integrityIssues = await (window as any).electronAPI.envelopes.validateIntegrity();
      if (integrityIssues.length === 0) {
        addResult('Account-envelope integrity validation passed - all accounts balanced!');
      } else {
        addResult(`Found ${integrityIssues.length} account-envelope balance discrepancies`, false);
        integrityIssues.forEach((issue: any) => {
          addResult(`  ${issue.account_name}: $${issue.difference} difference`, false);
        });
      }

      // Test 14: Test error handling - insufficient funds transfer
      try {
        await (window as any).electronAPI.envelopes.transfer({
          from_envelope_id: updatedGas.id,
          to_envelope_id: updatedGroceries.id,
          amount: 999999.00,
          date: new Date().toISOString(),
          description: 'Should fail - insufficient funds'
        });
        addResult('Transfer should have failed but succeeded', false);
      } catch (error) {
        addResult('Error handling test passed - insufficient funds transfer correctly rejected');
      }

      addResult('🎉 All basic envelope system tests completed!');
      
      // Refresh data
      await loadData();

    } catch (error) {
      addResult(`Test failed with error: ${error}`, false);
    } finally {
      setIsRunning(false);
    }
  };

  const cleanupTestData = async () => {
    try {
      // Delete test envelopes
      const allEnvelopes = await (window as any).electronAPI.envelopes.getAll();
      const testEnvelopes = allEnvelopes.filter((env: Envelope) => env.name.startsWith('Test ') || env.name.startsWith('Groceries'));
      
      for (const envelope of testEnvelopes) {
        await (window as any).electronAPI.envelopes.delete(envelope.id);
      }

      // Delete test accounts (this will also delete associated envelopes)
      const testAccounts = accounts.filter(acc => 
        acc.name.includes('Test') && 
        (acc.name.includes('Auto-Unassigned') || acc.name.includes('Credit Card'))
      );
      
      for (const account of testAccounts) {
        await (window as any).electronAPI.accounts.delete(account.id);
      }

      const regularTestAccount = accounts.find(acc => acc.name === 'Test Envelope Account');
      if (regularTestAccount) {
        await (window as any).electronAPI.accounts.delete(regularTestAccount.id);
      }

      addResult(`Cleaned up ${testEnvelopes.length} test envelopes and ${testAccounts.length + (regularTestAccount ? 1 : 0)} test accounts`);
      await loadData();
    } catch (error) {
      addResult(`Cleanup failed: ${error}`, false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={onNavigateBack}
          style={{
            padding: '8px 16px',
            marginRight: '10px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ← Back to Main
        </button>
        <h2 style={{ display: 'inline', margin: 0 }}>Envelope System Testing</h2>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        <button 
          onClick={testUnassignedEnvelopes}
          disabled={isRunning}
          style={{
            padding: '10px 20px',
            backgroundColor: isRunning ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {isRunning ? 'Running Tests...' : '🎯 Test Auto-Unassigned Envelopes'}
        </button>
        
        <button 
          onClick={runEnvelopeTests}
          disabled={isRunning}
          style={{
            padding: '10px 20px',
            backgroundColor: isRunning ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isRunning ? 'not-allowed' : 'pointer'
          }}
        >
          {isRunning ? 'Running Tests...' : '📧 Run Basic Envelope Tests'}
        </button>

        <button 
          onClick={createMissingUnassignedEnvelopes}
          disabled={isRunning}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ffc107',
            color: 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🔧 Create Missing Unassigned Envelopes
        </button>
        
        <button 
          onClick={cleanupTestData}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🗑️ Cleanup Test Data
        </button>

        <button 
          onClick={clearResults}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Clear Results
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div>
          <h3>Current Accounts ({accounts.length})</h3>
          <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px' }}>
            {accounts.map(account => (
              <div key={account.id} style={{ marginBottom: '5px', fontSize: '14px' }}>
                <strong>{account.name}</strong> ({account.type}) - ${account.current_balance}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3>Current Envelopes ({envelopes.length})</h3>
          <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px' }}>
            {envelopes.map(envelope => (
              <div key={envelope.id} style={{ marginBottom: '5px', fontSize: '14px' }}>
                <strong>{envelope.name}</strong> ({envelope.type}) - ${envelope.current_balance}
                <br />
                <span style={{ color: '#666', fontSize: '12px' }}>Account ID: {envelope.account_id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3>Test Results ({testResults.length})</h3>
        <div style={{
          height: '400px',
          overflowY: 'auto',
          border: '1px solid #ddd',
          padding: '10px',
          backgroundColor: '#f8f9fa',
          fontFamily: 'monospace',
          fontSize: '14px'
        }}>
          {testResults.map((result, index) => (
            <div key={index} style={{ marginBottom: '4px' }}>
              {result}
            </div>
          ))}
          {testResults.length === 0 && (
            <div style={{ color: '#666', fontStyle: 'italic' }}>
              No test results yet. Choose a test to run:
              <br />• "🎯 Test Auto-Unassigned Envelopes" - Test the new automatic unassigned envelope system
              <br />• "📧 Run Basic Envelope Tests" - Test basic envelope operations
              <br />• "🔧 Create Missing Unassigned Envelopes" - Add unassigned envelopes to existing accounts
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
