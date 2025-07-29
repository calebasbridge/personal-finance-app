import React, { useState, useEffect } from 'react';
import { Account, NewAccount, AccountType } from '../database/types';

interface AccountFormProps {
  account?: Account;
  onSave: (account: Account | NewAccount) => void;
  onCancel: () => void;
}

const AccountForm: React.FC<AccountFormProps> = ({ account, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'checking' as AccountType,
    initial_balance: 0,
    current_balance: 0
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const isEditMode = !!account;

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        type: account.type,
        initial_balance: account.initial_balance,
        current_balance: account.current_balance
      });
    }
  }, [account]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Account name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Account name must be at least 2 characters';
    }

    if (!formData.type) {
      newErrors.type = 'Account type is required';
    }

    if (isNaN(formData.initial_balance)) {
      newErrors.initial_balance = 'Initial balance must be a valid number';
    }

    if (isEditMode && isNaN(formData.current_balance)) {
      newErrors.current_balance = 'Current balance must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      const accountData = isEditMode 
        ? { 
            ...account!, 
            name: formData.name.trim(),
            type: formData.type,
            initial_balance: formData.initial_balance,
            current_balance: formData.current_balance
          }
        : {
            name: formData.name.trim(),
            type: formData.type,
            initial_balance: formData.initial_balance,
            current_balance: formData.initial_balance
          };

      await onSave(accountData);
      setSuccessMessage(isEditMode ? 'Account updated successfully!' : 'Account created successfully!');
      
      if (!isEditMode) {
        setFormData({
          name: '',
          type: 'checking',
          initial_balance: 0,
          current_balance: 0
        });
      }
    } catch (error) {
      setErrors({ submit: `Failed to ${isEditMode ? 'update' : 'create'} account. Please try again.` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>
        {isEditMode ? 'Edit Account' : 'Create New Account'}
      </h2>
      
      {successMessage && (
        <div style={styles.successMessage}>
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.fieldGroup}>
          <label htmlFor="accountName" style={styles.label}>
            Account Name *
          </label>
          <input
            id="accountName"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              ...styles.input,
              ...(errors.name ? styles.inputError : {})
            }}
            placeholder="Enter account name"
            disabled={isLoading}
          />
          {errors.name && <span style={styles.errorMessage}>{errors.name}</span>}
        </div>

        <div style={styles.fieldGroup}>
          <label htmlFor="accountType" style={styles.label}>
            Account Type *
          </label>
          <select
            id="accountType"
            value={formData.type}
            onChange={(e) => handleInputChange('type', e.target.value as AccountType)}
            style={{
              ...styles.select,
              ...(errors.type ? styles.inputError : {})
            }}
            disabled={isLoading}
          >
            <option value="checking">Checking</option>
            <option value="savings">Savings</option>
            <option value="credit_card">Credit Card</option>
            <option value="cash">Cash</option>
          </select>
          {errors.type && <span style={styles.errorMessage}>{errors.type}</span>}
        </div>

        <div style={styles.fieldGroup}>
          <label htmlFor="initialBalance" style={styles.label}>
            {isEditMode ? 'Initial Balance' : 'Initial Balance *'}
          </label>
          <input
            id="initialBalance"
            type="number"
            step="0.01"
            value={formData.initial_balance}
            onChange={(e) => handleInputChange('initial_balance', parseFloat(e.target.value) || 0)}
            onKeyDown={handleKeyDown}
            style={{
              ...styles.input,
              ...(errors.initial_balance ? styles.inputError : {})
            }}
            placeholder="0.00"
            disabled={isLoading}
          />
          {errors.initial_balance && <span style={styles.errorMessage}>{errors.initial_balance}</span>}
        </div>

        {isEditMode && (
          <div style={styles.fieldGroup}>
            <label htmlFor="currentBalance" style={styles.label}>
              Current Balance
            </label>
            <input
              id="currentBalance"
              type="number"
              step="0.01"
              value={formData.current_balance}
              onChange={(e) => handleInputChange('current_balance', parseFloat(e.target.value) || 0)}
              onKeyDown={handleKeyDown}
              style={{
                ...styles.input,
                ...(errors.current_balance ? styles.inputError : {})
              }}
              placeholder="0.00"
              disabled={isLoading}
            />
            {errors.current_balance && <span style={styles.errorMessage}>{errors.current_balance}</span>}
          </div>
        )}

        {errors.submit && (
          <div style={styles.errorMessage}>
            {errors.submit}
          </div>
        )}

        <div style={styles.buttonGroup}>
          <button
            type="button"
            onClick={onCancel}
            style={styles.cancelButton}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              ...styles.saveButton,
              ...(isLoading ? styles.buttonDisabled : {})
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : (isEditMode ? 'Update Account' : 'Create Account')}
          </button>
        </div>
      </form>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '500px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#2c3e50',
    textAlign: 'center' as const,
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#34495e',
    marginBottom: '4px',
  },
  input: {
    padding: '12px',
    fontSize: '16px',
    border: '2px solid #e1e8ed',
    borderRadius: '4px',
    transition: 'border-color 0.2s ease',
    outline: 'none',
  },
  select: {
    padding: '12px',
    fontSize: '16px',
    border: '2px solid #e1e8ed',
    borderRadius: '4px',
    backgroundColor: '#ffffff',
    transition: 'border-color 0.2s ease',
    outline: 'none',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorMessage: {
    fontSize: '12px',
    color: '#e74c3c',
    marginTop: '4px',
  },
  successMessage: {
    padding: '12px',
    backgroundColor: '#d4edda',
    color: '#155724',
    border: '1px solid #c3e6cb',
    borderRadius: '4px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '20px',
  },
  cancelButton: {
    padding: '12px 24px',
    fontSize: '16px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  saveButton: {
    padding: '12px 24px',
    fontSize: '16px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  buttonDisabled: {
    backgroundColor: '#bdc3c7',
    cursor: 'not-allowed',
  },
};

export default AccountForm;