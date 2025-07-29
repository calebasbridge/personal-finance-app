import React, { useState, useMemo } from 'react';
import { Account, AccountType } from '../database/types';
import AccountItem from './AccountItem';

interface AccountListProps {
  accounts: Account[];
  onEdit: (account: Account) => void;
  onDelete: (accountId: number) => void;
  onAddNew: () => void;
  isLoading?: boolean;
}

type SortField = 'name' | 'type' | 'current_balance' | 'created_at';
type SortDirection = 'asc' | 'desc';

const AccountList: React.FC<AccountListProps> = ({
  accounts,
  onEdit,
  onDelete,
  onAddNew,
  isLoading = false
}) => {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterType, setFilterType] = useState<AccountType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAndSortedAccounts = useMemo(() => {
    let filtered = accounts;

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(account => account.type === filterType);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(account =>
        account.name.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle special cases for sorting
      if (sortField === 'created_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  }, [accounts, sortField, sortDirection, filterType, searchQuery]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '⬆️' : '⬇️';
  };

  const getAccountTypeCounts = () => {
    const counts = accounts.reduce((acc, account) => {
      acc[account.type] = (acc[account.type] || 0) + 1;
      return acc;
    }, {} as Record<AccountType, number>);

    return {
      all: accounts.length,
      checking: counts.checking || 0,
      savings: counts.savings || 0,
      credit_card: counts.credit_card || 0,
      cash: counts.cash || 0,
    };
  };

  const typeCounts = getAccountTypeCounts();

  const getTotalBalance = () => {
    return filteredAndSortedAccounts.reduce((total, account) => {
      // For credit cards, negative balance means debt, so we subtract it from total assets
      if (account.type === 'credit_card') {
        return total - account.current_balance;
      }
      return total + account.current_balance;
    }, 0);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
          <p style={styles.loadingText}>Loading accounts...</p>
        </div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>💳</div>
          <h2 style={styles.emptyTitle}>No Accounts Yet</h2>
          <p style={styles.emptyMessage}>
            Get started by creating your first account
          </p>
          <button onClick={onAddNew} style={styles.addButton}>
            Create First Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleSection}>
          <h2 style={styles.title}>Account Management</h2>
          <div style={styles.summary}>
            <span style={styles.accountCount}>
              {filteredAndSortedAccounts.length} of {accounts.length} accounts
            </span>
            <span style={styles.totalBalance}>
              Net Worth: {formatCurrency(getTotalBalance())}
            </span>
          </div>
        </div>
        <button onClick={onAddNew} style={styles.addButton}>
          + Add New Account
        </button>
      </div>

      <div style={styles.controls}>
        <div style={styles.searchSection}>
          <input
            type="text"
            placeholder="Search accounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filterSection}>
          <label style={styles.filterLabel}>Filter by type:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as AccountType | 'all')}
            style={styles.filterSelect}
          >
            <option value="all">All ({typeCounts.all})</option>
            <option value="checking">Checking ({typeCounts.checking})</option>
            <option value="savings">Savings ({typeCounts.savings})</option>
            <option value="credit_card">Credit Card ({typeCounts.credit_card})</option>
            <option value="cash">Cash ({typeCounts.cash})</option>
          </select>
        </div>

        <div style={styles.sortSection}>
          <label style={styles.sortLabel}>Sort by:</label>
          <div style={styles.sortButtons}>
            <button
              onClick={() => handleSort('name')}
              style={{
                ...styles.sortButton,
                ...(sortField === 'name' ? styles.sortButtonActive : {})
              }}
            >
              Name {getSortIcon('name')}
            </button>
            <button
              onClick={() => handleSort('type')}
              style={{
                ...styles.sortButton,
                ...(sortField === 'type' ? styles.sortButtonActive : {})
              }}
            >
              Type {getSortIcon('type')}
            </button>
            <button
              onClick={() => handleSort('current_balance')}
              style={{
                ...styles.sortButton,
                ...(sortField === 'current_balance' ? styles.sortButtonActive : {})
              }}
            >
              Balance {getSortIcon('current_balance')}
            </button>
            <button
              onClick={() => handleSort('created_at')}
              style={{
                ...styles.sortButton,
                ...(sortField === 'created_at' ? styles.sortButtonActive : {})
              }}
            >
              Date {getSortIcon('created_at')}
            </button>
          </div>
        </div>
      </div>

      {filteredAndSortedAccounts.length === 0 ? (
        <div style={styles.noResults}>
          <p style={styles.noResultsText}>
            No accounts found matching your search criteria.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterType('all');
            }}
            style={styles.clearFiltersButton}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div style={styles.accountGrid}>
          {filteredAndSortedAccounts.map((account) => (
            <AccountItem
              key={account.id}
              account={account}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    flexWrap: 'wrap' as const,
    gap: '16px',
  },
  titleSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#2c3e50',
    margin: '0',
  },
  summary: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap' as const,
  },
  accountCount: {
    fontSize: '14px',
    color: '#7f8c8d',
  },
  totalBalance: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#27ae60',
  },
  addButton: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#2980b9',
    },
  },
  controls: {
    display: 'flex',
    gap: '20px',
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    flexWrap: 'wrap' as const,
    alignItems: 'center',
  },
  searchSection: {
    flex: '1 1 300px',
  },
  searchInput: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '2px solid #e1e8ed',
    borderRadius: '4px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  },
  filterSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: '0 0 auto',
  },
  filterLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#34495e',
  },
  filterSelect: {
    padding: '8px 12px',
    fontSize: '14px',
    border: '2px solid #e1e8ed',
    borderRadius: '4px',
    backgroundColor: 'white',
    outline: 'none',
  },
  sortSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: '0 0 auto',
  },
  sortLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#34495e',
  },
  sortButtons: {
    display: 'flex',
    gap: '4px',
  },
  sortButton: {
    padding: '6px 10px',
    fontSize: '12px',
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  sortButtonActive: {
    backgroundColor: '#3498db',
    color: 'white',
    borderColor: '#3498db',
  },
  accountGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #3498db',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px',
  },
  loadingText: {
    fontSize: '16px',
    color: '#7f8c8d',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px 20px',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: '8px',
  },
  emptyMessage: {
    fontSize: '16px',
    color: '#7f8c8d',
    marginBottom: '24px',
  },
  noResults: {
    textAlign: 'center' as const,
    padding: '40px 20px',
  },
  noResultsText: {
    fontSize: '16px',
    color: '#7f8c8d',
    marginBottom: '16px',
  },
  clearFiltersButton: {
    padding: '10px 20px',
    fontSize: '14px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
};

export default AccountList;