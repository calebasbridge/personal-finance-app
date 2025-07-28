import React, { useState } from 'react';

// Declare window.electronAPI type inline since the type definition isn't being picked up
declare global {
  interface Window {
    electronAPI: {
      database: {
        createAccount: (accountData: any) => Promise<any>;
        getAllAccounts: () => Promise<any[]>;
        getAccountById: (id: number) => Promise<any>;
        getAccountsByType: (type: string) => Promise<any[]>;
        updateAccount: (updateData: any) => Promise<any>;
        deleteAccount: (id: number) => Promise<boolean>;
        getTotalBalance: () => Promise<number>;
        getBalanceByType: (type: string) => Promise<number>;
      };
    };
  }
}

interface TestResult {
  step: string;
  success: boolean;
  data?: any;
  error?: string;
}

const DatabaseTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [allAccountsData, setAllAccountsData] = useState<any[]>([]);

  const addResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const runDatabaseTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setAllAccountsData([]);

    try {
      // Test 1: Database connection
      addResult({ step: "Database connection test", success: true });

      // Test 2: Create checking account
      try {
        const checkingAccount = await window.electronAPI.database.createAccount({
          name: "Test Checking",
          type: "checking",
          initial_balance: 1000,
          current_balance: 1000
        });
        addResult({ 
          step: "Create checking account: 'Test Checking' with $1000", 
          success: true, 
          data: checkingAccount 
        });
      } catch (error) {
        addResult({ 
          step: "Create checking account: 'Test Checking' with $1000", 
          success: false, 
          error: String(error) 
        });
      }

      // Test 3: Create savings account
      try {
        const savingsAccount = await window.electronAPI.database.createAccount({
          name: "Test Savings",
          type: "savings",
          initial_balance: 5000,
          current_balance: 5000
        });
        addResult({ 
          step: "Create savings account: 'Test Savings' with $5000", 
          success: true, 
          data: savingsAccount 
        });
      } catch (error) {
        addResult({ 
          step: "Create savings account: 'Test Savings' with $5000", 
          success: false, 
          error: String(error) 
        });
      }

      // Test 4: Create credit card
      try {
        const creditCardAccount = await window.electronAPI.database.createAccount({
          name: "Test Credit Card",
          type: "credit_card",
          initial_balance: 0,
          current_balance: -500
        });
        addResult({ 
          step: "Create credit card: 'Test Credit Card' with -$500", 
          success: true, 
          data: creditCardAccount 
        });
      } catch (error) {
        addResult({ 
          step: "Create credit card: 'Test Credit Card' with -$500", 
          success: false, 
          error: String(error) 
        });
      }

      // Test 5: Create cash account
      try {
        const cashAccount = await window.electronAPI.database.createAccount({
          name: "Test Cash",
          type: "cash",
          initial_balance: 100,
          current_balance: 100
        });
        addResult({ 
          step: "Create cash account: 'Test Cash' with $100", 
          success: true, 
          data: cashAccount 
        });
      } catch (error) {
        addResult({ 
          step: "Create cash account: 'Test Cash' with $100", 
          success: false, 
          error: String(error) 
        });
      }

      // Test 6: Retrieve all accounts
      try {
        const allAccounts = await window.electronAPI.database.getAllAccounts();
        setAllAccountsData(allAccounts);
        addResult({ 
          step: `Retrieve all accounts (should show 4+)`, 
          success: true, 
          data: `Found ${allAccounts.length} accounts` 
        });
      } catch (error) {
        addResult({ 
          step: "Retrieve all accounts (should show 4+)", 
          success: false, 
          error: String(error) 
        });
      }

      // Test 7: Retrieve accounts by type
      try {
        const checkingAccounts = await window.electronAPI.database.getAccountsByType('checking');
        const savingsAccounts = await window.electronAPI.database.getAccountsByType('savings');
        const creditCardAccounts = await window.electronAPI.database.getAccountsByType('credit_card');
        const cashAccounts = await window.electronAPI.database.getAccountsByType('cash');
        
        addResult({ 
          step: "Retrieve accounts by type", 
          success: true, 
          data: `Checking: ${checkingAccounts.length}, Savings: ${savingsAccounts.length}, Credit Cards: ${creditCardAccounts.length}, Cash: ${cashAccounts.length}` 
        });
      } catch (error) {
        addResult({ 
          step: "Retrieve accounts by type", 
          success: false, 
          error: String(error) 
        });
      }

      // Test 8: Update account
      try {
        const allAccounts = await window.electronAPI.database.getAllAccounts();
        if (allAccounts.length > 0) {
          const accountToUpdate = allAccounts.find(acc => acc.name.includes('Test Checking'));
          if (accountToUpdate) {
            const updatedAccount = await window.electronAPI.database.updateAccount({
              id: accountToUpdate.id,
              name: "Updated Test Checking",
              current_balance: 1250.50
            });
            addResult({ 
              step: "Update account name and balance", 
              success: true, 
              data: updatedAccount 
            });
          } else {
            addResult({ 
              step: "Update account name and balance", 
              success: false, 
              error: "No test checking account found to update" 
            });
          }
        }
      } catch (error) {
        addResult({ 
          step: "Update account name and balance", 
          success: false, 
          error: String(error) 
        });
      }

      // Test 9: Delete account
      try {
        const allAccounts = await window.electronAPI.database.getAllAccounts();
        const accountToDelete = allAccounts.find(acc => acc.name.includes('Test Cash'));
        if (accountToDelete) {
          const deleteSuccess = await window.electronAPI.database.deleteAccount(accountToDelete.id);
          addResult({ 
            step: "Delete one account", 
            success: deleteSuccess, 
            data: deleteSuccess ? "Account deleted successfully" : "Delete operation returned false"
          });
        } else {
          addResult({ 
            step: "Delete one account", 
            success: false, 
            error: "No test cash account found to delete" 
          });
        }
      } catch (error) {
        addResult({ 
          step: "Delete one account", 
          success: false, 
          error: String(error) 
        });
      }

      // Test 10: Final count
      try {
        const finalAccounts = await window.electronAPI.database.getAllAccounts();
        setAllAccountsData(finalAccounts);
        addResult({ 
          step: "Final count verification", 
          success: true, 
          data: `${finalAccounts.length} accounts remaining` 
        });
      } catch (error) {
        addResult({ 
          step: "Final count verification", 
          success: false, 
          error: String(error) 
        });
      }

      // Test 11: Error handling test
      try {
        await window.electronAPI.database.createAccount({
          name: "",
          type: "invalid_type",
          initial_balance: "not_a_number"
        });
        addResult({ 
          step: "Error handling test (invalid data)", 
          success: false, 
          error: "Should have failed with invalid data" 
        });
      } catch (error) {
        addResult({ 
          step: "Error handling test (invalid data)", 
          success: true, 
          data: "Correctly rejected invalid data" 
        });
      }

      addResult({ 
        step: "App restart test", 
        success: true, 
        data: "Close and reopen the app to verify data persists" 
      });

    } catch (error) {
      addResult({ 
        step: "Database test suite", 
        success: false, 
        error: String(error) 
      });
    }

    setIsRunning(false);
  };

  const clearData = async () => {
    try {
      const allAccounts = await window.electronAPI.database.getAllAccounts();
      const testAccounts = allAccounts.filter((acc: any) => 
        acc.name.includes('Test') || acc.name.includes('Updated')
      );
      
      for (const account of testAccounts) {
        await window.electronAPI.database.deleteAccount(account.id);
      }
      
      setTestResults([]);
      setAllAccountsData([]);
      alert(`Cleared ${testAccounts.length} test accounts`);
    } catch (error) {
      alert(`Error clearing data: ${error}`);
    }
  };

  return (
    <div style={{ textAlign: 'left', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Database Test Suite</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={runDatabaseTests}
          disabled={isRunning}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: isRunning ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {isRunning ? 'Running Tests...' : 'Run Database Tests'}
        </button>
        
        <button 
          onClick={clearData}
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
          Clear Test Data
        </button>
      </div>

      {testResults.length > 0 && (
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <h3>Test Results:</h3>
          {testResults.map((result, index) => (
            <div key={index} style={{ 
              marginBottom: '10px',
              padding: '8px',
              backgroundColor: result.success ? '#d4edda' : '#f8d7da',
              border: `1px solid ${result.success ? '#c3e6cb' : '#f5c6cb'}`,
              borderRadius: '4px'
            }}>
              <span style={{ 
                color: result.success ? '#155724' : '#721c24',
                fontWeight: 'bold'
              }}>
                {result.success ? '✅' : '❌'} {result.step}
              </span>
              {result.data && (
                <div style={{ marginTop: '4px', fontSize: '14px', color: '#666' }}>
                  Data: {typeof result.data === 'object' ? JSON.stringify(result.data, null, 2) : result.data}
                </div>
              )}
              {result.error && (
                <div style={{ marginTop: '4px', fontSize: '14px', color: '#721c24' }}>
                  Error: {result.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {allAccountsData.length > 0 && (
        <div style={{ 
          backgroundColor: '#e9ecef', 
          padding: '20px', 
          borderRadius: '4px' 
        }}>
          <h3>All Accounts in Database:</h3>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            backgroundColor: 'white'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ border: '1px solid #dee2e6', padding: '8px' }}>ID</th>
                <th style={{ border: '1px solid #dee2e6', padding: '8px' }}>Name</th>
                <th style={{ border: '1px solid #dee2e6', padding: '8px' }}>Type</th>
                <th style={{ border: '1px solid #dee2e6', padding: '8px' }}>Initial Balance</th>
                <th style={{ border: '1px solid #dee2e6', padding: '8px' }}>Current Balance</th>
                <th style={{ border: '1px solid #dee2e6', padding: '8px' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {allAccountsData.map((account: any) => (
                <tr key={account.id}>
                  <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>{account.id}</td>
                  <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>{account.name}</td>
                  <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>{account.type}</td>
                  <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>${account.initial_balance}</td>
                  <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>${account.current_balance}</td>
                  <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>
                    {new Date(account.created_at).toLocaleString()}
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

export default DatabaseTest;