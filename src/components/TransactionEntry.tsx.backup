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

  // Professional CSS injection - permanent solution
  useEffect(() => {
    const existingStyle = document.getElementById('transaction-entry-styles');
    if (!existingStyle) {
      const style = document.createElement('style');
      style.id = 'transaction-entry-styles';
      style.textContent = `
        /* Professional Transaction Entry Styling */
        .page-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          min-height: 100vh;
          background-color: #f8f9fa;
        }
        
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid #dee2e6;
        }
        
        .page-title {
          font-size: 24px;
          font-weight: 700;
          color: #212529;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .back-button {
          padding: 8px 16px;
          font-size: 14px;
          background-color: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s ease;
          font-family: Arial, sans-serif;
        }
        
        .back-button:hover {
          background-color: #5a6268;
        }
        
        .form-container {
          background: white;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          border: 1px solid #e1e8ed;
        }
        
        .form-group {
          margin-bottom: 16px;
        }
        
        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #495057;
          margin-bottom: 6px;
          font-family: Arial, sans-serif;
        }
        
        .form-label.required::after {
          content: " *";
          color: #dc3545;
        }
        
        .form-input,
        .form-select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 14px;
          font-family: Arial, sans-serif;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          background-color: white;
        }
        
        .form-input:focus,
        .form-select:focus {
          outline: none;
          border-color: #17a2b8;
          box-shadow: 0 0 0 3px rgba(23, 162, 184, 0.1);
        }
        
        .form-input:disabled,
        .form-select:disabled {
          background-color: #e9ecef;
          cursor: not-allowed;
        }
        
        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        
        .form-grid-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
        }
        
        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-top: 24px;
          flex-wrap: wrap;
        }
        
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 600;
          font-family: Arial, sans-serif;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          gap: 8px;
          line-height: 1;
          user-select: none;
        }
        
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
        }
        
        .btn-lg {
          padding: 14px 28px;
          font-size: 16px;
          font-weight: 600;
        }
        
        .btn-success {
          background-color: #28a745;
          color: white;
        }
        
        .btn-success:hover:not(:disabled) {
          background-color: #218838;
        }
        
        .message {
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 16px;
          border: 1px solid;
          font-family: Arial, sans-serif;
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }
        
        .message-success {
          background-color: #d4edda;
          color: #155724;
          border-color: #c3e6cb;
        }
        
        .message-error {
          background-color: #f8d7da;
          color: #721c24;
          border-color: #f5c6cb;
        }
        
        .finance-card {
          background-color: white;
          border: 1px solid #e1e8ed;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: box-shadow 0.2s ease, transform 0.2s ease;
          font-family: Arial, sans-serif;
          margin-top: 20px;
        }
        
        .finance-card:hover {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          transform: translateY(-2px);
        }
        
        .finance-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        
        .finance-card-title {
          font-size: 18px;
          font-weight: 700;
          color: #212529;
          margin: 0;
        }
        
        .finance-card-content {
          margin-bottom: 16px;
        }
        
        .d-flex {
          display: flex;
        }
        
        .justify-between {
          justify-content: space-between;
        }
        
        .align-center {
          align-items: center;
        }
        
        .flex-wrap {
          flex-wrap: wrap;
        }
        
        .gap-4 {
          gap: 16px;
        }
        
        .mt-5 {
          margin-top: 20px;
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
          .form-grid-2,
          .form-grid-3 {
            grid-template-columns: 1fr;
          }
          
          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          
          .form-actions {
            flex-direction: column;
            align-items: center;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

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
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">📝 Transaction Entry</h1>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="message message-success">
          ✅ {successMessage}
        </div>
      )}
      
      {errorMessage && (
        <div className="message message-error">
          ❌ {errorMessage}
        </div>
      )}

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-grid-2">
            {/* Account Selection */}
            <div className="form-group">
              <label className="form-label required">Account</label>
              <select
                value={formData.account_id}
                onChange={(e) => handleInputChange('account_id', parseInt(e.target.value))}
                className="form-select"
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
            <div className="form-group">
              <label className="form-label required">Envelope</label>
              <select
                value={formData.envelope_id}
                onChange={(e) => handleInputChange('envelope_id', parseInt(e.target.value))}
                disabled={filteredEnvelopes.length === 0}
                className="form-select"
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

          <div className="form-grid-3">
            {/* Amount */}
            <div className="form-group">
              <label className="form-label required">Amount</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount || ''}
                onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="form-input"
              />
            </div>

            {/* Date */}
            <div className="form-group">
              <label className="form-label required">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="form-input"
              />
            </div>

            {/* Reference Number */}
            <div className="form-group">
              <label className="form-label">Reference #</label>
              <input
                type="text"
                value={formData.reference_number}
                onChange={(e) => handleInputChange('reference_number', e.target.value)}
                placeholder="Check #, Confirmation, etc."
                className="form-input"
              />
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label required">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter transaction description"
              className="form-input"
            />
          </div>

          <div className="form-grid-2">
            {/* Status */}
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                disabled={formData.account_id === 0}
                className="form-select"
              >
                {getAvailableStatusOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Transaction Type */}
            <div className="form-group">
              <label className="form-label">Type</label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="form-select"
              >
                <option value="debit">Debit (Expense/Spending)</option>
                <option value="credit">Credit (Income/Payment)</option>
                <option value="transfer">Transfer</option>
                <option value="payment">Payment</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-lg btn-success"
            >
              {isLoading ? '💾 Saving...' : '💾 Create Transaction'}
            </button>
          </div>
        </form>
      </div>

      {/* Quick Stats */}
      <div className="finance-card mt-5">
        <div className="finance-card-header">
          <h3 className="finance-card-title">📊 Quick Stats</h3>
        </div>
        <div className="finance-card-content">
          <div className="d-flex justify-between align-center flex-wrap gap-4">
            <div><strong>Total Accounts:</strong> {accounts.length}</div>
            <div><strong>Total Envelopes:</strong> {envelopes.length}</div>
            <div><strong>Available Envelopes:</strong> {filteredEnvelopes.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionEntry;