import React, { useState, useEffect, useCallback } from 'react';
// Note: Reusing DatabaseTest.css styling for consistent test UI

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'running';
  message: string;
  details?: any;
}

export default function TransactionTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [selectedEnvelope, setSelectedEnvelope] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [envelopes, setEnvelopes] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);

  const addTestResult = useCallback((result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  }, []);

  const updateTestResult = useCallback((name: string, updates: Partial<TestResult>) => {
    setTestResults(prev => prev.map(result => 
      result.name === name ? { ...result, ...updates } : result
    ));
  }, []);

  const loadAccounts = useCallback(async () => {
    try {
      const accountsData = await (window.electronAPI as any).accounts.getAll();
      setAccounts(accountsData);
      
      const envelopesData = await (window.electronAPI as any).envelopes.getAll();
      setEnvelopes(envelopesData);
      
      if (accountsData.length > 0 && !selectedAccount) {
        setSelectedAccount(accountsData[0]);
      }
      
      if (envelopesData.length > 0 && !selectedEnvelope) {
        const accountEnvelopes = envelopesData.filter((e: any) => e.account_id === accountsData[0]?.id);
        if (accountEnvelopes.length > 0) {
          setSelectedEnvelope(accountEnvelopes[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load accounts and envelopes:', error);
    }
  }, [selectedAccount, selectedEnvelope]);

  const loadTransactions = useCallback(async () => {
    try {
      const transactionsData = await (window.electronAPI as any).transactions.getAll();
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  }, []);

  const loadBalances = useCallback(async () => {
    try {
      const balancesData = await (window.electronAPI as any).balances.getAccountBalancesByStatus();
      setBalances(balancesData);
    } catch (error) {
      console.error('Failed to load balances:', error);
    }
  }, []);

  const runBasicTransactionTests = async () => {
    addTestResult({ name: 'Basic Transaction Tests', status: 'running', message: 'Starting basic transaction tests...' });

    try {
      // Test 1: Create a basic transaction
      addTestResult({ name: 'Create Transaction', status: 'running', message: 'Creating test transaction...' });
      
      if (!selectedAccount || !selectedEnvelope) {
        throw new Error('No account or envelope selected for testing');
      }

      const transactionData = {
        account_id: selectedAccount.id,
        envelope_id: selectedEnvelope.id,
        amount: 100.50,
        date: new Date().toISOString().split('T')[0],
        status: selectedAccount.type === 'credit_card' ? 'unpaid' : 'cleared',
        description: 'Test transaction from TransactionTest'
      };

      const createdTransaction = await (window.electronAPI as any).transactions.create(transactionData);
      updateTestResult('Create Transaction', { 
        status: 'success', 
        message: `✅ Created transaction ID: ${createdTransaction.id}`,
        details: createdTransaction
      });

      // Test 2: Get transaction by ID
      addTestResult({ name: 'Get Transaction by ID', status: 'running', message: 'Retrieving transaction...' });
      const retrievedTransaction = await (window.electronAPI as any).transactions.getById(createdTransaction.id);
      
      if (retrievedTransaction && retrievedTransaction.id === createdTransaction.id) {
        updateTestResult('Get Transaction by ID', { 
          status: 'success', 
          message: '✅ Successfully retrieved transaction by ID',
          details: retrievedTransaction
        });
      } else {
        throw new Error('Retrieved transaction does not match created transaction');
      }

      // Test 3: Get transaction with details
      addTestResult({ name: 'Get Transaction with Details', status: 'running', message: 'Getting transaction with details...' });
      const transactionWithDetails = await (window.electronAPI as any).transactions.getWithDetailsById(createdTransaction.id);
      
      if (transactionWithDetails && transactionWithDetails.account_name && transactionWithDetails.envelope_name) {
        updateTestResult('Get Transaction with Details', { 
          status: 'success', 
          message: '✅ Successfully retrieved transaction with account and envelope details',
          details: transactionWithDetails
        });
      } else {
        throw new Error('Transaction details missing account or envelope information');
      }

      // Test 4: Update transaction status
      addTestResult({ name: 'Update Transaction Status', status: 'running', message: 'Updating transaction status...' });
      const newStatus = selectedAccount.type === 'credit_card' ? 'paid' : 'pending';
      const updatedTransaction = await (window.electronAPI as any).transactions.update(createdTransaction.id, {
        status: newStatus,
        description: 'Updated test transaction'
      });

      if (updatedTransaction.status === newStatus) {
        updateTestResult('Update Transaction Status', { 
          status: 'success', 
          message: `✅ Successfully updated transaction status to '${newStatus}'`,
          details: updatedTransaction
        });
      } else {
        throw new Error(`Status update failed. Expected: ${newStatus}, Got: ${updatedTransaction.status}`);
      }

      // Test 5: Get transactions by account
      addTestResult({ name: 'Get Transactions by Account', status: 'running', message: 'Getting transactions by account...' });
      const accountTransactions = await (window.electronAPI as any).transactions.getByAccount(selectedAccount.id);
      
      if (accountTransactions.length > 0) {
        updateTestResult('Get Transactions by Account', { 
          status: 'success', 
          message: `✅ Found ${accountTransactions.length} transactions for account`,
          details: accountTransactions
        });
      } else {
        throw new Error('No transactions found for account');
      }

      // Test 6: Search transactions
      addTestResult({ name: 'Search Transactions', status: 'running', message: 'Searching transactions...' });
      const searchResults = await (window.electronAPI as any).transactions.search('test');
      
      updateTestResult('Search Transactions', { 
        status: 'success', 
        message: `✅ Search returned ${searchResults.length} results`,
        details: searchResults
      });

      updateTestResult('Basic Transaction Tests', { 
        status: 'success', 
        message: '✅ All basic transaction tests completed successfully!'
      });

    } catch (error) {
      updateTestResult('Basic Transaction Tests', { 
        status: 'error', 
        message: `❌ Basic transaction tests failed: ${error}`
      });
    }
  };

  const runBalanceCalculationTests = async () => {
    addTestResult({ name: 'Balance Calculation Tests', status: 'running', message: 'Starting balance calculation tests...' });

    try {
      // Test 1: Get account balances by status
      addTestResult({ name: 'Account Balances by Status', status: 'running', message: 'Getting account balances...' });
      const accountBalances = await (window.electronAPI as any).balances.getAccountBalancesByStatus();
      
      updateTestResult('Account Balances by Status', { 
        status: 'success', 
        message: `✅ Retrieved balances for ${accountBalances.length} accounts`,
        details: accountBalances
      });

      // Test 2: Get envelope balances by status
      addTestResult({ name: 'Envelope Balances by Status', status: 'running', message: 'Getting envelope balances...' });
      const envelopeBalances = await (window.electronAPI as any).balances.getEnvelopeBalancesByStatus();
      
      updateTestResult('Envelope Balances by Status', { 
        status: 'success', 
        message: `✅ Retrieved balances for ${envelopeBalances.length} envelopes`,
        details: envelopeBalances
      });

      // Test 3: Validate balance integrity
      addTestResult({ name: 'Balance Integrity Validation', status: 'running', message: 'Validating balance integrity...' });
      const integrityResult = await (window.electronAPI as any).balances.validateIntegrity();
      
      updateTestResult('Balance Integrity Validation', { 
        status: integrityResult.valid ? 'success' : 'error', 
        message: integrityResult.valid 
          ? '✅ All account-envelope balances are in perfect alignment!' 
          : `❌ Found ${integrityResult.discrepancies.length} balance discrepancies`,
        details: integrityResult
      });

      updateTestResult('Balance Calculation Tests', { 
        status: 'success', 
        message: '✅ Balance calculation tests completed!'
      });

    } catch (error) {
      updateTestResult('Balance Calculation Tests', { 
        status: 'error', 
        message: `❌ Balance calculation tests failed: ${error}`
      });
    }
  };

  const runCreditCardPaymentTests = async () => {
    addTestResult({ name: 'Credit Card Payment Tests', status: 'running', message: 'Starting credit card payment tests...' });

    try {
      // Find credit card account and cash envelope
      const creditCardAccount = accounts.find(a => a.type === 'credit_card');
      const cashEnvelope = envelopes.find(e => e.type === 'cash');

      if (!creditCardAccount || !cashEnvelope) {
        updateTestResult('Credit Card Payment Tests', { 
          status: 'error', 
          message: '❌ Need both credit card account and cash envelope for payment tests'
        });
        return;
      }

      // Test 1: Simulate payment
      addTestResult({ name: 'Simulate Credit Card Payment', status: 'running', message: 'Simulating payment...' });
      const simulation = await (window.electronAPI as any).debt.simulatePayment(creditCardAccount.id, [
        { envelope_id: cashEnvelope.id, amount: 50.00 }
      ]);

      updateTestResult('Simulate Credit Card Payment', { 
        status: simulation.valid ? 'success' : 'error', 
        message: simulation.valid 
          ? '✅ Payment simulation successful' 
          : `❌ Payment simulation failed: ${simulation.errors.join(', ')}`,
        details: simulation
      });

      // Test 2: Get payment suggestions
      addTestResult({ name: 'Payment Allocation Suggestions', status: 'running', message: 'Getting payment suggestions...' });
      const suggestions = await (window.electronAPI as any).debt.suggestPaymentAllocation(creditCardAccount.id, 100.00);

      updateTestResult('Payment Allocation Suggestions', { 
        status: 'success', 
        message: `✅ Got suggestions totaling $${suggestions.total_suggested} (${suggestions.coverage_percentage.toFixed(1)}% coverage)`,
        details: suggestions
      });

      // Test 3: Get debt by envelope category
      addTestResult({ name: 'Debt by Category', status: 'running', message: 'Getting debt breakdown...' });
      const debtBreakdown = await (window.electronAPI as any).debt.getByEnvelopeCategory();

      updateTestResult('Debt by Category', { 
        status: 'success', 
        message: `✅ Found debt in ${debtBreakdown.length} envelope categories`,
        details: debtBreakdown
      });

      updateTestResult('Credit Card Payment Tests', { 
        status: 'success', 
        message: '✅ Credit card payment tests completed!'
      });

    } catch (error) {
      updateTestResult('Credit Card Payment Tests', { 
        status: 'error', 
        message: `❌ Credit card payment tests failed: ${error}`
      });
    }
  };

  const runAccountTransferTests = async () => {
    addTestResult({ name: 'Account Transfer Tests', status: 'running', message: 'Starting account transfer tests...' });

    try {
      // Find two different accounts with envelopes
      const account1 = accounts.find(a => a.type === 'checking');
      const account2 = accounts.find(a => a.type === 'savings' || (a.type === 'checking' && a.id !== account1?.id));
      
      if (!account1 || !account2) {
        updateTestResult('Account Transfer Tests', { 
          status: 'error', 
          message: '❌ Need at least two different accounts for transfer tests'
        });
        return;
      }

      const envelope1 = envelopes.find(e => e.account_id === account1.id);
      const envelope2 = envelopes.find(e => e.account_id === account2.id);

      if (!envelope1 || !envelope2) {
        updateTestResult('Account Transfer Tests', { 
          status: 'error', 
          message: '❌ Need envelopes in both accounts for transfer tests'
        });
        return;
      }

      // Test 1: Create account transfer
      addTestResult({ name: 'Create Account Transfer', status: 'running', message: 'Creating account transfer...' });
      const transferData = {
        from_account_id: account1.id,
        to_account_id: account2.id,
        from_envelope_id: envelope1.id,
        to_envelope_id: envelope2.id,
        amount: 25.00,
        date: new Date().toISOString().split('T')[0],
        description: 'Test account transfer'
      };

      const createdTransfer = await (window.electronAPI as any).accountTransfers.create(transferData);
      updateTestResult('Create Account Transfer', { 
        status: 'success', 
        message: `✅ Created account transfer ID: ${createdTransfer.id}`,
        details: createdTransfer
      });

      // Test 2: Get all account transfers
      addTestResult({ name: 'Get All Account Transfers', status: 'running', message: 'Getting all transfers...' });
      const allTransfers = await (window.electronAPI as any).accountTransfers.getAll();

      updateTestResult('Get All Account Transfers', { 
        status: 'success', 
        message: `✅ Found ${allTransfers.length} account transfers`,
        details: allTransfers
      });

      updateTestResult('Account Transfer Tests', { 
        status: 'success', 
        message: '✅ Account transfer tests completed!'
      });

    } catch (error) {
      updateTestResult('Account Transfer Tests', { 
        status: 'error', 
        message: `❌ Account transfer tests failed: ${error}`
      });
    }
  };

  const runBulkOperationTests = async () => {
    addTestResult({ name: 'Bulk Operation Tests', status: 'running', message: 'Starting bulk operation tests...' });

    try {
      if (!selectedAccount || !selectedEnvelope) {
        throw new Error('No account or envelope selected for testing');
      }

      // Test 1: Create bulk transactions
      addTestResult({ name: 'Create Bulk Transactions', status: 'running', message: 'Creating bulk transactions...' });
      
      const bulkTransactions = [
        {
          account_id: selectedAccount.id,
          envelope_id: selectedEnvelope.id,
          amount: 10.00,
          date: new Date().toISOString().split('T')[0],
          status: selectedAccount.type === 'credit_card' ? 'unpaid' : 'cleared',
          description: 'Bulk transaction 1'
        },
        {
          account_id: selectedAccount.id,
          envelope_id: selectedEnvelope.id,
          amount: 15.00,
          date: new Date().toISOString().split('T')[0],
          status: selectedAccount.type === 'credit_card' ? 'unpaid' : 'cleared',
          description: 'Bulk transaction 2'
        },
        {
          account_id: selectedAccount.id,
          envelope_id: selectedEnvelope.id,
          amount: 20.00,
          date: new Date().toISOString().split('T')[0],
          status: selectedAccount.type === 'credit_card' ? 'unpaid' : 'cleared',
          description: 'Bulk transaction 3'
        }
      ];

      const createdBulkTransactions = await (window.electronAPI as any).transactions.createBulk(bulkTransactions);
      updateTestResult('Create Bulk Transactions', { 
        status: 'success', 
        message: `✅ Created ${createdBulkTransactions.length} bulk transactions`,
        details: createdBulkTransactions
      });

      // Test 2: Get transactions by status
      addTestResult({ name: 'Get Transactions by Status', status: 'running', message: 'Getting transactions by status...' });
      const statusTransactions = await (window.electronAPI as any).transactions.getByStatus(bulkTransactions[0].status);
      
      updateTestResult('Get Transactions by Status', { 
        status: 'success', 
        message: `✅ Found ${statusTransactions.length} transactions with status '${bulkTransactions[0].status}'`,
        details: statusTransactions
      });

      // Test 3: Get transactions by date range
      addTestResult({ name: 'Get Transactions by Date Range', status: 'running', message: 'Getting transactions by date range...' });
      const today = new Date().toISOString().split('T')[0];
      const dateRangeTransactions = await (window.electronAPI as any).transactions.getByDateRange(today, today);
      
      updateTestResult('Get Transactions by Date Range', { 
        status: 'success', 
        message: `✅ Found ${dateRangeTransactions.length} transactions for today`,
        details: dateRangeTransactions
      });

      updateTestResult('Bulk Operation Tests', { 
        status: 'success', 
        message: '✅ Bulk operation tests completed!'
      });

    } catch (error) {
      updateTestResult('Bulk Operation Tests', { 
        status: 'error', 
        message: `❌ Bulk operation tests failed: ${error}`
      });
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      await loadAccounts();
      await runBasicTransactionTests();
      await runBalanceCalculationTests();
      await runCreditCardPaymentTests();
      await runAccountTransferTests();
      await runBulkOperationTests();
      
      // Refresh data after tests
      await loadTransactions();
      await loadBalances();
      
    } catch (error) {
      console.error('Test suite failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const clearTestData = async () => {
    if (!confirm('Are you sure you want to clear all test transactions? This cannot be undone.')) {
      return;
    }

    try {
      const allTransactions = await (window.electronAPI as any).transactions.getAll();
      const testTransactions = allTransactions.filter((t: any) => 
        t.description && t.description.includes('test')
      );

      for (const transaction of testTransactions) {
        await (window.electronAPI as any).transactions.delete(transaction.id);
      }

      alert(`Cleared ${testTransactions.length} test transactions`);
      await loadTransactions();
      await loadBalances();
    } catch (error) {
      alert(`Failed to clear test data: ${error}`);
    }
  };

  useEffect(() => {
    loadAccounts();
    loadTransactions();
    loadBalances();
  }, [loadAccounts, loadTransactions, loadBalances]);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ marginBottom: '30px' }}>
        <h2>🔄 Transaction System Test Suite</h2>
        <p>Comprehensive testing for Phase 3 transaction management system</p>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button 
            onClick={runAllTests} 
            disabled={isRunning} 
            style={{
              padding: '10px 20px',
              backgroundColor: isRunning ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isRunning ? 'not-allowed' : 'pointer'
            }}
          >
            {isRunning ? 'Running Tests...' : 'Run All Transaction Tests'}
          </button>
          <button 
            onClick={clearTestData}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Clear Test Data
          </button>
          <button 
            onClick={loadTransactions}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Refresh Data
          </button>
        </div>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label>Test Account: </label>
            <select 
              value={selectedAccount?.id || ''} 
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const account = accounts.find(a => a.id === parseInt(e.target.value));
                setSelectedAccount(account);
                const accountEnvelopes = envelopes.filter(env => env.account_id === account?.id);
                if (accountEnvelopes.length > 0) {
                  setSelectedEnvelope(accountEnvelopes[0]);
                }
              }}
            >
              <option value="">Select Account</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.type})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label>Test Envelope: </label>
            <select 
              value={selectedEnvelope?.id || ''} 
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const envelope = envelopes.find(e => e.id === parseInt(e.target.value));
                setSelectedEnvelope(envelope);
              }}
            >
              <option value="">Select Envelope</option>
              {envelopes.filter(e => e.account_id === selectedAccount?.id).map(envelope => (
                <option key={envelope.id} value={envelope.id}>
                  {envelope.name} ({envelope.type})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>Test Results</h3>
        {testResults.length === 0 && (
          <p>No tests run yet. Click "Run All Transaction Tests" to start.</p>
        )}
        
        {testResults.map((result, index) => (
          <div key={index} style={{ 
            border: '1px solid #ddd', 
            borderRadius: '4px', 
            padding: '10px', 
            marginBottom: '10px',
            backgroundColor: result.status === 'success' ? '#d4edda' : result.status === 'error' ? '#f8d7da' : '#fff3cd'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <span style={{ fontWeight: 'bold' }}>{result.name}</span>
              <span>
                {result.status === 'success' && '✅'}
                {result.status === 'error' && '❌'}
                {result.status === 'running' && '⏳'}
              </span>
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>{result.message}</div>
            {result.details && (
              <details style={{ marginTop: '10px' }}>
                <summary>View Details</summary>
                <pre>{JSON.stringify(result.details, null, 2)}</pre>
              </details>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '15px' }}>
          <h3>Recent Transactions ({transactions.length})</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {transactions.slice(0, 10).map(transaction => (
              <div key={transaction.id} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', padding: '5px', borderBottom: '1px solid #eee' }}>
                <span>#{transaction.id}</span>
                <span>{transaction.account_name}</span>
                <span>{transaction.envelope_name}</span>
                <span>${transaction.amount}</span>
                <span style={{ color: transaction.status === 'cleared' || transaction.status === 'paid' ? 'green' : 'orange' }}>{transaction.status}</span>
                <span>{transaction.date}</span>
                <span>{transaction.description || 'No description'}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '15px' }}>
          <h3>Account Balances by Status</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {balances.map(balance => (
              <div key={balance.account_id} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '10px', borderBottom: '1px solid #eee' }}>
                <span><strong>{balance.account_name}</strong></span>
                <span>Available: ${balance.available_balance}</span>
                <span>Total: ${balance.total_balance}</span>
                {balance.cleared_balance !== undefined && (
                  <span>Cleared: ${balance.cleared_balance}</span>
                )}
                {balance.pending_balance !== undefined && (
                  <span>Pending: ${balance.pending_balance}</span>
                )}
                {balance.unpaid_balance !== undefined && (
                  <span>Unpaid: ${balance.unpaid_balance}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}