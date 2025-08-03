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

  const getEnvelopeTypeColor = (type: string): string => {
    return type === 'cash' ? '#28a745' : '#dc3545';
  };

  const getAccountTypeColor = (type: string): string => {
    switch (type) {
      case 'checking': return '#3498db';
      case 'savings': return '#27ae60';
      case 'credit_card': return '#e74c3c';
      case 'cash': return '#f39c12';
      default: return '#95a5a6';
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading envelopes...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
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
        <h2 style={{ display: 'inline', margin: 0 }}>📂 Envelope Management</h2>
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
      
      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          ❌ {error}
        </div>
      )}

      {!showForm ? (
        <>
          {/* Header with Add Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: '0 0 5px 0' }}>Envelope Overview</h3>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                {filteredEnvelopes.length} of {envelopes.length} envelopes
              </p>
            </div>
            <button
              onClick={handleAddNew}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              + Add New Envelope
            </button>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Filter by Account:</label>
              <select
                value={filterAccountId}
                onChange={(e) => setFilterAccountId(parseInt(e.target.value))}
                style={{
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value={0}>All Accounts</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.type})
                  </option>
                ))}
              </select>
            </div>
            
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Search:</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search envelopes by name or description..."
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

          {/* Envelope Grid */}
          {filteredEnvelopes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h3>No Envelopes Found</h3>
              <p>Create your first envelope to get started with budget management.</p>
              <button
                onClick={handleAddNew}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Create First Envelope
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
              {filteredEnvelopes.map(envelope => (
                <div key={envelope.id} style={{
                  backgroundColor: 'white',
                  border: '1px solid #e1e8ed',
                  borderRadius: '8px',
                  padding: '20px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>{envelope.name}</h4>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: 'white',
                          backgroundColor: getEnvelopeTypeColor(envelope.type)
                        }}>
                          {envelope.type === 'cash' ? '💰 Cash' : '💳 Debt'}
                        </span>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: 'white',
                          backgroundColor: getAccountTypeColor(envelope.account_type)
                        }}>
                          {envelope.account_name}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        onClick={() => handleEdit(envelope)}
                        style={{
                          padding: '6px',
                          backgroundColor: '#17a2b8',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(envelope)}
                        disabled={envelope.name.toLowerCase().includes('unassigned')}
                        style={{
                          padding: '6px',
                          backgroundColor: envelope.name.toLowerCase().includes('unassigned') ? '#6c757d' : '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: envelope.name.toLowerCase().includes('unassigned') ? 'not-allowed' : 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: getEnvelopeTypeColor(envelope.type) }}>
                      {formatCurrency(envelope.current_balance)}
                    </div>
                    {envelope.spending_limit && (
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        Limit: {formatCurrency(envelope.spending_limit)}
                      </div>
                    )}
                  </div>
                  
                  {envelope.description && (
                    <div style={{ fontSize: '14px', color: '#666', fontStyle: 'italic' }}>
                      {envelope.description}
                    </div>
                  )}
                  
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
                    Created: {new Date(envelope.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Envelope Form */
        <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', maxWidth: '600px', margin: '0 auto' }}>
          <h3 style={{ margin: '0 0 20px 0' }}>
            {editingEnvelope ? `Edit Envelope: ${editingEnvelope.name}` : 'Create New Envelope'}
          </h3>
          
          <form onSubmit={handleFormSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Envelope Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Groceries, Car Payment, Emergency Fund"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Account *</label>
                <select
                  value={formData.account_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, account_id: parseInt(e.target.value) }))}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value={0}>Select Account</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.type})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'cash' | 'debt' }))}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="cash">💰 Cash (Asset Tracking)</option>
                  <option value="debt">💳 Debt (Spending Category)</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Current Balance</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.current_balance}
                  onChange={(e) => setFormData(prev => ({ ...prev, current_balance: parseFloat(e.target.value) || 0 }))}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Spending Limit (Optional)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.spending_limit}
                  onChange={(e) => setFormData(prev => ({ ...prev, spending_limit: e.target.value }))}
                  placeholder="No limit"
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
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description (Optional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Purpose of this envelope, notes, etc."
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
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