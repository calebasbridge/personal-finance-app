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

interface Transaction {
  id: number;
  account_id: number;
  envelope_id: number;
  amount: number;
  date: string;
  description: string;
  status: 'not_posted' | 'pending' | 'cleared' | 'unpaid' | 'paid';
  type: 'debit' | 'credit' | 'transfer' | 'payment';
  reference_number?: string;
  account_name?: string;
  envelope_name?: string;
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

interface TransactionManagementProps {
  onNavigateBack: () => void;
}

interface TransactionFilters {
  accountId?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  searchTerm?: string;
  limit?: number;
  offset?: number;
}

const TransactionManagement: React.FC<TransactionManagementProps> = ({ onNavigateBack }) => {
  // DEBUG MARKER: Component loaded with EDIT BUG FIX applied - August 7, 2025
  console.log('🔧 TransactionManagement component loaded with EDIT BUG FIX applied!');
  
  // Mode state - 'list' for viewing transactions, 'create' for new transaction, 'edit' for editing
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingTransactionId, setEditingTransactionId] = useState<number | null>(null);

  // Data state
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
  const [filteredEnvelopes, setFilteredEnvelopes] = useState<Envelope[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalTransactions, setTotalTransactions] = useState(0);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Form data state
  const [formData, setFormData] = useState<TransactionFormData>({
    account_id: 0,
    envelope_id: 0,
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
    status: 'pending',
    type: 'debit',
    reference_number: ''
  });

  // Filter state
  const [filters, setFilters] = useState<TransactionFilters>({
    limit: 50,
    offset: 0
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);

  // DEBUG: Log form data changes in edit mode
  useEffect(() => {
    if (mode === 'edit' && editingTransactionId) {
      console.log('🔍 DEBUG: Form data in edit mode:', {
        mode,
        editingTransactionId,
        formData: formData,
        filteredEnvelopes: filteredEnvelopes.length
      });
    }
  }, [formData, mode, editingTransactionId, filteredEnvelopes]);

  // Professional CSS injection - comprehensive styling for both transaction entry and management
  useEffect(() => {
    const existingStyle = document.getElementById('transaction-management-styles');
    if (!existingStyle) {
      const style = document.createElement('style');
      style.id = 'transaction-management-styles';
      style.textContent = `
        /* Professional Transaction Management Styling */
        .page-container {
          max-width: 1400px;
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

        .debug-info {
          background: #e3f2fd;
          border: 1px solid #2196f3;
          border-radius: 4px;
          padding: 12px;
          margin-bottom: 16px;
          font-family: monospace;
          font-size: 12px;
          color: #1565c0;
        }

        .mode-toggle {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
        }

        .mode-btn {
          padding: 8px 16px;
          border: 1px solid #dee2e6;
          background: white;
          color: #495057;
          border-radius: 4px;
          cursor: pointer;
          font-family: Arial, sans-serif;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .mode-btn.active {
          background: #17a2b8;
          color: white;
          border-color: #17a2b8;
        }

        .mode-btn:hover:not(.active) {
          background: #f8f9fa;
          border-color: #6c757d;
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

        .transaction-section {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          border: 1px solid #e1e8ed;
          margin-bottom: 20px;
        }

        .transaction-section-header {
          padding: 16px 20px;
          border-bottom: 1px solid #e1e8ed;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .transaction-section-title {
          font-size: 18px;
          font-weight: 600;
          color: #212529;
          margin: 0;
        }

        .transaction-section-content {
          padding: 20px;
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

        .filters-container {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
          padding: 16px;
          background: white;
          border-radius: 8px;
          border: 1px solid #e1e8ed;
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

        .btn-sm {
          padding: 6px 12px;
          font-size: 12px;
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

        .btn-primary {
          background-color: #17a2b8;
          color: white;
        }
        
        .btn-primary:hover:not(:disabled) {
          background-color: #138496;
        }

        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }
        
        .btn-secondary:hover:not(:disabled) {
          background-color: #5a6268;
        }

        .btn-danger {
          background-color: #dc3545;
          color: white;
        }
        
        .btn-danger:hover:not(:disabled) {
          background-color: #c82333;
        }

        .btn-warning {
          background-color: #fd7e14;
          color: white;
        }
        
        .btn-warning:hover:not(:disabled) {
          background-color: #e8670e;
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

        .message-warning {
          background-color: #fff3cd;
          color: #856404;
          border-color: #ffeaa7;
        }

        .transactions-table {
          width: 100%;
          border-collapse: collapse;
          font-family: Arial, sans-serif;
        }

        .transactions-table th,
        .transactions-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e1e8ed;
        }

        .transactions-table th {
          background-color: #f8f9fa;
          font-weight: 600;
          color: #495057;
          position: sticky;
          top: 0;
          z-index: 1;
        }

        .transactions-table tbody tr:hover {
          background-color: #f8f9fa;
        }

        .transaction-row-actions {
          display: flex;
          gap: 4px;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-not-posted {
          background-color: #e2e6ea;
          color: #6c757d;
        }

        .status-pending {
          background-color: #fff3cd;
          color: #856404;
        }

        .status-cleared {
          background-color: #d4edda;
          color: #155724;
        }

        .status-unpaid {
          background-color: #f8d7da;
          color: #721c24;
        }

        .status-paid {
          background-color: #d4edda;
          color: #155724;
        }

        .pagination-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 20px;
          padding: 16px;
          background: white;
          border-radius: 8px;
          border: 1px solid #e1e8ed;
        }

        .pagination-info {
          font-size: 14px;
          color: #6c757d;
        }

        .pagination-buttons {
          display: flex;
          gap: 8px;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #6c757d;
        }

        .empty-state-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .empty-state-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #495057;
        }

        .empty-state-description {
          font-size: 14px;
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
          .form-grid-2,
          .form-grid-3,
          .filters-container {
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

          .mode-toggle {
            flex-direction: column;
          }

          .transactions-table {
            font-size: 12px;
          }

          .transactions-table th,
          .transactions-table td {
            padding: 8px;
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

  // Load transactions when filters change or in list mode
  useEffect(() => {
    if (mode === 'list') {
      loadTransactions();
    }
  }, [mode, filters]);

  // Filter envelopes when account selection changes
  useEffect(() => {
    if (formData.account_id > 0) {
      const accountEnvelopes = envelopes.filter(env => env.account_id === formData.account_id);
      setFilteredEnvelopes(accountEnvelopes);
      
      // Auto-select first envelope if only one available and in create mode
      if (accountEnvelopes.length === 1 && mode === 'create') {
        setFormData(prev => ({ ...prev, envelope_id: accountEnvelopes[0].id }));
      } else if (mode === 'create') {
        setFormData(prev => ({ ...prev, envelope_id: 0 }));
      }
      // In edit mode, don't auto-change envelope_id
    } else {
      setFilteredEnvelopes([]);
    }
  }, [formData.account_id, envelopes, mode]);

  const loadAccountsAndEnvelopes = async () => {
    try {
      const [accountBalances, envelopeBalances] = await Promise.all([
        (window as any).electronAPI.balances.getAccountBalancesByStatus(),
        (window as any).electronAPI.balances.getEnvelopeBalancesByStatus()
      ]);
      
      const accountsWithCorrectBalances = accountBalances.map((balance: any) => ({
        id: balance.account_id,
        name: balance.account_name,
        type: balance.account_type,
        current_balance: balance.available_balance
      }));
      
      const envelopesWithCorrectBalances = envelopeBalances.map((balance: any) => ({
        id: balance.envelope_id,
        name: balance.envelope_name,
        account_id: balance.account_id,
        type: balance.envelope_type,
        current_balance: balance.available_balance
      }));
      
      setAccounts(accountsWithCorrectBalances);
      setEnvelopes(envelopesWithCorrectBalances);
    } catch (error) {
      setErrorMessage(`Failed to load data: ${error}`);
    }
  };

  const loadTransactions = async () => {
    setIsLoadingTransactions(true);
    try {
      const response = await (window as any).electronAPI.transactions.getWithFilters(filters);
      
      // Transform transactions to include account and envelope names
      const enrichedTransactions = response.transactions.map((transaction: any) => {
        const account = accounts.find(a => a.id === transaction.account_id);
        const envelope = envelopes.find(e => e.id === transaction.envelope_id);
        
        return {
          ...transaction,
          account_name: account?.name || 'Unknown Account',
          envelope_name: envelope?.name || 'Unknown Envelope'
        };
      });
      
      setTransactions(enrichedTransactions);
      setTotalTransactions(response.totalCount);
    } catch (error) {
      setErrorMessage(`Failed to load transactions: ${error}`);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const handleFilterChange = (field: keyof TransactionFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      offset: 0 // Reset to first page when filters change
    }));
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setFilters(prev => ({
      ...prev,
      offset: (newPage - 1) * pageSize
    }));
  };

  const handleInputChange = (field: keyof TransactionFormData, value: any) => {
    console.log(`🔄 DEBUG: handleInputChange called - field: ${field}, value: ${value}, mode: ${mode}`);
    
    if (field === 'account_id') {
      const selectedAccount = accounts.find(acc => acc.id === value);
      if (selectedAccount) {
        // ENHANCED FIX: Only set default status in CREATE mode, not EDIT mode
        if (mode === 'create') {
          const defaultStatus = selectedAccount.type === 'credit_card' ? 'unpaid' : 'pending';
          console.log(`📝 DEBUG: Setting default status for create mode: ${defaultStatus}`);
          setFormData(prev => ({ ...prev, [field]: value, status: defaultStatus }));
        } else {
          // In edit mode, don't change the status automatically
          console.log(`✏️ DEBUG: Edit mode - preserving status, only changing account_id`);
          setFormData(prev => ({ ...prev, [field]: value }));
        }
      } else {
        setFormData(prev => ({ ...prev, [field]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    if (successMessage) setSuccessMessage('');
    if (errorMessage) setErrorMessage('');
  };

  const getAvailableStatusOptions = () => {
    const selectedAccount = accounts.find(acc => acc.id === formData.account_id);
    if (!selectedAccount) return [];
    
    if (selectedAccount.type === 'credit_card') {
      return [
        { value: 'unpaid', label: 'Unpaid' },
        { value: 'paid', label: 'Paid' }
      ];
    } else {
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

  const resetForm = () => {
    console.log('🔄 DEBUG: resetForm called');
    setFormData({
      account_id: 0,
      envelope_id: 0,
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: '',
      status: 'pending',
      type: 'debit',
      reference_number: ''
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    console.log('💾 DEBUG: handleCreate called - STARTING');
    console.log('💾 DEBUG: Current formData:', formData);
    console.log('💾 DEBUG: Form type value:', formData.type);
    
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      console.log('💾 DEBUG: About to create transactionData object');
      console.log('💾 DEBUG: formData.type before object creation:', formData.type);
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
      
      console.log('💾 DEBUG: Created transactionData:', transactionData);
      console.log('💾 DEBUG: transactionData.type:', transactionData.type);
      console.log('💾 DEBUG: About to call API with transactionData');
      
      const newTransaction = await (window as any).electronAPI.transactions.create(transactionData);
      
      console.log('💾 DEBUG: API Response:', newTransaction);
      console.log('💾 DEBUG: newTransaction.type:', newTransaction ? newTransaction.type : 'No transaction returned');
      
      if (newTransaction) {
        setSuccessMessage(`Transaction created successfully! ID: ${newTransaction.id}`);
        resetForm();
        await loadAccountsAndEnvelopes(); // Refresh balances
        if (mode === 'list') {
          await loadTransactions(); // Refresh transaction list
        }
      }
    } catch (error) {
      setErrorMessage(`Failed to create transaction: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingTransactionId) {
      setErrorMessage('No transaction selected for editing');
      return;
    }
    
    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const updateData = {
        account_id: formData.account_id,
        envelope_id: formData.envelope_id,
        amount: formData.amount,
        date: formData.date,
        description: formData.description,
        status: formData.status,
        type: formData.type,
        reference_number: formData.reference_number || null
      };
      
      console.log('💾 DEBUG: Updating transaction with data:', updateData);
      
      const result = await (window as any).electronAPI.transactions.updateSafe(editingTransactionId, updateData);
      
      if (result.success) {
        let message = 'Transaction updated successfully!';
        if (result.warnings && result.warnings.length > 0) {
          message += ' Warnings: ' + result.warnings.join(', ');
        }
        setSuccessMessage(message);
        
        setMode('list');
        setEditingTransactionId(null);
        resetForm();
        await loadAccountsAndEnvelopes(); // Refresh balances
        await loadTransactions(); // Refresh transaction list
      } else {
        setErrorMessage(result.error || 'Failed to update transaction');
      }
    } catch (error) {
      setErrorMessage(`Failed to update transaction: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // CRITICAL FIX: Enhanced handleEdit function with complete transaction data preservation
  const handleEdit = async (transaction: Transaction) => {
    console.log('✏️ DEBUG: handleEdit called with transaction:', transaction);
    
    // Check for warnings before editing
    try {
      const [hasPaymentAllocations, isSplitResult] = await Promise.all([
        (window as any).electronAPI.transactions.hasPaymentAllocations(transaction.id),
        (window as any).electronAPI.transactions.isSplitTransaction(transaction.id)
      ]);
      
      let warningMessage = '';
      if (hasPaymentAllocations) {
        warningMessage += 'This transaction has payment allocations. ';
      }
      if (isSplitResult.isSplit) {
        warningMessage += 'This is a split transaction. ';
      }
      
      if (warningMessage) {
        warningMessage += 'Editing may affect related transactions.';
        if (!confirm(warningMessage + ' Continue with editing?')) {
          return;
        }
      }
    } catch (error) {
      console.error('Error checking transaction warnings:', error);
    }
    
    // CRITICAL FIX: Set mode and ID FIRST to prevent useEffects from interfering
    setEditingTransactionId(transaction.id);
    setMode('edit');
    setSuccessMessage('');
    setErrorMessage('');
    
    // CRITICAL FIX: Set filtered envelopes for the account to ensure envelope is available
    const accountEnvelopes = envelopes.filter(env => env.account_id === transaction.account_id);
    console.log('📋 DEBUG: Setting filtered envelopes for account', transaction.account_id, ':', accountEnvelopes);
    setFilteredEnvelopes(accountEnvelopes);
    
    // CRITICAL FIX: Use setTimeout to ensure mode is set before form data
    // This prevents the useEffect from overriding our form data
    setTimeout(() => {
      // CRITICAL FIX: Populate form with COMPLETE transaction data (including type!)
      const newFormData = {
        account_id: transaction.account_id,
        envelope_id: transaction.envelope_id,
        amount: transaction.amount,
        date: transaction.date,
        description: transaction.description,
        status: transaction.status,
        type: transaction.type, // CRITICAL: This was the issue - type gets preserved now
        reference_number: transaction.reference_number || ''
      };
      
      console.log('📝 DEBUG: Setting form data in edit mode (delayed):', newFormData);
      setFormData(newFormData);
      
      console.log('✅ DEBUG: Edit mode setup complete');
    }, 10); // Small delay to ensure mode is set first
  };

  const handleDelete = async (transactionId: number) => {
    if (!confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      return;
    }
    
    try {
      const result = await (window as any).electronAPI.transactions.deleteSafe(transactionId);
      
      if (result.success) {
        let message = 'Transaction deleted successfully!';
        if (result.warnings && result.warnings.length > 0) {
          message += ' Warnings: ' + result.warnings.join(', ');
        }
        setSuccessMessage(message);
        
        await loadAccountsAndEnvelopes(); // Refresh balances
        await loadTransactions(); // Refresh transaction list
      } else {
        setErrorMessage(result.error || 'Failed to delete transaction');
      }
    } catch (error) {
      setErrorMessage(`Failed to delete transaction: ${error}`);
    }
  };

  const handleCancel = () => {
    console.log('❌ DEBUG: handleCancel called');
    setMode('list');
    setEditingTransactionId(null);
    resetForm();
    setSuccessMessage('');
    setErrorMessage('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const className = `status-badge status-${status.replace('_', '-')}`;
    return <span className={className}>{status.replace('_', ' ')}</span>;
  };

  const totalPages = Math.ceil(totalTransactions / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalTransactions);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">📝 Transaction Management</h1>
      </div>



      {/* Mode Toggle */}
      <div className="mode-toggle">
        <button 
          className={`mode-btn ${mode === 'list' ? 'active' : ''}`}
          onClick={() => {
            setMode('list');
            setEditingTransactionId(null);
            resetForm();
          }}
        >
          📋 View Transactions
        </button>
        <button 
          className={`mode-btn ${mode === 'create' ? 'active' : ''}`}
          onClick={() => {
            setMode('create');
            setEditingTransactionId(null);
            resetForm();
          }}
        >
          ➕ Add Transaction
        </button>
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

      {/* Transaction Form - Show in create or edit mode */}
      {(mode === 'create' || mode === 'edit') && (
        <div className="transaction-section">
          <div className="transaction-section-header">
            <h2 className="transaction-section-title">
              {mode === 'create' ? '➕ Create New Transaction' : '✏️ Edit Transaction'}
            </h2>
          </div>
          <div className="transaction-section-content">
            <form onSubmit={mode === 'create' ? handleCreate : handleUpdate}>
              <div className="form-grid-2">
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
                        {account.name} ({account.type}) - {formatCurrency(account.current_balance)}
                      </option>
                    ))}
                  </select>
                </div>

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
                        {envelope.name} ({envelope.type}) - {formatCurrency(envelope.current_balance)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label required">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount === 0 ? '' : formData.amount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        handleInputChange('amount', 0);
                      } else {
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue)) {
                          handleInputChange('amount', numValue);
                        }
                      }
                    }}
                    placeholder="0.00"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="form-input"
                  />
                </div>

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

              <div className="form-group">
                <label className="form-label required">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => {
                    console.log('🔤 DEBUG: Description change:', e.target.value);
                    handleInputChange('description', e.target.value);
                  }}
                  placeholder="Enter transaction description"
                  className="form-input"
                />
              </div>

              <div className="form-grid-2">
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

                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      console.log('🔄 DEBUG: Type dropdown change:', e.target.value);
                      handleInputChange('type', e.target.value);
                    }}
                    className="form-select"
                  >
                    <option value="debit">Debit (Expense/Spending)</option>
                    <option value="credit">Credit (Income/Payment)</option>
                    <option value="transfer">Transfer</option>
                    <option value="payment">Payment</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                {mode === 'edit' && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn btn-secondary"
                  >
                    ❌ Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-lg btn-success"
                >
                  {isLoading ? '💾 Saving...' : mode === 'create' ? '💾 Create Transaction' : '💾 Update Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction List - Show in list mode */}
      {mode === 'list' && (
        <>
          {/* Filters */}
          <div className="filters-container">
            <div className="form-group">
              <label className="form-label">Account Filter</label>
              <select
                value={filters.accountId || ''}
                onChange={(e) => handleFilterChange('accountId', e.target.value ? parseInt(e.target.value) : undefined)}
                className="form-select"
              >
                <option value="">All Accounts</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status Filter</label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                className="form-select"
              >
                <option value="">All Statuses</option>
                <option value="not_posted">Not Posted</option>
                <option value="pending">Pending</option>
                <option value="cleared">Cleared</option>
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value || undefined)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Date</label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value || undefined)}
                className="form-input"
              />
            </div>
          </div>

          {/* Search */}
          <div className="transaction-section">
            <div className="transaction-section-content">
              <div className="form-group">
                <label className="form-label">Search Transactions</label>
                <input
                  type="text"
                  value={filters.searchTerm || ''}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value || undefined)}
                  placeholder="Search by description, reference number..."
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Transaction Table */}
          <div className="transaction-section">
            <div className="transaction-section-header">
              <h2 className="transaction-section-title">
                📋 Transaction List ({totalTransactions} total)
              </h2>
              <button
                onClick={() => setMode('create')}
                className="btn btn-primary btn-sm"
              >
                ➕ Add New
              </button>
            </div>
            <div className="transaction-section-content">
              {isLoadingTransactions ? (
                <div className="empty-state">
                  <div className="empty-state-icon">⏳</div>
                  <div className="empty-state-title">Loading Transactions...</div>
                </div>
              ) : transactions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📝</div>
                  <div className="empty-state-title">No Transactions Found</div>
                  <div className="empty-state-description">
                    {Object.keys(filters).some(key => filters[key as keyof TransactionFilters] !== undefined && key !== 'limit' && key !== 'offset') 
                      ? 'Try adjusting your filters to see more results.' 
                      : 'Create your first transaction to get started.'}
                  </div>
                </div>
              ) : (
                <table className="transactions-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Account</th>
                      <th>Envelope</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Type</th>
                      <th>Reference</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>{formatDate(transaction.date)}</td>
                        <td>{transaction.account_name}</td>
                        <td>{transaction.envelope_name}</td>
                        <td>{transaction.description}</td>
                        <td>{formatCurrency(transaction.amount)}</td>
                        <td>{getStatusBadge(transaction.status)}</td>
                        <td style={{ textTransform: 'capitalize' }}>{transaction.type}</td>
                        <td>{transaction.reference_number || '-'}</td>
                        <td>
                          <div className="transaction-row-actions">
                            <button
                              onClick={() => handleEdit(transaction)}
                              className="btn btn-primary btn-sm"
                              title="Edit Transaction"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(transaction.id)}
                              className="btn btn-danger btn-sm"
                              title="Delete Transaction"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Pagination */}
          {totalTransactions > 0 && (
            <div className="pagination-container">
              <div className="pagination-info">
                Showing {startIndex} to {endIndex} of {totalTransactions} transactions
              </div>
              <div className="pagination-buttons">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn btn-secondary btn-sm"
                >
                  ← Previous
                </button>
                <span style={{ padding: '0 16px', display: 'flex', alignItems: 'center' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="btn btn-secondary btn-sm"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TransactionManagement;