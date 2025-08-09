// src/components/CompensationCreator.tsx - Complete Compensation Creator System

import React, { useState, useEffect } from 'react';
import type { ElectronAPI } from '../types/electron';
import { getElectronAPI } from '../utils/electronAPI';
import {
  FundingTarget,
  CreateFundingTargetData,
  UpdateFundingTargetData,
  FundingTargetWithEnvelope,
  CompensationCalculation,
  FundingTargetType,
  Envelope
} from '../database/types';

interface CompensationCreatorProps {
  onClose?: () => void;
}

interface FundingTargetFormData {
  envelope_id: string;
  target_type: FundingTargetType;
  target_amount: string;
  minimum_amount: string;
  description: string;
}

interface PaycheckFormData {
  paycheck_date: string;
  custom_amount: string;
  include_debt_payment: boolean;
  include_funding_targets: boolean;
  additional_amount: string;
  notes: string;
}

export const CompensationCreator: React.FC<CompensationCreatorProps> = ({ onClose }) => {
  console.log('CompensationCreator rendering...');
  
  // State management
  const [activeTab, setActiveTab] = useState<'calculator' | 'targets'>('calculator');
  const [fundingTargets, setFundingTargets] = useState<FundingTargetWithEnvelope[]>([]);
  const [cashEnvelopes, setCashEnvelopes] = useState<Envelope[]>([]);
  const [calculation, setCalculation] = useState<CompensationCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [showTargetForm, setShowTargetForm] = useState(false);
  const [editingTarget, setEditingTarget] = useState<FundingTargetWithEnvelope | null>(null);
  const [targetFormData, setTargetFormData] = useState<FundingTargetFormData>({
    envelope_id: '',
    target_type: 'monthly_minimum',
    target_amount: '',
    minimum_amount: '',
    description: ''
  });

  const [paycheckFormData, setPaycheckFormData] = useState<PaycheckFormData>({
    paycheck_date: '',
    custom_amount: '',
    include_debt_payment: true,
    include_funding_targets: true,
    additional_amount: '',
    notes: ''
  });

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    console.log('Loading initial data...');
    try {
      setLoading(true);
      const api = getElectronAPI();
      console.log('Got API:', api);
      
      // Load funding targets
      console.log('Loading funding targets...');
      const targets = await api.compensation.getFundingTargetsWithEnvelopeInfo();
      console.log('Funding targets loaded:', targets);
      setFundingTargets(targets);

      // Load cash envelopes for target creation
      const envelopes = await api.envelopes.getByType('cash');
      setCashEnvelopes(envelopes);

      // Set default paycheck date to next scheduled date
      const nextDate = await api.compensation.getNextPaycheckDate();
      setPaycheckFormData(prev => ({ ...prev, paycheck_date: nextDate }));

      // Run initial calculation
      await calculateCompensation(nextDate);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(`Failed to load data: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateCompensation = async (date?: string, customAmount?: number) => {
    try {
      setLoading(true);
      const api = getElectronAPI();
      const targetDate = date || paycheckFormData.paycheck_date;
      const amount = customAmount || (paycheckFormData.custom_amount ? parseFloat(paycheckFormData.custom_amount) : undefined);
      
      const result = await api.compensation.calculateCompensation(targetDate, amount);
      setCalculation(result);
    } catch (err) {
      setError(`Failed to calculate compensation: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  // Funding Target Management
  const handleCreateTarget = async () => {
    try {
      setLoading(true);
      setError(null);
      const api = getElectronAPI();

      const targetData: CreateFundingTargetData = {
        envelope_id: parseInt(targetFormData.envelope_id),
        target_type: targetFormData.target_type,
        target_amount: parseFloat(targetFormData.target_amount),
        minimum_amount: targetFormData.minimum_amount ? parseFloat(targetFormData.minimum_amount) : undefined,
        description: targetFormData.description || undefined
      };

      await api.compensation.createFundingTarget(targetData);
      
      // Reload targets
      const updatedTargets = await api.compensation.getFundingTargetsWithEnvelopeInfo();
      setFundingTargets(updatedTargets);
      
      // Reset form
      setTargetFormData({
        envelope_id: '',
        target_type: 'monthly_minimum',
        target_amount: '',
        minimum_amount: '',
        description: ''
      });
      setShowTargetForm(false);
      setSuccess('Funding target created successfully!');
      
      // Recalculate compensation
      await calculateCompensation();
    } catch (err) {
      setError(`Failed to create funding target: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTarget = async () => {
    if (!editingTarget) return;

    try {
      setLoading(true);
      setError(null);
      const api = getElectronAPI();

      const updateData: UpdateFundingTargetData = {
        target_type: targetFormData.target_type,
        target_amount: parseFloat(targetFormData.target_amount),
        minimum_amount: targetFormData.minimum_amount ? parseFloat(targetFormData.minimum_amount) : undefined,
        description: targetFormData.description || undefined
      };

      await api.compensation.updateFundingTarget(editingTarget.id, updateData);
      
      // Reload targets
      const updatedTargets = await api.compensation.getFundingTargetsWithEnvelopeInfo();
      setFundingTargets(updatedTargets);
      
      setEditingTarget(null);
      setShowTargetForm(false);
      setSuccess('Funding target updated successfully!');
      
      // Recalculate compensation
      await calculateCompensation();
    } catch (err) {
      setError(`Failed to update funding target: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTarget = async (targetId: number) => {
    if (!confirm('Are you sure you want to delete this funding target?')) return;

    try {
      setLoading(true);
      const api = getElectronAPI();
      await api.compensation.deleteFundingTarget(targetId);
      
      // Reload targets
      const updatedTargets = await api.compensation.getFundingTargetsWithEnvelopeInfo();
      setFundingTargets(updatedTargets);
      
      setSuccess('Funding target deleted successfully!');
      
      // Recalculate compensation
      await calculateCompensation();
    } catch (err) {
      setError(`Failed to delete funding target: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const startEditTarget = (target: FundingTargetWithEnvelope) => {
    setEditingTarget(target);
    setTargetFormData({
      envelope_id: target.envelope_id.toString(),
      target_type: target.target_type,
      target_amount: target.target_amount.toString(),
      minimum_amount: target.minimum_amount?.toString() || '',
      description: target.description || ''
    });
    setShowTargetForm(true);
  };

  const getTargetTypeDescription = (type: FundingTargetType): string => {
    switch (type) {
      case 'monthly_minimum':
        return 'Maintain minimum balance each month';
      case 'per_paycheck':
        return 'Add this amount every paycheck';
      case 'monthly_stipend':
        return 'Monthly stipend with minimum balance';
      default:
        return '';
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  // Render methods
  const renderCalculatorTab = () => (
    <div className="d-flex flex-col gap-5">
      {/* Paycheck Configuration */}
      <div className="finance-card">
        <h3 className="finance-card-title mb-4">💰 Paycheck Configuration</h3>
        
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">Paycheck Date</label>
            <input
              type="date"
              value={paycheckFormData.paycheck_date}
              onChange={(e) => {
                setPaycheckFormData(prev => ({ ...prev, paycheck_date: e.target.value }));
                calculateCompensation(e.target.value);
              }}
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Custom Amount (Optional)</label>
            <input
              type="number"
              step="0.01"
              placeholder="Leave empty for auto-calculation"
              value={paycheckFormData.custom_amount}
              onChange={(e) => {
                setPaycheckFormData(prev => ({ ...prev, custom_amount: e.target.value }));
                calculateCompensation(undefined, e.target.value ? parseFloat(e.target.value) : undefined);
              }}
              className="form-input"
            />
          </div>
        </div>

        <div className="mt-4 d-flex flex-col gap-2">
          <label className="d-flex align-center">
            <input
              type="checkbox"
              checked={paycheckFormData.include_debt_payment}
              onChange={(e) => setPaycheckFormData(prev => ({ ...prev, include_debt_payment: e.target.checked }))}
              style={{ marginRight: '8px' }}
            />
            <span className="text-sm text-muted">Include credit card debt payment</span>
          </label>
          
          <label className="d-flex align-center">
            <input
              type="checkbox"
              checked={paycheckFormData.include_funding_targets}
              onChange={(e) => setPaycheckFormData(prev => ({ ...prev, include_funding_targets: e.target.checked }))}
              style={{ marginRight: '8px' }}
            />
            <span className="text-sm text-muted">Include funding targets</span>
          </label>
        </div>
      </div>

      {/* Calculation Results */}
      {calculation && (
        <div className="finance-card">
          <h3 className="finance-card-title mb-4">📊 Compensation Breakdown</h3>
          
          {/* Summary Cards */}
          <div className="data-grid mb-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
            <div className="finance-card" style={{ backgroundColor: '#d1ecf1', border: '1px solid #bee5eb' }}>
              <div className="text-sm font-semibold text-info">Total Payment</div>
              <div className="balance-large text-info currency">{formatCurrency(calculation.total_payment)}</div>
            </div>
            <div className="finance-card" style={{ backgroundColor: '#d4edda', border: '1px solid #c3e6cb' }}>
              <div className="text-sm font-semibold text-success">W-2 Paycheck (75%)</div>
              <div className="balance-large text-success currency">{formatCurrency(calculation.w2_amount)}</div>
            </div>
            <div className="finance-card" style={{ backgroundColor: '#e2e3f1', border: '1px solid #d1d3e4' }}>
              <div className="text-sm font-semibold" style={{ color: '#6f42c1' }}>Dividend (25%)</div>
              <div className="balance-large currency" style={{ color: '#6f42c1' }}>{formatCurrency(calculation.dividend_amount)}</div>
            </div>
          </div>

          {/* Debt Analysis */}
          {calculation.debt_by_envelope.length > 0 && (
            <div className="mb-5">
              <h4 className="font-semibold text-dark mb-3">🏦 Current Credit Card Debt</h4>
              <div className="finance-card" style={{ backgroundColor: '#f8d7da', border: '1px solid #f5c6cb' }}>
                <div className="d-flex flex-col gap-2">
                  {calculation.debt_by_envelope.map(debt => (
                    <div key={debt.envelope_id} className="d-flex justify-between align-center">
                      <span className="text-sm text-muted">{debt.envelope_name}</span>
                      <span className="font-semibold text-error currency">{formatCurrency(debt.debt_amount)}</span>
                    </div>
                  ))}
                  <div className="border-top pt-2 mt-2" style={{ borderColor: '#f5c6cb' }}>
                    <div className="d-flex justify-between align-center">
                      <span className="font-semibold text-dark">Total Debt</span>
                      <span className="font-bold text-error currency">{formatCurrency(calculation.total_debt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Funding Targets */}
          {calculation.funding_targets.length > 0 && (
            <div>
              <h4 className="font-semibold text-dark mb-3">🎯 Funding Targets</h4>
              <div className="finance-card" style={{ backgroundColor: '#fff3cd', border: '1px solid #ffeaa7' }}>
                <div className="d-flex flex-col gap-2">
                  {calculation.funding_targets.map(target => (
                    <div key={target.envelope_id} className="d-flex justify-between align-center">
                      <div>
                        <span className="text-sm text-muted">{target.envelope_name}</span>
                        <span className="text-xs text-muted ml-2">({target.target_type.replace('_', ' ')})</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-warning">Need: {formatCurrency(target.shortfall)}</div>
                        <div className="text-xs text-muted">Current: {formatCurrency(target.current_balance)}</div>
                      </div>
                    </div>
                  ))}
                  <div className="border-top pt-2 mt-2" style={{ borderColor: '#ffeaa7' }}>
                    <div className="d-flex justify-between align-center">
                      <span className="font-semibold text-dark">Total Shortfall</span>
                      <span className="font-bold text-warning currency">{formatCurrency(calculation.total_shortfall)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderTargetsTab = () => (
    <div className="d-flex flex-col gap-5">
      {/* Add Target Button */}
      <div className="d-flex justify-between align-center">
        <h3 className="finance-card-title">🎯 Funding Targets</h3>
        <button
          onClick={() => {
            setShowTargetForm(true);
            setEditingTarget(null);
            setTargetFormData({
              envelope_id: '',
              target_type: 'monthly_minimum',
              target_amount: '',
              minimum_amount: '',
              description: ''
            });
          }}
          className="btn btn-lg btn-primary"
        >
          Add Target
        </button>
      </div>

      {/* Target Form */}
      {showTargetForm && (
        <div className="form-container">
          <h4 className="font-semibold text-dark mb-4">
            {editingTarget ? 'Edit Funding Target' : 'Create Funding Target'}
          </h4>
          
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label required">Envelope</label>
              <select
                value={targetFormData.envelope_id}
                onChange={(e) => setTargetFormData(prev => ({ ...prev, envelope_id: e.target.value }))}
                className="form-select"
                disabled={!!editingTarget}
              >
                <option value="">Select envelope...</option>
                {cashEnvelopes.map(envelope => (
                  <option key={envelope.id} value={envelope.id.toString()}>
                    {envelope.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label required">Target Type</label>
              <select
                value={targetFormData.target_type}
                onChange={(e) => setTargetFormData(prev => ({ ...prev, target_type: e.target.value as FundingTargetType }))}
                className="form-select"
              >
                <option value="monthly_minimum">Monthly Minimum</option>
                <option value="per_paycheck">Per Paycheck</option>
                <option value="monthly_stipend">Monthly Stipend</option>
              </select>
              <div className="form-help">
                {getTargetTypeDescription(targetFormData.target_type)}
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label required">Target Amount</label>
              <input
                type="number"
                step="0.01"
                value={targetFormData.target_amount}
                onChange={(e) => setTargetFormData(prev => ({ ...prev, target_amount: e.target.value }))}
                className="form-input"
                placeholder="0.00"
              />
            </div>
            
            {targetFormData.target_type === 'monthly_stipend' && (
              <div className="form-group">
                <label className="form-label">Minimum Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={targetFormData.minimum_amount}
                  onChange={(e) => setTargetFormData(prev => ({ ...prev, minimum_amount: e.target.value }))}
                  className="form-input"
                  placeholder="0.00"
                />
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <textarea
              value={targetFormData.description}
              onChange={(e) => setTargetFormData(prev => ({ ...prev, description: e.target.value }))}
              className="form-textarea"
              rows={2}
              placeholder="e.g., Emergency fund for car repairs"
            />
          </div>
          
          <div className="form-actions">
            <button
              onClick={() => {
                setShowTargetForm(false);
                setEditingTarget(null);
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={editingTarget ? handleUpdateTarget : handleCreateTarget}
              disabled={loading || !targetFormData.envelope_id || !targetFormData.target_amount}
              className="btn btn-success"
            >
              {loading ? 'Saving...' : (editingTarget ? 'Update Target' : 'Create Target')}
            </button>
          </div>
        </div>
      )}

      {/* Targets List */}
      <div className="finance-card">
        {fundingTargets.length === 0 ? (
          <div className="text-center p-10 text-muted">
            <p>No funding targets configured.</p>
            <p className="text-sm">Add targets to track envelope funding goals.</p>
          </div>
        ) : (
          <div className="d-flex flex-col gap-4">
            {fundingTargets.map(target => (
              <div key={target.id} className="finance-card" style={{ border: '1px solid #dee2e6' }}>
                <div className="d-flex justify-between align-start">
                  <div className="flex-1">
                    <div className="d-flex align-center gap-2">
                      <h4 className="font-semibold text-dark">{target.envelope_name}</h4>
                      <span className="badge badge-info">
                        {target.target_type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-muted mt-1">{target.account_name}</p>
                    {target.description && (
                      <p className="text-sm text-muted mt-1">{target.description}</p>
                    )}
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className="balance-large text-primary currency">
                      {formatCurrency(target.target_amount)}
                    </div>
                    {target.minimum_amount && (
                      <div className="text-sm text-muted">
                        Min: {formatCurrency(target.minimum_amount)}
                      </div>
                    )}
                    <div className="text-sm text-muted">
                      Current: {formatCurrency(target.available_balance || 0)}
                    </div>
                  </div>
                  
                  <div className="ml-4 d-flex gap-2">
                    <button
                      onClick={() => startEditTarget(target)}
                      className="btn btn-sm btn-primary"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTarget(target.id)}
                      className="btn btn-sm btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-5" style={{ maxWidth: '1200px', margin: '0 auto' }}>

      {/* Status Messages */}
      {error && (
        <div className="message message-error">
          <span>❌ {error}</span>
          <button onClick={clearMessages} className="btn btn-ghost">
            ✕
          </button>
        </div>
      )}

      {success && (
        <div className="message message-success">
          <span>✅ {success}</span>
          <button onClick={clearMessages} className="btn btn-ghost">
            ✕
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-5" style={{ borderBottom: '1px solid #dee2e6' }}>
        <div className="d-flex gap-8" style={{ marginBottom: '-1px' }}>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`btn btn-ghost ${
              activeTab === 'calculator'
                ? 'text-primary'
                : 'text-muted'
            }`}
            style={{
              borderBottom: activeTab === 'calculator' ? '2px solid var(--primary-blue)' : '2px solid transparent',
              borderRadius: '0',
              padding: '8px 4px'
            }}
          >
            📊 Calculator
          </button>
          <button
            onClick={() => setActiveTab('targets')}
            className={`btn btn-ghost ${
              activeTab === 'targets'
                ? 'text-primary'
                : 'text-muted'
            }`}
            style={{
              borderBottom: activeTab === 'targets' ? '2px solid var(--primary-blue)' : '2px solid transparent',
              borderRadius: '0',
              padding: '8px 4px'
            }}
          >
            🎯 Funding Targets ({fundingTargets.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {loading && (
        <div className="text-center p-10">
          <div className="text-lg text-muted">Loading...</div>
        </div>
      )}

      {!loading && (
        <div>
          {activeTab === 'calculator' && renderCalculatorTab()}
          {activeTab === 'targets' && renderTargetsTab()}
        </div>
      )}
    </div>
  );
};

export default CompensationCreator;