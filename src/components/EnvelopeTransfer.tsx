import React, { useState, useEffect } from 'react';

interface Account {
  id: number;
  name: string;
  type: string;
  current_balance: number;
}

interface Envelope {
  id: number;
  name: string;
  account_id: number;
  type: string;
  current_balance: number;
}

interface EnvelopeTransferProps {
  onNavigateBack: () => void;
}

const EnvelopeTransfer: React.FC<EnvelopeTransferProps> = ({ onNavigateBack }) => {
  // State management
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number>(0);
  const [filteredEnvelopes, setFilteredEnvelopes] = useState<Envelope[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Transfer form data
  const [transferData, setTransferData] = useState({
    fromEnvelopeId: 0,
    toEnvelopeId: 0,
    amount: 0,
    description: ''
  });

  // Load accounts and envelopes on component mount
  useEffect(() => {
    loadAccountsAndEnvelopes();
  }, []);

  // Filter envelopes when account selection changes
  useEffect(() => {
    if (selectedAccountId > 0) {
      const accountEnvelopes = envelopes.filter(env => env.account_id === selectedAccountId);
      setFilteredEnvelopes(accountEnvelopes);
      
      // Reset envelope selections when account changes
      setTransferData(prev => ({
        ...prev,
        fromEnvelopeId: 0,
        toEnvelopeId: 0
      }));
    } else {
      setFilteredEnvelopes([]);
    }
  }, [selectedAccountId, envelopes]);

  const loadAccountsAndEnvelopes = async () => {
    try {
      const [accountBalances, envelopeBalances] = await Promise.all([
        (window as any).electronAPI.balances.getAccountBalancesByStatus(),
        (window as any).electronAPI.balances.getEnvelopeBalancesByStatus()
      ]);
      
      // Transform account balance data to match the Account interface
      const accountsWithCorrectBalances = accountBalances.map((balance: any) => ({
        id: balance.account_id,
        name: balance.account_name,
        type: balance.account_type,
        current_balance: balance.available_balance // Use transaction-aware balance
      }));
      
      // Transform envelope balance data to match the Envelope interface
      const envelopesWithCorrectBalances = envelopeBalances.map((balance: any) => ({
        id: balance.envelope_id,
        name: balance.envelope_name,
        account_id: balance.account_id,
        type: balance.envelope_type,
        current_balance: balance.available_balance // Use transaction-aware balance
      }));
      
      setAccounts(accountsWithCorrectBalances);
      setEnvelopes(envelopesWithCorrectBalances);
      
      // Auto-select first account if available
      if (accountsWithCorrectBalances.length > 0) {
        setSelectedAccountId(accountsWithCorrectBalances[0].id);
      }
    } catch (error) {
      setErrorMessage(`Failed to load data: ${error}`);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setTransferData(prev => ({ ...prev, [field]: value }));
    
    // Clear messages when user starts typing
    if (successMessage) setSuccessMessage('');
    if (errorMessage) setErrorMessage('');
  };

  const validateTransfer = async (): Promise<string | null> => {
    if (selectedAccountId === 0) return 'Please select an account';
    if (transferData.fromEnvelopeId === 0) return 'Please select a source envelope';
    if (transferData.toEnvelopeId === 0) return 'Please select a destination envelope';
    if (transferData.fromEnvelopeId === transferData.toEnvelopeId) return 'Source and destination envelopes must be different';
    if (transferData.amount <= 0) return 'Transfer amount must be greater than zero';
    // Description is now optional - removed validation
    
    // Get real-time transaction-aware balance for source envelope to ensure accuracy
    try {
      const envelopeBalances = await (window as any).electronAPI.balances.getEnvelopeBalancesByStatus();
      const sourceEnvelopeBalance = envelopeBalances.find((balance: any) => balance.envelope_id === transferData.fromEnvelopeId);
      
      if (sourceEnvelopeBalance && transferData.amount > sourceEnvelopeBalance.available_balance) {
        return `Insufficient funds. Available: $${sourceEnvelopeBalance.available_balance.toFixed(2)}, Requested: $${transferData.amount.toFixed(2)}`;
      }
    } catch (error) {
      console.error('Error validating envelope balance:', error);
      // Fallback to cached balance if real-time check fails
      const sourceEnvelope = filteredEnvelopes.find(env => env.id === transferData.fromEnvelopeId);
      if (sourceEnvelope && transferData.amount > sourceEnvelope.current_balance) {
        return `Insufficient funds. ${sourceEnvelope.name} has $${sourceEnvelope.current_balance.toFixed(2)} available`;
      }
    }
    
    return null;
  };

  const getTransferPreview = () => {
    if (transferData.fromEnvelopeId === 0 || transferData.toEnvelopeId === 0 || transferData.amount <= 0) {
      return null;
    }
    
    const sourceEnvelope = filteredEnvelopes.find(env => env.id === transferData.fromEnvelopeId);
    const destEnvelope = filteredEnvelopes.find(env => env.id === transferData.toEnvelopeId);
    
    if (!sourceEnvelope || !destEnvelope) return null;
    
    return {
      source: {
        name: sourceEnvelope.name,
        currentBalance: sourceEnvelope.current_balance,
        newBalance: sourceEnvelope.current_balance - transferData.amount
      },
      destination: {
        name: destEnvelope.name,
        currentBalance: destEnvelope.current_balance,
        newBalance: destEnvelope.current_balance + transferData.amount
      }
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = await validateTransfer();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const transferRequest = {
        from_envelope_id: transferData.fromEnvelopeId,
        to_envelope_id: transferData.toEnvelopeId,
        amount: transferData.amount,
        date: new Date().toISOString().split('T')[0],
        description: transferData.description.trim() || 'Envelope Transfer'
      };
      
      console.log('Attempting envelope transfer:', transferRequest);
      
      const result = await (window as any).electronAPI.envelopes.transfer(transferRequest);
      
      console.log('Transfer result:', result);
      
      if (result && result.id) {
        setSuccessMessage(`Transfer completed successfully! Moved $${transferData.amount.toFixed(2)} between envelopes.`);
        
        // Reset form
        setTransferData({
          fromEnvelopeId: 0,
          toEnvelopeId: 0,
          amount: 0,
          description: ''
        });
        
        // Reload envelopes to show updated balances
        await loadAccountsAndEnvelopes();
      } else {
        setErrorMessage('Transfer failed: No transfer record returned from database');
      }
    } catch (error) {
      console.error('Transfer error:', error);
      setErrorMessage(`Transfer failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickTransfer = (amount: number) => {
    setTransferData(prev => ({ ...prev, amount }));
  };

  const transferPreview = getTransferPreview();
  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
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
          ← Back to Home
        </button>
        <h2 style={{ display: 'inline', margin: 0 }}>📋 Envelope Transfer</h2>
      </div>

      <div style={{ backgroundColor: '#e3f2fd', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#1565c0' }}>💡 About Envelope Transfers</h4>
        <p style={{ margin: 0, fontSize: '14px', color: '#424242' }}>
          Move money between envelopes within the same account to reallocate your budget. 
          This is perfect for adjusting spending categories when you need more funds in one area.
        </p>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div style={{
          backgroundColor: '#d4edda',
          color: '#155724',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #c3e6cb'
        }}>
          ✅ {successMessage}
        </div>
      )}
      
      {errorMessage && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          ❌ {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
        {/* Account Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Account *</label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(parseInt(e.target.value))}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value={0}>Select an account...</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.type}) - ${account.current_balance.toFixed(2)}
              </option>
            ))}
          </select>
          {selectedAccount && (
            <small style={{ color: '#6c757d', fontSize: '12px' }}>
              {filteredEnvelopes.length} envelopes available for transfer
            </small>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          {/* From Envelope */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>From Envelope *</label>
            <select
              value={transferData.fromEnvelopeId}
              onChange={(e) => handleInputChange('fromEnvelopeId', parseInt(e.target.value))}
              disabled={filteredEnvelopes.length === 0}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: filteredEnvelopes.length === 0 ? '#e9ecef' : 'white'
              }}
            >
              <option value={0}>Select source envelope...</option>
              {filteredEnvelopes.map(envelope => (
                <option key={envelope.id} value={envelope.id}>
                  {envelope.name} - ${envelope.current_balance.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          {/* To Envelope */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>To Envelope *</label>
            <select
              value={transferData.toEnvelopeId}
              onChange={(e) => handleInputChange('toEnvelopeId', parseInt(e.target.value))}
              disabled={filteredEnvelopes.length === 0}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: filteredEnvelopes.length === 0 ? '#e9ecef' : 'white'
              }}
            >
              <option value={0}>Select destination envelope...</option>
              {filteredEnvelopes
                .filter(envelope => envelope.id !== transferData.fromEnvelopeId)
                .map(envelope => (
                  <option key={envelope.id} value={envelope.id}>
                    {envelope.name} - ${envelope.current_balance.toFixed(2)}
                  </option>
                ))
              }
            </select>
          </div>
        </div>

        {/* Amount and Quick Buttons */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Transfer Amount *</label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="number"
              step="0.01"
              value={transferData.amount || ''}
              onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              style={{
                flex: 1,
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
            {/* Quick Amount Buttons */}
            <div style={{ display: 'flex', gap: '5px' }}>
              {[25, 50, 100].map(amount => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => handleQuickTransfer(amount)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    backgroundColor: '#e9ecef',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  ${amount}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description</label>
          <input
            type="text"
            value={transferData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Optional: Reason for transfer (e.g., 'Move funds for car repair')"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>

        {/* Transfer Preview */}
        {transferPreview && (
          <div style={{
            backgroundColor: '#e8f5e8',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #c8e6c9'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>📊 Transfer Preview</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <strong>From: {transferPreview.source.name}</strong><br />
                <span style={{ color: '#666' }}>Current: ${transferPreview.source.currentBalance.toFixed(2)}</span><br />
                <span style={{ color: '#d32f2f' }}>New: ${transferPreview.source.newBalance.toFixed(2)} (-${transferData.amount.toFixed(2)})</span>
              </div>
              <div>
                <strong>To: {transferPreview.destination.name}</strong><br />
                <span style={{ color: '#666' }}>Current: ${transferPreview.destination.currentBalance.toFixed(2)}</span><br />
                <span style={{ color: '#388e3c' }}>New: ${transferPreview.destination.newBalance.toFixed(2)} (+${transferData.amount.toFixed(2)})</span>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div style={{ textAlign: 'center' }}>
          <button
            type="submit"
            disabled={isLoading || !transferPreview}
            style={{
              padding: '12px 30px',
              fontSize: '16px',
              fontWeight: 'bold',
              backgroundColor: isLoading || !transferPreview ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isLoading || !transferPreview ? 'not-allowed' : 'pointer',
              minWidth: '150px'
            }}
          >
            {isLoading ? '📋 Transferring...' : '📋 Transfer Funds'}
          </button>
        </div>
      </form>

      {/* Envelope Summary */}
      {filteredEnvelopes.length > 0 && (
        <div style={{ marginTop: '30px', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 15px 0' }}>📊 {selectedAccount?.name} - Envelope Balances</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            {filteredEnvelopes.map(envelope => (
              <div key={envelope.id} style={{ 
                padding: '10px', 
                backgroundColor: 'white', 
                borderRadius: '4px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{envelope.name}</div>
                <div style={{ color: '#28a745', fontSize: '16px', fontWeight: 'bold' }}>
                  ${envelope.current_balance.toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>
                  {envelope.type === 'cash' ? '💰 Cash' : '💳 Debt'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnvelopeTransfer;