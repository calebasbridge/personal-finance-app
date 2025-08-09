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
  type: 'cash' | 'debt';
  current_balance: number;
  spending_limit?: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface EnvelopeWithAccount extends Envelope {
  account_name: string;
  account_type: string;
}

interface EnvelopeManagementProps {
  onNavigateBack: () => void;
}

const EnvelopeManagement: React.FC<EnvelopeManagementProps> = ({ onNavigateBack }) => {
  const [envelopes, setEnvelopes] = useState<EnvelopeWithAccount[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingEnvelope, setEditingEnvelope] = useState<EnvelopeWithAccount | null>(null);
  const [filterAccountId, setFilterAccountId] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    account_id: 0,
    type: 'cash' as 'cash' | 'debt',
    current_balance: 0,
    spending_limit: '',
    description: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Get envelopes with transaction-aware balances instead of static balances
      const envelopeBalances = await (window as any).electronAPI.balances.getEnvelopeBalancesByStatus();
      
      // Transform the balance data to match EnvelopeWithAccount interface
      const envelopesWithCorrectBalances = envelopeBalances.map((balance: any) => ({
        id: balance.envelope_id,
        name: balance.envelope_name,
        account_id: balance.account_id,
        type: balance.envelope_type,
        current_balance: balance.available_balance, // Use transaction-aware balance
        spending_limit: 0, // We'll get this from the original envelope data
        description: '', // We'll get this from the original envelope data
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        account_name: balance.account_name,
        account_type: balance.account_type
      }));
      
      // Get the original envelope data for spending_limit, description, and timestamps
      const originalEnvelopes = await (window as any).electronAPI.envelopes.getWithAccount();
      
      // Merge the data
      const mergedEnvelopes = envelopesWithCorrectBalances.map((envelope: any) => {
        const original = originalEnvelopes.find((orig: any) => orig.id === envelope.id);
        return {
          ...envelope,
          spending_limit: original?.spending_limit || undefined,
          description: original?.description || undefined,
          created_at: original?.created_at || envelope.created_at,
          updated_at: original?.updated_at || envelope.updated_at
        };
      });
      
      // Get accounts data
      const accountsData = await (window as any).electronAPI.accounts.getAll();
      
      setEnvelopes(mergedEnvelopes);
      setAccounts(accountsData);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingEnvelope(null);
    setFormData({
      name: '',
      account_id: 0,
      type: 'cash',
      current_balance: 0,
      spending_limit: '',
      description: ''
    });
    setShowForm(true);
    setError('');
    setSuccessMessage('');
  };

  const handleEdit = (envelope: EnvelopeWithAccount) => {
    setEditingEnvelope(envelope);
    setFormData({
      name: envelope.name,
      account_id: envelope.account_id,
      type: envelope.type,
      current_balance: envelope.current_balance,
      spending_limit: envelope.spending_limit?.toString() || '',
      description: envelope.description || ''
    });
    setShowForm(true);
    setError('');
    setSuccessMessage('');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      setError('Envelope name is required');
      return;
    }
    if (formData.account_id === 0) {
      setError('Please select an account');
      return;
    }
    
    try {
      setError('');
      setSuccessMessage('');
      
      const envelopeData = {
        name: formData.name.trim(),
        account_id: formData.account_id,
        type: formData.type,
        current_balance: formData.current_balance,
        spending_limit: formData.spending_limit ? parseFloat(formData.spending_limit) : undefined,
        description: formData.description.trim() || undefined
      };
      
      if (editingEnvelope) {
        // Update existing envelope
        await (window as any).electronAPI.envelopes.update(editingEnvelope.id, envelopeData);
        setSuccessMessage(`Envelope "${formData.name}" updated successfully!`);
      } else {
        // Create new envelope
        await (window as any).electronAPI.envelopes.create(envelopeData);
        setSuccessMessage(`Envelope "${formData.name}" created successfully!`);
      }
      
      // Reload data and close form
      await loadData();
      setShowForm(false);
      setEditingEnvelope(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
    } catch (err) {
      setError(`Failed to ${editingEnvelope ? 'update' : 'create'} envelope. ${err}`);
    }
  };

  const handleDelete = async (envelope: EnvelopeWithAccount) => {
    // Don't allow deletion of unassigned envelopes
    if (envelope.name.toLowerCase().includes('unassigned')) {
      setError('Cannot delete unassigned envelopes - they are created automatically with accounts.');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete "${envelope.name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setError('');
      setSuccessMessage('');
      
      await (window as any).electronAPI.envelopes.delete(envelope.id);
      setSuccessMessage(`Envelope "${envelope.name}" deleted successfully!`);
      
      // Reload data
      await loadData();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
    } catch (err) {
      setError(`Failed to delete envelope. ${err}`);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingEnvelope(null);
    setError('');
    setSuccessMessage('');
  };

  // Filter envelopes
  const filteredEnvelopes = envelopes.filter(envelope => {
    const matchesAccount = filterAccountId === 0 || envelope.account_id === filterAccountId;
    const matchesSearch = searchQuery === '' || 
      envelope.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      envelope.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAccount && matchesSearch;
  });

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getEnvelopeTypeBadgeClass = (type: string): string => {
    return type === 'cash' ? 'badge-cash-envelope' : 'badge-debt-envelope';
  };

  const getAccountTypeBadgeClass = (type: string): string => {
    switch (type) {
      case 'checking': return 'badge-checking';
      case 'savings': return 'badge-savings';
      case 'credit_card': return 'badge-credit';
      case 'cash': return 'badge-cash';
      default: return 'badge-secondary';
    }
  };

  const getBalanceClass = (balance: number): string => {
    if (balance > 0) return 'balance-positive';
    if (balance < 0) return 'balance-negative';
    return 'balance-zero';
  };

  if (isLoading) {
    return (
      <div className="text-center p-5">
        <div>Loading envelopes...</div>
      </div>
    );
  }

  return (
    <div className="p-5" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h2 className="page-title">📂 Envelope Management</h2>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="message message-success">
          ✅ {successMessage}
        </div>
      )}
      
      {error && (
        <div className="message message-error">
          ❌ {error}
        </div>
      )}

      {!showForm ? (
        <>
          {/* Header with Add Button */}
          <div className="d-flex justify-between align-center mb-5">
            <div>
              <h3 className="m-0 mb-1">Envelope Overview</h3>
              <p className="m-0 text-muted text-sm">
                {filteredEnvelopes.length} of {envelopes.length} envelopes
              </p>
            </div>
            <button
              onClick={handleAddNew}
              className="btn btn-lg btn-success"
            >
              + Add New Envelope
            </button>
          </div>

          {/* Filters */}
          <div className="d-flex gap-4 mb-5 flex-wrap">
            <div>
              <label className="form-label">Filter by Account:</label>
              <select
                value={filterAccountId}
                onChange={(e) => setFilterAccountId(parseInt(e.target.value))}
                className="form-select"
              >
                <option value={0}>All Accounts</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.type})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex-1">
              <label className="form-label">Search:</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search envelopes by name or description..."
                className="form-input"
              />
            </div>
          </div>

          {/* Envelope Grid */}
          {filteredEnvelopes.length === 0 ? (
            <div className="text-center p-10 bg-gray-50 rounded-lg">
              <h3>No Envelopes Found</h3>
              <p>Create your first envelope to get started with budget management.</p>
              <button
                onClick={handleAddNew}
                className="btn btn-lg btn-success"
              >
                Create First Envelope
              </button>
            </div>
          ) : (
            <div className="data-grid">
              {filteredEnvelopes.map(envelope => (
                <div key={envelope.id} className="finance-card">
                  <div className="finance-card-header">
                    <div className="flex-1">
                      <h4 className="finance-card-title">{envelope.name}</h4>
                      <div className="d-flex gap-2 mt-2">
                        <span className={`badge ${getEnvelopeTypeBadgeClass(envelope.type)}`}>
                          {envelope.type === 'cash' ? '💰 Cash' : '💳 Debt'}
                        </span>
                        <span className={`badge ${getAccountTypeBadgeClass(envelope.account_type)}`}>
                          {envelope.account_name}
                        </span>
                      </div>
                    </div>
                    <div className="d-flex gap-1">
                      <button
                        onClick={() => handleEdit(envelope)}
                        className="btn btn-sm btn-primary"
                        title="Edit envelope"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(envelope)}
                        disabled={envelope.name.toLowerCase().includes('unassigned')}
                        className="btn btn-sm btn-danger"
                        title={envelope.name.toLowerCase().includes('unassigned') ? 'Cannot delete unassigned envelopes' : 'Delete envelope'}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <div className="finance-card-content">
                    <div className={`balance-large currency ${getBalanceClass(envelope.current_balance)}`}>
                      {formatCurrency(envelope.current_balance)}
                    </div>
                    {envelope.spending_limit && (
                      <div className="text-sm text-muted">
                        Limit: {formatCurrency(envelope.spending_limit)}
                      </div>
                    )}
                  </div>
                  
                  {envelope.description && (
                    <div className="text-sm text-muted mb-3" style={{ fontStyle: 'italic' }}>
                      {envelope.description}
                    </div>
                  )}
                  
                  <div className="finance-card-footer">
                    <div className="text-xs text-muted">
                      Created: {new Date(envelope.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Envelope Form */
        <div className="form-container" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h3 className="m-0 mb-5">
            {editingEnvelope ? `Edit Envelope: ${editingEnvelope.name}` : 'Create New Envelope'}
          </h3>
          
          <form onSubmit={handleFormSubmit}>
            <div className="form-group">
              <label className="form-label required">Envelope Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Groceries, Car Payment, Emergency Fund"
                className="form-input"
              />
            </div>
            
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label required">Account</label>
                <select
                  value={formData.account_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, account_id: parseInt(e.target.value) }))}
                  className="form-select"
                >
                  <option value={0}>Select Account</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.type})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label required">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'cash' | 'debt' }))}
                  className="form-select"
                >
                  <option value="cash">💰 Cash (Asset Tracking)</option>
                  <option value="debt">💳 Debt (Spending Category)</option>
                </select>
              </div>
            </div>
            
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Current Balance</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.current_balance}
                  onChange={(e) => setFormData(prev => ({ ...prev, current_balance: parseFloat(e.target.value) || 0 }))}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Spending Limit (Optional)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.spending_limit}
                  onChange={(e) => setFormData(prev => ({ ...prev, spending_limit: e.target.value }))}
                  placeholder="No limit"
                  className="form-input"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Description (Optional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Purpose of this envelope, notes, etc."
                rows={3}
                className="form-textarea"
              />
            </div>
            
            <div className="form-actions">
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-success"
              >
                {editingEnvelope ? 'Update Envelope' : 'Create Envelope'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default EnvelopeManagement;