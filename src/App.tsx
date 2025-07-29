import React, { useState } from 'react';
import './App.css';
import DatabaseTest from './components/DatabaseTest';
import AccountManagement from './pages/AccountManagement';

type CurrentView = 'home' | 'accounts' | 'database-test';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<CurrentView>('home');

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
      default:
        return (
          <div className="App">
            <header className="App-header">
              <h1>Personal Finance App</h1>
              <p>Hello World! 🚀</p>
              <p>Welcome to your new Electron + React + TypeScript desktop application.</p>
              
              <div className="features">
                <h2>Features:</h2>
                <ul>
                  <li>✅ Electron + React + TypeScript setup</li>
                  <li>✅ SQLite integration ready</li>
                  <li>✅ Account Management UI</li>
                  <li>⏳ Transaction tracking</li>
                  <li>⏳ Budget management</li>
                  <li>⏳ Financial reports</li>
                </ul>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '30px', flexWrap: 'wrap' }}>
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
              </div>

              <div style={{ marginTop: '40px', fontSize: '14px', color: '#7f8c8d' }}>
                <p>
                  <strong>Phase 1, Step 3 Complete:</strong> Account Management UI with full CRUD operations
                </p>
                <p>Next: Envelope system implementation</p>
              </div>
            </header>
          </div>
        );
    }
  };

  return currentView === 'home' ? renderContent() : (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {renderContent()}
    </div>
  );
};

export default App;