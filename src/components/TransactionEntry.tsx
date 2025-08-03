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

interface TransactionFormData {
  account_id: number;
  envelope_id: number;
  amount: number;
  date: string;
  description: string;
  status: 'not_posted' | 'pending' | 'cleared' | 'unpaid' | 'paid';
  type: 'debit' | 'credit' | 'transfer' | 'payment';
  reference_number: string;
}

interface TransactionEntryProps {
  onNavigateBack: () => void;
}

const TransactionEntry: React.FC<TransactionEntryProps> = ({ onNavigateBack }) => {
  // State management
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
  const [filteredEnvelopes, setFilteredEnvelopes] = useState<Envelope[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Form data state
  const [formData, setFormData] = useState<TransactionFormData>({
    account_id: 0,
    envelope_id: 0,
    amount: 0,
    date: new Date().toISOString().split('T')[0], // Today's date
    description: '',
    status: 'pending',
    type: 'debit',
    reference_number: ''
  });

  // Load accounts and envelopes on component mount
  useEffect(() => {
    loadAccountsAndEnvelopes();
  }, []);

  // Filter envelopes when account selection changes
  useEffect(() => {
    if (formData.account_id > 0) {
      const accountEnvelopes = envelopes.filter(env => env.account_id === formData.account_id);
      setFilteredEnvelopes(accountEnvelopes);
      
      // Auto-select first envelope if only one available
      if (accountEnvelopes.length === 1) {
        setFormData(prev => ({ ...prev, envelope_id: accountEnvelopes[0].id }));
      } else {
        setFormData(prev => ({ ...prev, envelope_id: 0 }));
      }
    } else {
      setFilteredEnvelopes([]);
    }
  }, [formData.account_id, envelopes]);

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
    } catch (error) {
      setErrorMessage(`Failed to load data: ${error}`);
    }
  };

  const loadAccounts = async () => {
    try {
      const accountBalances = await (window as any).electronAPI.balances.getAccountBalancesByStatus();
      
      // Transform account balance data to match the Account interface
      const accountsWithCorrectBalances = accountBalances.map((balance: any) => ({
        id: balance.account_id,
        name: balance.account_name,
        type: balance.account_type,
        current_balance: balance.available_balance // Use transaction-aware balance
      }));
      
      setAccounts(accountsWithCorrectBalances);
    } catch (error) {
      setErrorMessage(`Failed to load accounts: ${error}`);
    }
  };

  const loadEnvelopes = async () => {
    try {
      const envelopeBalances = await (window as any).electronAPI.balances.getEnvelopeBalancesByStatus();
      
      // Transform envelope balance data to match the Envelope interface
      const envelopesWithCorrectBalances = envelopeBalances.map((balance: any) => ({
        id: balance.envelope_id,
        name: balance.envelope_name,
        account_id: balance.account_id,
        type: balance.envelope_type,
        current_balance: balance.available_balance // Use transaction-aware balance
      }));
      
      setEnvelopes(envelopesWithCorrectBalances);
    } catch (error) {
      setErrorMessage(`Failed to load envelopes: ${error}`);
    }
  };

  const handleInputChange = (field: keyof TransactionFormData, value: any) => {
    // When account changes, reset status to appropriate default
    if (field === 'account_id') {
      const selectedAccount = accounts.find(acc => acc.id === value);
      if (selectedAccount) {
        const defaultStatus = selectedAccount.type === 'credit_card' ? 'unpaid' : 'pending';
        setFormData(prev => ({ ...prev, [field]: value, status: defaultStatus }));
      } else {
        setFormData(prev => ({ ...prev, [field]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    // Clear messages when user starts typing
    if (successMessage) setSuccessMessage('');
    if (errorMessage) setErrorMessage('');
  };

  // Get available status options based on account type
  const getAvailableStatusOptions = () => {
    const selectedAccount = accounts.find(acc => acc.id === formData.account_id);
    if (!selectedAccount) return [];
    
    if (selectedAccount.type === 'credit_card') {
      return [
        { value: 'unpaid', label: 'Unpaid' },
        { value: 'paid', label: 'Paid' }
      ];
    } else {
      // For checking, savings, cash accounts
      return [
        { value: 'not_posted', label: 'Not Posted (Future)' },
        { value: 'pending', label: 'Pending' },
        { value: 'cleared', label: 'Cleared' }
      ];
    }
  };

  const validateForm = (): string | null => {
    if (formData.account_id === 0) return 'Please select an account';
    if (formData.envelope_id === 0) return 'Please select an envelope';
    if (formData.amount === 0) return 'Please enter a transaction amount';
    if (!formData.description.trim()) return 'Please enter a description';
    if (!formData.date) return 'Please select a date';
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const transactionData = {
        account_id: formData.account_id,
        envelope_id: formData.envelope_id,
        amount: formData.amount,
        date: formData.date,
        description: formData.description,
        status: formData.status,
        type: formData.type,
        reference_number: formData.reference_number || null
      };
      
      const newTransaction = await (window as any).electronAPI.transactions.create(transactionData);
      
      if (newTransaction) {
        setSuccessMessage(`Transaction created successfully! ID: ${newTransaction.id}`);
        
        // Reset form for next transaction
        setFormData({
          account_id: formData.account_id, // Keep account selected
          envelope_id: 0,
          amount: 0,
          date: new Date().toISOString().split('T')[0],
          description: '',
          status: 'pending',
          type: 'debit',
          reference_number: ''
        });
        
        // Reload data to show updated balances
        await loadAccountsAndEnvelopes();
      }
    } catch (error) {
      setErrorMessage(`Failed to create transaction: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

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
        <h2 style={{ display: 'inline', margin: 0 }}>📝 Transaction Entry</h2>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          {/* Account Selection */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Account *</label>
            <select
              value={formData.account_id}
              onChange={(e) => handleInputChange('account_id', parseInt(e.target.value))}
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
          </div>

          {/* Envelope Selection */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Envelope *</label>
            <select
              value={formData.envelope_id}
              onChange={(e) => handleInputChange('envelope_id', parseInt(e.target.value))}
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
              <option value={0}>Select an envelope...</option>
              {filteredEnvelopes.map(envelope => (
                <option key={envelope.id} value={envelope.id}>
                  {envelope.name} ({envelope.type}) - ${envelope.current_balance.toFixed(2)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          {/* Amount */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Amount *</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount || ''}
              onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Date */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Date *</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Reference Number */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Reference #</label>
            <input
              type="text"
              value={formData.reference_number}
              onChange={(e) => handleInputChange('reference_number', e.target.value)}
              placeholder="Check #, Confirmation, etc."
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description *</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Enter transaction description"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          {/* Status */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Status</label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              disabled={formData.account_id === 0}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: formData.account_id === 0 ? '#e9ecef' : 'white'
              }}
            >
              {getAvailableStatusOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Transaction Type */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Type</label>
            <select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="debit">Debit (Expense/Spending)</option>
              <option value="credit">Credit (Income/Payment)</option>
              <option value="transfer">Transfer</option>
              <option value="payment">Payment</option>
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <div style={{ textAlign: 'center' }}>
          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: '12px 30px',
              fontSize: '16px',
              fontWeight: 'bold',
              backgroundColor: isLoading ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              minWidth: '150px'
            }}
          >
            {isLoading ? '💾 Saving...' : '💾 Create Transaction'}
          </button>
        </div>
      </form>

      {/* Quick Stats */}
      <div style={{ marginTop: '30px', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>📊 Quick Stats</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '14px' }}>
          <div><strong>Total Accounts:</strong> {accounts.length}</div>
          <div><strong>Total Envelopes:</strong> {envelopes.length}</div>
          <div><strong>Available Envelopes:</strong> {filteredEnvelopes.length}</div>
        </div>
      </div>
    </div>
  );
};

export default TransactionEntry;