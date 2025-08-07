import React, { useState } from 'react';
import { Account } from '../database/types';

interface AccountItemProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (accountId: number) => void;
}

const AccountItem: React.FC<AccountItemProps> = ({ account, onEdit, onDelete }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getAccountTypeDisplay = (type: string): string => {
    switch (type) {
      case 'checking':
        return 'Checking';
      case 'savings':
        return 'Savings';
      case 'credit_card':
        return 'Credit Card';
      case 'cash':
        return 'Cash';
      default:
        return type;
    }
  };

  const getAccountTypeBadgeClass = (type: string): string => {
    switch (type) {
      case 'checking':
        return 'badge badge-checking';
      case 'savings':
        return 'badge badge-savings';
      case 'credit_card':
        return 'badge badge-credit';
      case 'cash':
        return 'badge badge-cash';
      default:
        return 'badge badge-secondary';
    }
  };

  const getBalanceClass = (balance: number, type: string): string => {
    if (type === 'credit_card') {
      return balance > 0 ? 'balance-negative' : 'balance-positive';
    }
    return balance >= 0 ? 'balance-positive' : 'balance-negative';
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(account.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Failed to delete account:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    onEdit(account);
  };

  if (showDeleteConfirm) {
    return (
      <div className="finance-card">
        <div className="text-center">
          <h3 className="text-xl font-bold text-error mb-3">Confirm Delete</h3>
          <p className="text-base text-dark mb-2">
            Are you sure you want to delete "{account.name}"?
          </p>
          <p className="text-sm text-error mb-5" style={{ fontStyle: 'italic' }}>
            This action cannot be undone.
          </p>
          <div className="d-flex gap-3 justify-center">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="btn btn-secondary"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className={`btn btn-danger ${isDeleting ? 'disabled' : ''}`}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="finance-card">
      <div className="finance-card-header">
        <div className="d-flex flex-col gap-2">
          <h3 className="finance-card-title">{account.name}</h3>
          <span className={getAccountTypeBadgeClass(account.type)}>
            {getAccountTypeDisplay(account.type)}
          </span>
        </div>
        <div className="d-flex gap-2">
          <button
            onClick={handleEdit}
            className="btn btn-sm btn-outline"
            title="Edit Account"
          >
            ✏️
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn btn-sm btn-outline"
            style={{ borderColor: '#e74c3c', color: '#e74c3c' }}
            title="Delete Account"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="finance-card-content">
        <div className="d-flex justify-between align-center mb-2">
          <span className="text-sm text-muted font-medium">Current Balance:</span>
          <span className={`text-lg font-bold currency ${getBalanceClass(account.current_balance, account.type)}`}>
            {formatCurrency(account.current_balance)}
          </span>
        </div>
        {account.initial_balance !== account.current_balance && (
          <div className="d-flex justify-between align-center">
            <span className="text-sm text-muted font-medium">Initial Balance:</span>
            <span className="text-sm text-muted currency">
              {formatCurrency(account.initial_balance)}
            </span>
          </div>
        )}
      </div>

      <div className="finance-card-footer">
        <span className="text-xs text-muted">
          Created: {formatDate(account.created_at)}
        </span>
        {account.updated_at !== account.created_at && (
          <span className="text-xs text-muted">
            Updated: {formatDate(account.updated_at)}
          </span>
        )}
      </div>
    </div>
  );
};

export default AccountItem;