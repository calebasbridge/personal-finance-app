import React, { useState } from 'react';
import './App.css';
import DatabaseTest from './components/DatabaseTest';
import { EnvelopeTest } from './components/EnvelopeTest';
import TransactionTest from './components/TransactionTest';
import BalanceIntegrityTest from './components/BalanceIntegrityTest';
import PartialPaymentTest from './components/PartialPaymentTest';
import CompensationCreatorTest from './components/CompensationCreatorTest';
import TransactionEntry from './components/TransactionEntry';
import EnvelopeTransfer from './components/EnvelopeTransfer';
import EnvelopeManagement from './components/EnvelopeManagement';
import AccountManagement from './pages/AccountManagement';
import CreditCardPaymentPage from './pages/CreditCardPaymentPage';
import CompensationCreatorPage from './pages/CompensationCreatorPage';
import ProfileIndicator from './components/ProfileIndicator';
import ProfileManagementDialog from './components/ProfileManagementDialog';

type CurrentView = 'home' | 'accounts' | 'database-test' | 'envelope-test' | 'transaction-test' | 'balance-test' | 'partial-payment-test' | 'compensation-creator-test' | 'transaction-entry' | 'envelope-transfer' | 'envelope-management' | 'credit-card-payment' | 'compensation-creator';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<CurrentView>('home');
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

  const handleProfileChanged = () => {
    // This will be called when profiles are created, switched, or deleted
    // You can add any additional logic here if needed
    console.log('Profile changed - UI will refresh');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'accounts':
        return <AccountManagement onNavigateHome={() => setCurrentView('home')} />;
      case 'database-test':
        return (
          <div style={{ padding: '20px' }}>
            <button 
              onClick={() => setCurrentView('home')}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginBottom: '20px'
              }}
            >
              ← Back to Home
            </button>
            <DatabaseTest />
          </div>
        );
      case 'envelope-test':
        return <EnvelopeTest onNavigateBack={() => setCurrentView('home')} />;
      case 'transaction-test':
        return (
          <div style={{ padding: '20px' }}>
            <button 
              onClick={() => setCurrentView('home')}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginBottom: '20px'
              }}
            >
              ← Back to Home
            </button>
            <TransactionTest />
          </div>
        );
      case 'balance-test':
        return (
          <div style={{ padding: '20px' }}>
            <button 
              onClick={() => setCurrentView('home')}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginBottom: '20px'
              }}
            >
              ← Back to Home
            </button>
            <BalanceIntegrityTest />
          </div>
        );
      case 'partial-payment-test':
        return (
          <div style={{ padding: '20px' }}>
            <button 
              onClick={() => setCurrentView('home')}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginBottom: '20px'
              }}
            >
              ← Back to Home
            </button>
            <PartialPaymentTest />
          </div>
        );
      case 'compensation-creator-test':
        return <CompensationCreatorTest onNavigateBack={() => setCurrentView('home')} />;
      case 'transaction-entry':
        return <TransactionEntry onNavigateBack={() => setCurrentView('home')} />;
      case 'envelope-transfer':
        return <EnvelopeTransfer onNavigateBack={() => setCurrentView('home')} />;
      case 'envelope-management':
        return <EnvelopeManagement onNavigateBack={() => setCurrentView('home')} />;
      case 'credit-card-payment':
        return (
          <div style={{ padding: '20px' }}>
            <button 
              onClick={() => setCurrentView('home')}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginBottom: '20px'
              }}
            >
              ← Back to Home
            </button>
            <CreditCardPaymentPage />
          </div>
        );
      case 'compensation-creator':
        return (
          <div style={{ padding: '20px' }}>
            <button 
              onClick={() => setCurrentView('home')}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginBottom: '20px'
              }}
            >
              ← Back to Home
            </button>
            <CompensationCreatorPage />
          </div>
        );
      default:
        return (
          <div className="App">
            <header className="App-header">
              {/* Header with Profile Indicator */}
              <div style={{ 
                position: 'absolute',
                top: '20px',
                right: '20px',
                zIndex: 1000
              }}>
                <ProfileIndicator onManageProfilesClick={() => setIsProfileDialogOpen(true)} />
              </div>

              <h1>Personal Finance App</h1>
              <p>Hello World! 🚀</p>
              <p>Welcome to your new Electron + React + TypeScript desktop application.</p>
              
              <div className="features">
                <h2>Features:</h2>
                <ul>
                  <li>✅ Electron + React + TypeScript setup</li>
                  <li>✅ SQLite integration ready</li>
                  <li>✅ Account Management UI</li>
                  <li>✅ Envelope System with Auto-Unassigned</li>
                  <li>✅ Transaction Management System</li>
                  <li>✅ Multi-Envelope Credit Card Payment System</li>
                  <li>✅ Compensation Creator System</li>
                  <li>⏳ Budget management</li>
                  <li>⏳ Financial reports</li>
                </ul>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '30px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setCurrentView('transaction-entry')}
                  style={{
                    padding: '16px 32px',
                    fontSize: '18px',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'background-color 0.2s ease',
                    boxShadow: '0 4px 8px rgba(23, 162, 184, 0.3)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#138496'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#17a2b8'}
                >
                  📝 Enter Transaction
                </button>
                
                <button 
                  onClick={() => setCurrentView('envelope-transfer')}
                  style={{
                    padding: '16px 32px',
                    fontSize: '18px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'background-color 0.2s ease',
                    boxShadow: '0 4px 8px rgba(40, 167, 69, 0.3)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#218838'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
                >
                  📋 Envelope Transfer
                </button>
                
                <button 
                  onClick={() => setCurrentView('envelope-management')}
                  style={{
                    padding: '16px 32px',
                    fontSize: '18px',
                    backgroundColor: '#6f42c1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'background-color 0.2s ease',
                    boxShadow: '0 4px 8px rgba(111, 66, 193, 0.3)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#59359a'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6f42c1'}
                >
                  📂 Manage Envelopes
                </button>
                
                <button 
                  onClick={() => setCurrentView('credit-card-payment')}
                  style={{
                    padding: '16px 32px',
                    fontSize: '18px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'background-color 0.2s ease',
                    boxShadow: '0 4px 8px rgba(220, 53, 69, 0.3)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c82333'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
                >
                  💳 Pay Credit Card
                </button>
                
                <button 
                  onClick={() => setCurrentView('compensation-creator')}
                  style={{
                    padding: '16px 32px',
                    fontSize: '18px',
                    backgroundColor: '#fd7e14',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'background-color 0.2s ease',
                    boxShadow: '0 4px 8px rgba(253, 126, 20, 0.3)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e56b0c'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fd7e14'}
                >
                  💰 Compensation Creator
                </button>
                
                <button 
                  onClick={() => setCurrentView('balance-test')}
                  style={{
                    padding: '16px 32px',
                    fontSize: '18px',
                    backgroundColor: '#f39c12',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'background-color 0.2s ease',
                    boxShadow: '0 4px 8px rgba(243, 156, 18, 0.3)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e67e22'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f39c12'}
                >
                  🔍 Test Balance Fix
                </button>
                
                <button 
                  onClick={() => setCurrentView('partial-payment-test')}
                  style={{
                    padding: '16px 32px',
                    fontSize: '18px',
                    backgroundColor: '#ff6b35',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'background-color 0.2s ease',
                    boxShadow: '0 4px 8px rgba(255, 107, 53, 0.3)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e55a2b'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ff6b35'}
                >
                  🧪 Test Partial Payments
                </button>
                
                <button 
                  onClick={() => setCurrentView('compensation-creator-test')}
                  style={{
                    padding: '16px 32px',
                    fontSize: '18px',
                    backgroundColor: '#6610f2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'background-color 0.2s ease',
                    boxShadow: '0 4px 8px rgba(102, 16, 242, 0.3)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#520dc2'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6610f2'}
                >
                  💰 Test Compensation Creator
                </button>
                
                <button 
                  onClick={() => setCurrentView('accounts')}
                  style={{
                    padding: '16px 32px',
                    fontSize: '18px',
                    backgroundColor: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2980b9'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3498db'}
                >
                  💳 Manage Accounts
                </button>
                
                <button 
                  onClick={() => setCurrentView('database-test')}
                  style={{
                    padding: '16px 32px',
                    fontSize: '18px',
                    backgroundColor: '#27ae60',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#229954'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#27ae60'}
                >
                  🔧 Test Database
                </button>

                <button 
                  onClick={() => setCurrentView('envelope-test')}
                  style={{
                    padding: '16px 32px',
                    fontSize: '18px',
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c0392b'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#e74c3c'}
                >
                  📧 Test Envelopes
                </button>

                <button 
                  onClick={() => setCurrentView('transaction-test')}
                  style={{
                    padding: '16px 32px',
                    fontSize: '18px',
                    backgroundColor: '#9b59b6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#8e44ad'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#9b59b6'}
                >
                  🔄 Test Transactions
                </button>
              </div>

              <div style={{ marginTop: '40px', fontSize: '14px', color: '#7f8c8d' }}>
                <p>
                  <strong>🏆 Phase 4 COMPLETE:</strong> Compensation Creator System Implemented!
                </p>
                <p>Click "💰 Compensation Creator" to calculate twice-monthly self-employment payments</p>
                <p>The application now includes debt analysis, funding targets, and automatic 75/25 W-2/dividend split!</p>
                <p><strong>🎉 ALL 7 Phase 4 Components Complete:</strong> Professional-grade personal finance application ready!</p>
              </div>

              {/* Profile Management Dialog */}
              <ProfileManagementDialog
                isOpen={isProfileDialogOpen}
                onClose={() => setIsProfileDialogOpen(false)}
                onProfileChanged={handleProfileChanged}
              />
            </header>
          </div>
        );
    }
  };

  return currentView === 'home' ? renderContent() : (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header for non-home pages */}
      <div style={{ 
        background: '#1e293b', 
        padding: '10px 20px', 
        borderBottom: '1px solid #334155',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <button
          onClick={() => setCurrentView('home')}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          ← Back to Home
        </button>
        <ProfileIndicator onManageProfilesClick={() => setIsProfileDialogOpen(true)} />
      </div>
      
      {renderContent()}

      {/* Profile Management Dialog - Available from any page */}
      <ProfileManagementDialog
        isOpen={isProfileDialogOpen}
        onClose={() => setIsProfileDialogOpen(false)}
        onProfileChanged={handleProfileChanged}
      />
    </div>
  );
};

export default App;