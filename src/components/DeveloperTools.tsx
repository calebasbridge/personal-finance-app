import React from 'react';

interface DeveloperToolsProps {
  onNavigateBack: () => void;
  onNavigateToTest: (testType: string) => void;
}

const DeveloperTools: React.FC<DeveloperToolsProps> = ({ onNavigateBack, onNavigateToTest }) => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Developer Tools</h1>
        <button className="back-button" onClick={onNavigateBack}>
          ← Back to Home
        </button>
      </div>

      <div className="nav-section">
        <h3 style={{ color: '#61dafb', marginBottom: '20px', fontSize: '18px' }}>
          Testing & Debugging Tools
        </h3>
        <div className="nav-grid">
          <button 
            onClick={() => onNavigateToTest('balance-test')}
            className="nav-btn nav-btn-yellow"
          >
            🔍 Test Balance Fix
          </button>
          
          <button 
            onClick={() => onNavigateToTest('partial-payment-test')}
            className="nav-btn nav-btn-pink"
          >
            🧪 Test Partial Payments
          </button>
          
          <button 
            onClick={() => onNavigateToTest('compensation-creator-test')}
            className="nav-btn nav-btn-indigo"
          >
            💰 Test Compensation Creator
          </button>
          
          <button 
            onClick={() => onNavigateToTest('database-test')}
            className="nav-btn nav-btn-success"
          >
            🔧 Test Database
          </button>

          <button 
            onClick={() => onNavigateToTest('envelope-test')}
            className="nav-btn nav-btn-danger"
          >
            📧 Test Envelopes
          </button>

          <button 
            onClick={() => onNavigateToTest('transaction-test')}
            className="nav-btn nav-btn-purple"
          >
            🔄 Test Transactions
          </button>
        </div>
      </div>

      <div style={{ marginTop: '40px', padding: '20px', background: '#2a3441', borderRadius: '8px' }}>
        <h4 style={{ color: '#61dafb', marginBottom: '15px' }}>Developer Notes</h4>
        <p style={{ color: '#8892b0', fontSize: '14px', lineHeight: '1.5' }}>
          These testing tools are designed for development and debugging purposes. 
          They provide comprehensive testing interfaces for all major application systems 
          including database operations, balance calculations, and transaction processing.
        </p>
      </div>
    </div>
  );
};

export default DeveloperTools;