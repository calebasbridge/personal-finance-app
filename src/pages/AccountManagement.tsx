import React, { useState, useEffect } from 'react';
import { Account, NewAccount } from '../database/types';
import AccountForm from '../components/AccountForm';
import AccountList from '../components/AccountList';

type ViewMode = 'list' | 'form';

interface AccountManagementProps {
  onNavigateHome: () => void;
}

const AccountManagement: React.FC<AccountManagementProps> = ({ onNavigateHome }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingAccount, setEditingAccount] = useState<Account | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [breadcrumbHover, setBreadcrumbHover] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  // Add keyboard navigation (Escape to go back to home)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && viewMode === 'list') {
        onNavigateHome();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onNavigateHome, viewMode]);

  const loadAccounts = async () => {
    try {
      setIsLoading(true);
      setError('');
      const result = await window.electronAPI.database.getAllAccounts();
      setAccounts(result);
    } catch (err) {
      setError('Failed to load accounts. Please try again.');
      console.error('Error loading accounts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingAccount(undefined);
    setViewMode('form');
    setError('');
    setSuccessMessage('');
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setViewMode('form');
    setError('');
    setSuccessMessage('');
  };

  const handleSave = async (accountData: Account | NewAccount) => {
    try {
      setError('');
      setSuccessMessage('');

      if (editingAccount) {
        // Update existing account
        const updatedAccount = await window.electronAPI.database.updateAccount({
          id: editingAccount.id,
          ...accountData
        });
        
        setAccounts(prev => 
          prev.map(acc => acc.id === editingAccount.id ? updatedAccount : acc)
        );
        setSuccessMessage('Account updated successfully!');
      } else {
        // Create new account
        const newAccount = await window.electronAPI.database.createAccount(accountData as NewAccount);
        setAccounts(prev => [...prev, newAccount]);
        setSuccessMessage('Account created successfully!');
      }

      // Stay in form mode to show success message, then auto-return to list
      setTimeout(() => {
        setViewMode('list');
        setEditingAccount(undefined);
        setSuccessMessage('');
      }, 2000);

    } catch (err) {
      setError(`Failed to ${editingAccount ? 'update' : 'create'} account. Please try again.`);
      console.error('Error saving account:', err);
    }
  };

  const handleDelete = async (accountId: number) => {
    try {
      setError('');
      setSuccessMessage('');
      
      await window.electronAPI.database.deleteAccount(accountId);
      setAccounts(prev => prev.filter(acc => acc.id !== accountId));
      setSuccessMessage('Account deleted successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);

    } catch (err) {
      setError('Failed to delete account. Please try again.');
      console.error('Error deleting account:', err);
    }
  };

  const handleCancel = () => {
    setViewMode('list');
    setEditingAccount(undefined);
    setError('');
    setSuccessMessage('');
  };

  const getPageTitle = () => {
    if (viewMode === 'form') {
      return editingAccount ? 'Edit Account' : 'Create New Account';
    }
    return 'Account Management';
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.breadcrumb}>
          <span 
            style={{
              ...styles.breadcrumbHome,
              ...(breadcrumbHover ? styles.breadcrumbHover : {})
            }}
            onClick={onNavigateHome}
            onMouseEnter={() => setBreadcrumbHover(true)}
            onMouseLeave={() => setBreadcrumbHover(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onNavigateHome();
              }
            }}
            tabIndex={0}
            role="button"
            aria-label="Navigate to home"
          >
            Personal Finance App
          </span>
          <span style={styles.breadcrumbSeparator}>›</span>
          <span style={styles.breadcrumbCurrent}>{getPageTitle()}</span>
        </div>
        
        {viewMode === 'form' && (
          <button
            onClick={handleCancel}
            style={styles.backButton}
          >
            ← Back to Accounts
          </button>
        )}
      </header>

      {/* Global notifications */}
      {error && (
        <div style={styles.errorNotification}>
          <span style={styles.notificationIcon}>⚠️</span>
          {error}
          <button
            onClick={() => setError('')}
            style={styles.closeNotification}
          >
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div style={styles.successNotification}>
          <span style={styles.notificationIcon}>✅</span>
          {successMessage}
          <button
            onClick={() => setSuccessMessage('')}
            style={styles.closeNotification}
          >
            ×
          </button>
        </div>
      )}

      <main style={styles.main}>
        {viewMode === 'list' ? (
          <AccountList
            accounts={accounts}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddNew={handleAddNew}
            isLoading={isLoading}
          />
        ) : (
          <div style={styles.formContainer}>
            <AccountForm
              account={editingAccount}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </div>
        )}
      </main>

      {/* Floating action button for mobile/smaller screens */}
      {viewMode === 'list' && !isLoading && accounts.length > 0 && (
        <button
          onClick={handleAddNew}
          style={styles.fab}
          title="Add New Account"
        >
          +
        </button>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
    position: 'relative' as const,
  },
  header: {
    backgroundColor: 'white',
    borderBottom: '1px solid #e1e8ed',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky' as const,
    top: 0,
    zIndex: 10,
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
  },
  breadcrumbHome: {
    color: '#3498db',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'color 0.2s ease, text-decoration 0.2s ease',
    padding: '2px 4px',
    borderRadius: '2px',
    outline: 'none',
  },
  breadcrumbHover: {
    color: '#2980b9',
    textDecoration: 'underline',
  },
  breadcrumbSeparator: {
    color: '#bdc3c7',
  },
  breadcrumbCurrent: {
    color: '#2c3e50',
    fontWeight: '500',
  },
  backButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  main: {
    flex: 1,
    padding: '0',
  },
  formContainer: {
    padding: '24px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    minHeight: 'calc(100vh - 120px)',
  },
  errorNotification: {
    backgroundColor: '#fee',
    color: '#c62828',
    padding: '12px 16px',
    margin: '16px 24px',
    borderRadius: '4px',
    border: '1px solid #f5c6cb',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    position: 'relative' as const,
  },
  successNotification: {
    backgroundColor: '#e8f5e8',
    color: '#2e7d32',
    padding: '12px 16px',
    margin: '16px 24px',
    borderRadius: '4px',
    border: '1px solid #c8e6c9',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    position: 'relative' as const,
  },
  notificationIcon: {
    fontSize: '16px',
  },
  closeNotification: {
    position: 'absolute' as const,
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: 'inherit',
    padding: '4px',
    borderRadius: '2px',
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
  },
  fab: {
    position: 'fixed' as const,
    bottom: '24px',
    right: '24px',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    fontSize: '24px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(52, 152, 219, 0.4)',
    transition: 'all 0.2s ease',
    zIndex: 1000,
    display: 'none', // Will be shown via media query or JS
    '&:hover': {
      backgroundColor: '#2980b9',
      transform: 'scale(1.1)',
      boxShadow: '0 6px 16px rgba(52, 152, 219, 0.5)',
    },
  },
};

// Add responsive styles for FAB
const mediaQuery = window.matchMedia('(max-width: 768px)');
if (mediaQuery.matches) {
  styles.fab.display = 'flex';
  Object.assign(styles.fab, {
    alignItems: 'center',
    justifyContent: 'center',
  });
}

export default AccountManagement;