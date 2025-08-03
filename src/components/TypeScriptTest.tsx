// Simple TypeScript test to verify API types are working
import React from 'react';
import { getElectronAPI, isElectronAPIAvailable } from '../utils/electronAPI';

interface TypeScriptTestProps {
  onClose?: () => void;
}

export const TypeScriptTest: React.FC<TypeScriptTestProps> = ({ onClose }) => {
  const testAPI = () => {
    // Test if we can access the electronAPI
    console.log('Testing electronAPI access...');
    
    try {
      // Just test if the property exists without calling it
      const hasAPI = isElectronAPIAvailable();
      
      if (hasAPI) {
        const api = getElectronAPI();
        const hasCompensation = typeof api.compensation !== 'undefined';
        const hasAccounts = typeof api.accounts !== 'undefined';
        const hasEnvelopes = typeof api.envelopes !== 'undefined';
        
        console.log('API exists:', hasAPI);
        console.log('Compensation exists:', hasCompensation);
        console.log('Accounts exists:', hasAccounts);
        console.log('Envelopes exists:', hasEnvelopes);
        console.log('Available API sections:', Object.keys(api));
      } else {
        console.log('ElectronAPI is not available');
      }
    } catch (error) {
      console.error('Error testing API:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">TypeScript API Test</h2>
        
        <p className="text-gray-600 mb-4">
          This component tests if TypeScript can properly recognize the electronAPI types.
        </p>
        
        <button
          onClick={testAPI}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Test API Access
        </button>
        
        {onClose && (
          <button
            onClick={onClose}
            className="ml-3 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Close
          </button>
        )}
        
        <div className="mt-4 text-sm text-gray-500">
          <p>Check the browser console for test results.</p>
        </div>
      </div>
    </div>
  );
};

export default TypeScriptTest;
