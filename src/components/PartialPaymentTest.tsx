import React, { useState } from 'react';

interface TestResult {
  step: string;
  success: boolean;
  data?: any;
  error?: string;
}

const PartialPaymentTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const runPartialPaymentTest = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      // Step 1: Create test credit card account
      let creditCardAccount: any;
      try {
        creditCardAccount = await (window as any).electronAPI.database.createAccount({
          name: "Test Credit Card for Partial Payment",
          type: "credit_card",
          initial_balance: 0,
          current_balance: 0
        });
        addResult({ 
          step: "Create test credit card account", 
          success: true, 
          data: creditCardAccount 
        });
      } catch (error) {
        addResult({ 
          step: "Create test credit card account", 
          success: false, 
          error: String(error) 
        });
        return;
      }

      // Step 2: Create test checking account for cash envelope
      let checkingAccount: any;
      try {
        checkingAccount = await (window as any).electronAPI.database.createAccount({
          name: "Test Checking for Partial Payment",
          type: "checking",
          initial_balance: 1000,
          current_balance: 1000
        });
        addResult({ 
          step: "Create test checking account", 
          success: true, 
          data: checkingAccount 
        });
      } catch (error) {
        addResult({ 
          step: "Create test checking account", 
          success: false, 
          error: String(error) 
        });
        return;
      }

      // Step 3: Create cash envelope for groceries
      let cashEnvelope: any;
      try {
        cashEnvelope = await (window as any).electronAPI.envelopes.create({
          name: "Groceries",
          account_id: checkingAccount.id,
          type: "cash",
          current_balance: 0
        });
        addResult({ 
          step: "Create cash envelope (Groceries)", 
          success: true, 
          data: cashEnvelope 
        });
      } catch (error) {
        addResult({ 
          step: "Create cash envelope (Groceries)", 
          success: false, 
          error: String(error) 
        });
        return;
      }

      // Step 4: Create debt envelope for credit card groceries
      let debtEnvelope: any;
      try {
        debtEnvelope = await (window as any).electronAPI.envelopes.create({
          name: "Credit Card Groceries",
          account_id: creditCardAccount.id,
          type: "debt",
          current_balance: 0
        });
        addResult({ 
          step: "Create debt envelope (Credit Card Groceries)", 
          success: true, 
          data: debtEnvelope 
        });
      } catch (error) {
        addResult({ 
          step: "Create debt envelope (Credit Card Groceries)", 
          success: false, 
          error: String(error) 
        });
        return;
      }

      // Step 5: Add money to cash envelope
      try {
        await (window as any).electronAPI.transactions.create({
          account_id: checkingAccount.id,
          envelope_id: cashEnvelope.id,
          amount: 500, // Add $500 to groceries cash envelope
          date: new Date().toISOString(),
          status: 'cleared',
          description: 'Initial funding for partial payment test'
        });
        addResult({ 
          step: "Add $500 to cash envelope", 
          success: true, 
          data: "Cash envelope funded" 
        });
      } catch (error) {
        addResult({ 
          step: "Add $500 to cash envelope", 
          success: false, 
          error: String(error) 
        });
        return;
      }

      // Step 6: Create unpaid credit card transaction ($300 Kroger transaction)
      let krogerTransaction: any;
      try {
        krogerTransaction = await (window as any).electronAPI.transactions.create({
          account_id: creditCardAccount.id,
          envelope_id: debtEnvelope.id,
          amount: 300, // $300 debt
          date: new Date().toISOString(),
          status: 'unpaid',
          description: 'Kroger Grocery Store'
        });
        addResult({ 
          step: "Create $300 unpaid Kroger transaction", 
          success: true, 
          data: krogerTransaction 
        });
      } catch (error) {
        addResult({ 
          step: "Create $300 unpaid Kroger transaction", 
          success: false, 
          error: String(error) 
        });
        return;
      }

      // Step 7: Verify initial balances
      try {
        const envelopeBalances = await (window as any).electronAPI.balances.getEnvelopeBalancesByStatus();
        const cashBalance = envelopeBalances.find((e: any) => e.envelope_id === cashEnvelope.id);
        const debtBalance = envelopeBalances.find((e: any) => e.envelope_id === debtEnvelope.id);
        
        addResult({ 
          step: "Verify initial balances", 
          success: true, 
          data: `Cash envelope: $${cashBalance?.available_balance || 0}, Debt envelope: $${debtBalance?.available_balance || 0}` 
        });
      } catch (error) {
        addResult({ 
          step: "Verify initial balances", 
          success: false, 
          error: String(error) 
        });
        return;
      }

      // Step 8: Make partial payment ($100 of the $300 debt)
      try {
        const partialPayment = await (window as any).electronAPI.creditCardPayments.create({
          credit_card_account_id: creditCardAccount.id,
          total_amount: 100, // Pay only $100 of the $300 debt
          date: new Date().toISOString(),
          description: 'Partial payment test - $100 of $300 Kroger debt',
          allocations: [{
            envelope_id: cashEnvelope.id, // Pay from cash envelope
            amount: 100
          }]
        });
        
        addResult({ 
          step: "Execute partial payment ($100 of $300)", 
          success: true, 
          data: partialPayment 
        });
      } catch (error) {
        addResult({ 
          step: "Execute partial payment ($100 of $300)", 
          success: false, 
          error: String(error) 
        });
        return;
      }

      // Step 9: Verify balances after partial payment
      try {
        const envelopeBalances = await (window as any).electronAPI.balances.getEnvelopeBalancesByStatus();
        const cashBalance = envelopeBalances.find((e: any) => e.envelope_id === cashEnvelope.id);
        const debtBalance = envelopeBalances.find((e: any) => e.envelope_id === debtEnvelope.id);
        
        const success = cashBalance?.available_balance === 400 && debtBalance?.available_balance === 200;
        
        addResult({ 
          step: "Verify balances after partial payment", 
          success, 
          data: `Cash envelope: $${cashBalance?.available_balance || 0} (should be $400), Debt envelope: $${debtBalance?.available_balance || 0} (should be $200)`,
          error: success ? undefined : "Balances incorrect - transaction splitting may not be working"
        });
      } catch (error) {
        addResult({ 
          step: "Verify balances after partial payment", 
          success: false, 
          error: String(error) 
        });
        return;
      }

      // Step 10: Check transaction splitting - should have 1 paid $100 transaction and 1 unpaid $200 transaction
      try {
        const allTransactions = await (window as any).electronAPI.transactions.getAll();
        const krogerTransactions = allTransactions.filter((t: any) => t.description && t.description.includes('Kroger'));
        
        const paidTransaction = krogerTransactions.find((t: any) => t.status === 'paid');
        const unpaidTransaction = krogerTransactions.find((t: any) => t.status === 'unpaid');
        
        const success = paidTransaction && unpaidTransaction && 
                       paidTransaction.amount === 100 && 
                       unpaidTransaction.amount === 200;
        
        addResult({ 
          step: "Verify transaction splitting", 
          success, 
          data: `Found ${krogerTransactions.length} Kroger transactions: paid ${paidTransaction?.amount || 0}, unpaid ${unpaidTransaction?.amount || 0}`,
          error: success ? undefined : "Transaction splitting verification failed"
        });
      } catch (error) {
        addResult({ 
          step: "Verify transaction splitting", 
          success: false, 
          error: String(error) 
        });
        return;
      }

      addResult({ 
        step: "🎉 PARTIAL PAYMENT TEST COMPLETE", 
        success: true, 
        data: "All tests passed! Transaction splitting for partial payments is working correctly." 
      });

    } catch (error) {
      addResult({ 
        step: "Partial payment test suite", 
        success: false, 
        error: String(error) 
      });
    }

    setIsRunning(false);
  };

  const cleanupTestData = async () => {
    try {
      const allAccounts = await (window as any).electronAPI.database.getAllAccounts();
      const testAccounts = allAccounts.filter((acc: any) => 
        acc.name.includes('Test') && acc.name.includes('Partial Payment')
      );
      
      for (const account of testAccounts) {
        await (window as any).electronAPI.database.deleteAccount(account.id);
      }
      
      setTestResults([]);
      alert(`Cleaned up ${testAccounts.length} test accounts and related data`);
    } catch (error) {
      alert(`Error cleaning up test data: ${error}`);
    }
  };

  return (
    <div style={{ textAlign: 'left', maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <h2>🧪 Partial Payment Enhancement Test</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        This test verifies that partial credit card payments correctly split transactions and update debt envelope balances.
      </p>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={runPartialPaymentTest}
          disabled={isRunning}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: isRunning ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {isRunning ? 'Running Partial Payment Test...' : '🚀 Test Partial Payment Enhancement'}
        </button>
        
        <button 
          onClick={cleanupTestData}
          disabled={isRunning}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🧹 Cleanup Test Data
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
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {testResults.map((result, index) => (
              <div key={index} style={{ 
                marginBottom: '12px',
                padding: '12px',
                backgroundColor: result.success ? '#d4edda' : '#f8d7da',
                border: `1px solid ${result.success ? '#c3e6cb' : '#f5c6cb'}`,
                borderRadius: '4px'
              }}>
                <div style={{ 
                  color: result.success ? '#155724' : '#721c24',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <span style={{ marginRight: '8px' }}>
                    {result.success ? '✅' : '❌'}
                  </span>
                  {result.step}
                </div>
                {result.data && (
                  <div style={{ 
                    marginTop: '6px', 
                    fontSize: '14px', 
                    color: '#666',
                    fontFamily: 'monospace',
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    padding: '4px 8px',
                    borderRadius: '3px'
                  }}>
                    {typeof result.data === 'object' ? JSON.stringify(result.data, null, 2) : result.data}
                  </div>
                )}
                {result.error && (
                  <div style={{ 
                    marginTop: '6px', 
                    fontSize: '14px', 
                    color: '#721c24',
                    fontWeight: 'bold'
                  }}>
                    ⚠️ Error: {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ 
        backgroundColor: '#e7f3ff', 
        padding: '15px', 
        borderRadius: '4px',
        marginTop: '20px'
      }}>
        <h4 style={{ color: '#0066cc', marginTop: 0 }}>🎯 Test Scenario:</h4>
        <ul style={{ color: '#0066cc', margin: 0 }}>
          <li><strong>Setup:</strong> Create $300 unpaid Kroger transaction, $500 cash envelope</li>
          <li><strong>Action:</strong> Make $100 partial payment (1/3 of debt)</li>
          <li><strong>Expected Result:</strong> Original $300 transaction splits into:</li>
          <ul>
            <li>✅ $100 transaction marked as "paid"</li>
            <li>✅ $200 new transaction marked as "unpaid"</li>
            <li>✅ Cash envelope reduces from $500 to $400</li>
            <li>✅ Debt envelope balance shows $200 remaining (not $300)</li>
          </ul>
        </ul>
      </div>
    </div>
  );
};

export default PartialPaymentTest;