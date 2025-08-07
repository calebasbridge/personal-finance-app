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
    <div className="form-container">
      <h2 className="page-title text-center">
        {isEditMode ? 'Edit Account' : 'Create New Account'}
      </h2>
      
      {successMessage && (
        <div className="message message-success">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="accountName" className="form-label required">
            Account Name
          </label>
          <input
            id="accountName"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            onKeyDown={handleKeyDown}
            className={`form-input ${errors.name ? 'error' : ''}`}
            placeholder="Enter account name"
            disabled={isLoading}
          />
          {errors.name && <span className="form-error">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="accountType" className="form-label required">
            Account Type
          </label>
          <select
            id="accountType"
            value={formData.type}
            onChange={(e) => handleInputChange('type', e.target.value as AccountType)}
            className={`form-select ${errors.type ? 'error' : ''}`}
            disabled={isLoading}
          >
            <option value="checking">Checking</option>
            <option value="savings">Savings</option>
            <option value="credit_card">Credit Card</option>
            <option value="cash">Cash</option>
          </select>
          {errors.type && <span className="form-error">{errors.type}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="initialBalance" className={`form-label ${!isEditMode ? 'required' : ''}`}>
            Initial Balance
          </label>
          <input
            id="initialBalance"
            type="number"
            step="0.01"
            value={formData.initial_balance}
            onChange={(e) => handleInputChange('initial_balance', parseFloat(e.target.value) || 0)}
            onKeyDown={handleKeyDown}
            className={`form-input ${errors.initial_balance ? 'error' : ''}`}
            placeholder="0.00"
            disabled={isLoading}
          />
          {errors.initial_balance && <span className="form-error">{errors.initial_balance}</span>}
        </div>

        {isEditMode && (
          <div className="form-group">
            <label htmlFor="currentBalance" className="form-label">
              Current Balance
            </label>
            <input
              id="currentBalance"
              type="number"
              step="0.01"
              value={formData.current_balance}
              onChange={(e) => handleInputChange('current_balance', parseFloat(e.target.value) || 0)}
              onKeyDown={handleKeyDown}
              className={`form-input ${errors.current_balance ? 'error' : ''}`}
              placeholder="0.00"
              disabled={isLoading}
            />
            {errors.current_balance && <span className="form-error">{errors.current_balance}</span>}
          </div>
        )}

        {errors.submit && (
          <div className="message message-error">
            {errors.submit}
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`btn btn-primary ${isLoading ? 'disabled' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : (isEditMode ? 'Update Account' : 'Create Account')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AccountForm;