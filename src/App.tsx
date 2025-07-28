import React, { useState } from 'react';
import './App.css';
import DatabaseTest from './components/DatabaseTest';

const App: React.FC = () => {
  const [showDatabaseTest, setShowDatabaseTest] = useState(false);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Personal Finance App</h1>
        {!showDatabaseTest ? (
          <>
            <p>Hello World! 🚀</p>
            <p>Welcome to your new Electron + React + TypeScript desktop application.</p>
            <div className="features">
              <h2>Features to implement:</h2>
              <ul>
                <li>✅ Electron + React + TypeScript setup</li>
                <li>✅ SQLite integration ready</li>
                <li>⏳ Transaction tracking</li>
                <li>⏳ Budget management</li>
                <li>⏳ Financial reports</li>
              </ul>
            </div>
            <button 
              onClick={() => setShowDatabaseTest(true)}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: '#007acc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '20px'
              }}
            >
              Test Database
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={() => setShowDatabaseTest(false)}
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
          </>
        )}
      </header>
    </div>
  );
};

export default App;