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

  const getAccountTypeColor = (type: string): string => {
    switch (type) {
      case 'checking':
        return '#3498db';
      case 'savings':
        return '#27ae60';
      case 'credit_card':
        return '#e74c3c';
      case 'cash':
        return '#f39c12';
      default:
        return '#95a5a6';
    }
  };

  const getBalanceColor = (balance: number, type: string): string => {
    if (type === 'credit_card') {
      return balance > 0 ? '#e74c3c' : '#27ae60';
    }
    return balance >= 0 ? '#27ae60' : '#e74c3c';
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
      <div style={styles.card}>
        <div style={styles.confirmDelete}>
          <h3 style={styles.confirmTitle}>Confirm Delete</h3>
          <p style={styles.confirmMessage}>
            Are you sure you want to delete "{account.name}"?
          </p>
          <p style={styles.confirmWarning}>
            This action cannot be undone.
          </p>
          <div style={styles.confirmButtons}>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              style={styles.cancelButton}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              style={{
                ...styles.deleteButton,
                ...(isDeleting ? styles.buttonDisabled : {})
              }}
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
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.accountInfo}>
          <h3 style={styles.accountName}>{account.name}</h3>
          <span
            style={{
              ...styles.accountType,
              backgroundColor: getAccountTypeColor(account.type),
            }}
          >
            {getAccountTypeDisplay(account.type)}
          </span>
        </div>
        <div style={styles.actions}>
          <button
            onClick={handleEdit}
            style={styles.editButton}
            title="Edit Account"
          >
            ✏️
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={styles.deleteActionButton}
            title="Delete Account"
          >
            🗑️
          </button>
        </div>
      </div>

      <div style={styles.balanceSection}>
        <div style={styles.balanceItem}>
          <span style={styles.balanceLabel}>Current Balance:</span>
          <span
            style={{
              ...styles.balanceValue,
              color: getBalanceColor(account.current_balance, account.type),
            }}
          >
            {formatCurrency(account.current_balance)}
          </span>
        </div>
        {account.initial_balance !== account.current_balance && (
          <div style={styles.balanceItem}>
            <span style={styles.balanceLabel}>Initial Balance:</span>
            <span style={styles.initialBalance}>
              {formatCurrency(account.initial_balance)}
            </span>
          </div>
        )}
      </div>

      <div style={styles.footer}>
        <span style={styles.dateInfo}>
          Created: {formatDate(account.created_at)}
        </span>
        {account.updated_at !== account.created_at && (
          <span style={styles.dateInfo}>
            Updated: {formatDate(account.updated_at)}
          </span>
        )}
      </div>
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e1e8ed',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
    cursor: 'default',
    '&:hover': {
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
      transform: 'translateY(-2px)',
    },
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  accountInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  accountName: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#2c3e50',
    margin: '0',
  },
  accountType: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  editButton: {
    padding: '8px',
    backgroundColor: 'transparent',
    border: '1px solid #3498db',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#3498db',
    },
  },
  deleteActionButton: {
    padding: '8px',
    backgroundColor: 'transparent',
    border: '1px solid #e74c3c',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#e74c3c',
    },
  },
  balanceSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    marginBottom: '16px',
  },
  balanceItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: '14px',
    color: '#7f8c8d',
    fontWeight: '500',
  },
  balanceValue: {
    fontSize: '18px',
    fontWeight: 'bold',
  },
  initialBalance: {
    fontSize: '14px',
    color: '#95a5a6',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '12px',
    borderTop: '1px solid #ecf0f1',
    flexWrap: 'wrap' as const,
    gap: '8px',
  },
  dateInfo: {
    fontSize: '12px',
    color: '#95a5a6',
  },
  confirmDelete: {
    textAlign: 'center' as const,
  },
  confirmTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#e74c3c',
    margin: '0 0 12px 0',
  },
  confirmMessage: {
    fontSize: '16px',
    color: '#2c3e50',
    margin: '0 0 8px 0',
  },
  confirmWarning: {
    fontSize: '14px',
    color: '#e74c3c',
    margin: '0 0 20px 0',
    fontStyle: 'italic',
  },
  confirmButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  cancelButton: {
    padding: '10px 20px',
    fontSize: '14px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  deleteButton: {
    padding: '10px 20px',
    fontSize: '14px',
    backgroundColor: '#e74c3c',
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

export default AccountItem;