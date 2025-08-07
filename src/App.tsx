import React, { useState } from 'react';
import './styles/design-system.css';
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
import CompensationCreator from './components/CompensationCreator';
import ProfileIndicator from './components/ProfileIndicator';
import ProfileManagementDialog from './components/ProfileManagementDialog';
import DeveloperTools from './components/DeveloperTools';

type CurrentView = 'home' | 'accounts' | 'database-test' | 'envelope-test' | 'transaction-test' | 'balance-test' | 'partial-payment-test' | 'compensation-creator-test' | 'transaction-entry' | 'envelope-transfer' | 'envelope-management' | 'credit-card-payment' | 'compensation-creator' | 'developer-tools';

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
      case 'developer-tools':
        return (
          <DeveloperTools 
            onNavigateBack={() => setCurrentView('home')}
            onNavigateToTest={(testType) => setCurrentView(testType as CurrentView)}
          />
        );
      case 'database-test':
        return (
          <div style={{ padding: '20px' }}>
            <button 
              onClick={() => setCurrentView('developer-tools')}
              className="back-button mb-4"
            >
              ← Back to Developer Tools
            </button>
            <DatabaseTest />
          </div>
        );
      case 'envelope-test':
        return <EnvelopeTest onNavigateBack={() => setCurrentView('developer-tools')} />;
      case 'transaction-test':
        return (
          <div style={{ padding: '20px' }}>
            <button 
              onClick={() => setCurrentView('developer-tools')}
              className="back-button mb-4"
            >
              ← Back to Developer Tools
            </button>
            <TransactionTest />
          </div>
        );
      case 'balance-test':
        return (
          <div style={{ padding: '20px' }}>
            <button 
              onClick={() => setCurrentView('developer-tools')}
              className="back-button mb-4"
            >
              ← Back to Developer Tools
            </button>
            <BalanceIntegrityTest />
          </div>
        );
      case 'partial-payment-test':
        return (
          <div style={{ padding: '20px' }}>
            <button 
              onClick={() => setCurrentView('developer-tools')}
              className="back-button mb-4"
            >
              ← Back to Developer Tools
            </button>
            <PartialPaymentTest />
          </div>
        );
      case 'compensation-creator-test':
        return <CompensationCreatorTest onNavigateBack={() => setCurrentView('developer-tools')} />;
      case 'transaction-entry':
        return <TransactionEntry onNavigateBack={() => setCurrentView('home')} />;
      case 'envelope-transfer':
        return <EnvelopeTransfer onNavigateBack={() => setCurrentView('home')} />;
      case 'envelope-management':
        return <EnvelopeManagement onNavigateBack={() => setCurrentView('home')} />;
      case 'credit-card-payment':
        return (
          <div style={{ padding: '20px' }}>
            <div className="page-header" style={{ marginBottom: '24px' }}>
              <h1 className="page-title">💳 Credit Card Payment Wizard</h1>
            </div>
            <CreditCardPaymentPage />
          </div>
        );
      case 'compensation-creator':
        return (
          <div>
            <div style={{ padding: '20px 20px 0 20px' }}>
              <div className="page-header" style={{ marginBottom: '24px' }}>
                <h1 className="page-title">💰 Compensation Creator</h1>
                <p className="page-subtitle">Calculate twice-monthly self-employment payments with debt analysis and funding targets</p>
              </div>
            </div>
            <CompensationCreator />
          </div>
        );
      default:
        return (
          <div className="App">
            <header className="App-header" style={{ 
              padding: '40px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100vh',
              position: 'relative'
            }}>
              {/* Header with Profile Indicator */}
              <div style={{ 
                position: 'absolute',
                top: '20px',
                right: '20px',
                zIndex: 1000
              }}>
                <ProfileIndicator onManageProfilesClick={() => setIsProfileDialogOpen(true)} />
              </div>

              {/* Menu Bar with Developer Tools */}
              <div style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                zIndex: 1000
              }}>
                <div style={{
                  background: '#2a3441',
                  borderRadius: '8px',
                  padding: '8px',
                  fontSize: '14px'
                }}>
                  <button
                    onClick={() => setCurrentView('developer-tools')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#61dafb',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#334155'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                  >
                    Developer Tools
                  </button>
                </div>
              </div>

              {/* Main Title */}
              <h1 style={{ marginBottom: '60px', fontSize: '2.5rem' }}>Personal Finance App</h1>

              {/* MAIN NAVIGATION - Centered */}
              <div className="nav-section" style={{ maxWidth: '800px', width: '100%' }}>
                <div className="nav-grid" style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '20px',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <button 
                    onClick={() => setCurrentView('transaction-entry')}
                    className="nav-btn nav-btn-primary"
                  >
                    📝 Enter Transaction
                  </button>
                  
                  <button 
                    onClick={() => setCurrentView('envelope-transfer')}
                    className="nav-btn nav-btn-success"
                  >
                    📋 Envelope Transfer
                  </button>
                  
                  <button 
                    onClick={() => setCurrentView('envelope-management')}
                    className="nav-btn nav-btn-purple"
                  >
                    📂 Manage Envelopes
                  </button>
                  
                  <button 
                    onClick={() => setCurrentView('credit-card-payment')}
                    className="nav-btn nav-btn-danger"
                  >
                    💳 Pay Credit Card
                  </button>
                  
                  <button 
                    onClick={() => setCurrentView('compensation-creator')}
                    className="nav-btn nav-btn-orange"
                  >
                    💰 Compensation Creator
                  </button>
                  
                  <button 
                    onClick={() => setCurrentView('accounts')}
                    className="nav-btn nav-btn-teal"
                  >
                    💳 Manage Accounts
                  </button>
                </div>
              </div>

              {/* Copyright Footer */}
              <div style={{ 
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                fontSize: '12px',
                color: '#8892b0'
              }}>
                © Canto Chao, Inc. 2025
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
        padding: '12px 20px', 
        borderBottom: '1px solid #334155',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: '48px'
      }}>
        <button
          onClick={() => setCurrentView('home')}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
            fontFamily: 'Arial, sans-serif'
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