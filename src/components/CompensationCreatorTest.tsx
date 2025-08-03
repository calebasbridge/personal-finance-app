// src/components/CompensationCreatorTest.tsx - Test Component for Compensation Creator

import React, { useState } from 'react';
import type { ElectronAPI } from '../types/electron';
import { getElectronAPI } from '../utils/electronAPI';

interface TestResult {
  testName: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  details?: any;
}

export const CompensationCreatorTest: React.FC<{ onNavigateBack: () => void }> = ({ onNavigateBack }) => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateTestResult = (testName: string, status: TestResult['status'], message: string, details?: any) => {
    setTestResults(prev => {
      const existingIndex = prev.findIndex(result => result.testName === testName);
      const newResult: TestResult = { testName, status, message, details };
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newResult;
        return updated;
      } else {
        return [...prev, newResult];
      }
    });
  };

  const runCompensationCreatorTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    const api = getElectronAPI();

    const tests = [
      'Database Schema Creation',
      'Funding Target CRUD Operations',
      'Debt Analysis Functionality',
      'Compensation Calculation',
      'Next Paycheck Date Calculation',
      'Funding Target Suggestions',
      'Integration with Existing Systems'
    ];

    // Initialize all tests as pending
    tests.forEach(test => updateTestResult(test, 'pending', 'Waiting to run...'));

    try {
      // Test 1: Database Schema Creation
      updateTestResult('Database Schema Creation', 'running', 'Verifying funding_targets table creation...');
      try {
        await api.compensation.getAllFundingTargets();
        updateTestResult('Database Schema Creation', 'success', 'Funding targets table created successfully');
      } catch (error) {
        updateTestResult('Database Schema Creation', 'error', `Failed to access funding targets table: ${error}`);
        setIsRunning(false);
        return;
      }

      // Test 2: Funding Target CRUD Operations
      updateTestResult('Funding Target CRUD Operations', 'running', 'Testing CRUD operations...');
      try {
        // Get cash envelopes for testing
        const cashEnvelopes = await api.envelopes.getByType('cash');
        if (cashEnvelopes.length === 0) {
          updateTestResult('Funding Target CRUD Operations', 'error', 'No cash envelopes found for testing');
          setIsRunning(false);
          return;
        }

        // Create test funding target
        const targetData = {
          envelope_id: cashEnvelopes[0].id,
          target_type: 'monthly_minimum' as const,
          target_amount: 500,
          description: 'Test emergency fund'
        };

        const createdTarget = await api.compensation.createFundingTarget(targetData);
        
        // Read the created target
        const retrievedTarget = await api.compensation.getFundingTargetById(createdTarget.id);
        if (!retrievedTarget) {
          throw new Error('Failed to retrieve created funding target');
        }

        // Update the target
        const updateData = {
          target_amount: 750,
          description: 'Updated test emergency fund'
        };
        const updatedTarget = await api.compensation.updateFundingTarget(createdTarget.id, updateData);
        if (!updatedTarget || updatedTarget.target_amount !== 750) {
          throw new Error('Failed to update funding target');
        }

        // Delete the target
        const deleteResult = await api.compensation.deleteFundingTarget(createdTarget.id);
        if (!deleteResult) {
          throw new Error('Failed to delete funding target');
        }

        updateTestResult('Funding Target CRUD Operations', 'success', 'All CRUD operations completed successfully', {
          created: createdTarget,
          updated: updatedTarget,
          deleted: deleteResult
        });
      } catch (error) {
        updateTestResult('Funding Target CRUD Operations', 'error', `CRUD operations failed: ${error}`);
      }

      // Test 3: Debt Analysis Functionality
      updateTestResult('Debt Analysis Functionality', 'running', 'Testing debt analysis...');
      try {
        const debtByEnvelope = await api.compensation.getCurrentDebtByEnvelope();
        updateTestResult('Debt Analysis Functionality', 'success', 
          `Debt analysis completed. Found ${debtByEnvelope.length} debt categories`, 
          debtByEnvelope
        );
      } catch (error) {
        updateTestResult('Debt Analysis Functionality', 'error', `Debt analysis failed: ${error}`);
      }

      // Test 4: Compensation Calculation
      updateTestResult('Compensation Calculation', 'running', 'Testing compensation calculation...');
      try {
        const today = new Date();
        const testDate = today.toISOString().split('T')[0];
        
        const calculation = await api.compensation.calculateCompensation(testDate);
        
        // Verify calculation structure
        if (!calculation.paycheck_date || !calculation.total_payment || 
            !calculation.w2_amount || !calculation.dividend_amount) {
          throw new Error('Invalid calculation structure');
        }

        // Verify 75/25 split
        const expectedW2 = Math.round(calculation.total_payment * 0.75 * 100) / 100;
        const expectedDividend = Math.round(calculation.total_payment * 0.25 * 100) / 100;
        
        if (Math.abs(calculation.w2_amount - expectedW2) > 0.01 || 
            Math.abs(calculation.dividend_amount - expectedDividend) > 0.01) {
          throw new Error('75/25 split calculation incorrect');
        }

        updateTestResult('Compensation Calculation', 'success', 
          `Calculation completed. Total: $${calculation.total_payment.toFixed(2)}, W-2: $${calculation.w2_amount.toFixed(2)}, Dividend: $${calculation.dividend_amount.toFixed(2)}`,
          calculation
        );
      } catch (error) {
        updateTestResult('Compensation Calculation', 'error', `Compensation calculation failed: ${error}`);
      }

      // Test 5: Next Paycheck Date Calculation
      updateTestResult('Next Paycheck Date Calculation', 'running', 'Testing next paycheck date...');
      try {
        const nextDate = await api.compensation.getNextPaycheckDate();
        const parsedDate = new Date(nextDate);
        
        if (isNaN(parsedDate.getTime())) {
          throw new Error('Invalid date returned');
        }

        const day = parsedDate.getDate();
        if (day !== 1 && day !== 15) {
          throw new Error(`Expected 1st or 15th, got ${day}`);
        }

        updateTestResult('Next Paycheck Date Calculation', 'success', 
          `Next paycheck date: ${nextDate} (${day === 1 ? '1st' : '15th'} of month)`,
          { nextDate, day }
        );
      } catch (error) {
        updateTestResult('Next Paycheck Date Calculation', 'error', `Next paycheck calculation failed: ${error}`);
      }

      // Test 6: Funding Target Suggestions
      updateTestResult('Funding Target Suggestions', 'running', 'Testing funding target suggestions...');
      try {
        const suggestions = await api.compensation.suggestFundingTargets();
        updateTestResult('Funding Target Suggestions', 'success', 
          `Generated ${suggestions.length} funding target suggestions`,
          suggestions
        );
      } catch (error) {
        updateTestResult('Funding Target Suggestions', 'error', `Funding target suggestions failed: ${error}`);
      }

      // Test 7: Integration with Existing Systems
      updateTestResult('Integration with Existing Systems', 'running', 'Testing system integration...');
      try {
        // Test envelope integration
        const envelopes = await api.envelopes.getAll();
        
        // Test balance integration
        const balances = await api.balances.getEnvelopeBalancesByStatus();
        
        // Test account integration
        const accounts = await api.accounts.getAll();

        updateTestResult('Integration with Existing Systems', 'success', 
          `Integration verified. Found ${envelopes.length} envelopes, ${balances.length} balance records, ${accounts.length} accounts`,
          { envelopes: envelopes.length, balances: balances.length, accounts: accounts.length }
        );
      } catch (error) {
        updateTestResult('Integration with Existing Systems', 'error', `System integration failed: ${error}`);
      }

    } catch (error) {
      console.error('Test suite failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'running': return '🔄';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return '#6c757d';
      case 'running': return '#007bff';
      case 'success': return '#28a745';
      case 'error': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const successCount = testResults.filter(r => r.status === 'success').length;
  const errorCount = testResults.filter(r => r.status === 'error').length;
  const totalTests = testResults.length;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>💰 Compensation Creator System Test</h1>
          <p style={{ margin: 0, color: '#7f8c8d' }}>
            Comprehensive testing of the Compensation Creator functionality
          </p>
        </div>
        <button
          onClick={onNavigateBack}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ← Back
        </button>
      </div>

      {/* Test Status Summary */}
      {testResults.length > 0 && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Test Summary</h3>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span style={{ color: '#28a745', fontWeight: 'bold' }}>✅ Passed: {successCount}</span>
            <span style={{ color: '#dc3545', fontWeight: 'bold' }}>❌ Failed: {errorCount}</span>
            <span style={{ color: '#6c757d', fontWeight: 'bold' }}>Total: {totalTests}</span>
          </div>
          {totalTests > 0 && (
            <div style={{ marginTop: '10px' }}>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#e9ecef',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(successCount / totalTests) * 100}%`,
                  height: '100%',
                  backgroundColor: successCount === totalTests ? '#28a745' : '#ffc107',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Run Tests Button */}
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <button
          onClick={runCompensationCreatorTests}
          disabled={isRunning}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: isRunning ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontWeight: '600'
          }}
        >
          {isRunning ? '🔄 Running Tests...' : '🚀 Run Compensation Creator Tests'}
        </button>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div style={{ display: 'grid', gap: '15px' }}>
          {testResults.map((result, index) => (
            <div
              key={index}
              style={{
                padding: '15px',
                border: `2px solid ${getStatusColor(result.status)}`,
                borderRadius: '8px',
                backgroundColor: result.status === 'success' ? '#d4edda' :
                                result.status === 'error' ? '#f8d7da' :
                                result.status === 'running' ? '#d1ecf1' : '#f8f9fa'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '20px', marginRight: '10px' }}>
                  {getStatusIcon(result.status)}
                </span>
                <h3 style={{ margin: 0, color: '#2c3e50' }}>{result.testName}</h3>
              </div>
              
              <p style={{ margin: '0 0 10px 30px', color: '#495057' }}>
                {result.message}
              </p>
              
              {result.details && (
                <details style={{ marginLeft: '30px' }}>
                  <summary style={{ cursor: 'pointer', color: '#007bff', fontWeight: '500' }}>
                    View Details
                  </summary>
                  <pre style={{
                    marginTop: '10px',
                    padding: '10px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    fontSize: '12px',
                    overflow: 'auto',
                    maxHeight: '200px'
                  }}>
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Instructions */}
      {testResults.length === 0 && (
        <div style={{
          padding: '20px',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          border: '1px solid #bbdefb'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#1565c0' }}>🧪 Test Information</h3>
          <p style={{ margin: '0 0 10px 0', color: '#1976d2' }}>
            This test suite verifies the complete Compensation Creator system functionality:
          </p>
          <ul style={{ margin: '0 0 15px 20px', color: '#1976d2' }}>
            <li>Database schema creation and table structure</li>
            <li>Funding target CRUD operations (Create, Read, Update, Delete)</li>
            <li>Debt analysis functionality across credit card envelopes</li>
            <li>Compensation calculation with 75/25 W-2/dividend split</li>
            <li>Next paycheck date calculation (1st/15th logic)</li>
            <li>Smart funding target suggestions based on spending history</li>
            <li>Integration with existing envelope and balance systems</li>
          </ul>
          <p style={{ margin: 0, color: '#1976d2', fontWeight: '500' }}>
            Click "Run Compensation Creator Tests" to execute the full test suite!
          </p>
        </div>
      )}
    </div>
  );
};

export default CompensationCreatorTest;
