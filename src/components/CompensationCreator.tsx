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
    try {
      setLoading(true);
      const api = getElectronAPI();
      
      // Load funding targets
      const targets = await api.compensation.getFundingTargetsWithEnvelopeInfo();
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
    <div className="space-y-6">
      {/* Paycheck Configuration */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Paycheck Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paycheck Date
            </label>
            <input
              type="date"
              value={paycheckFormData.paycheck_date}
              onChange={(e) => {
                setPaycheckFormData(prev => ({ ...prev, paycheck_date: e.target.value }));
                calculateCompensation(e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Amount (Optional)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="Leave empty for auto-calculation"
              value={paycheckFormData.custom_amount}
              onChange={(e) => {
                setPaycheckFormData(prev => ({ ...prev, custom_amount: e.target.value }));
                calculateCompensation(undefined, e.target.value ? parseFloat(e.target.value) : undefined);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={paycheckFormData.include_debt_payment}
              onChange={(e) => setPaycheckFormData(prev => ({ ...prev, include_debt_payment: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <span className="ml-2 text-sm text-gray-700">Include credit card debt payment</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={paycheckFormData.include_funding_targets}
              onChange={(e) => setPaycheckFormData(prev => ({ ...prev, include_funding_targets: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <span className="ml-2 text-sm text-gray-700">Include funding targets</span>
          </label>
        </div>
      </div>

      {/* Calculation Results */}
      {calculation && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Compensation Breakdown</h3>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-600">Total Payment</div>
              <div className="text-2xl font-bold text-blue-900">{formatCurrency(calculation.total_payment)}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm font-medium text-green-600">W-2 Paycheck (75%)</div>
              <div className="text-2xl font-bold text-green-900">{formatCurrency(calculation.w2_amount)}</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-sm font-medium text-purple-600">Dividend (25%)</div>
              <div className="text-2xl font-bold text-purple-900">{formatCurrency(calculation.dividend_amount)}</div>
            </div>
          </div>

          {/* Debt Analysis */}
          {calculation.debt_by_envelope.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-900 mb-3">🏦 Current Credit Card Debt</h4>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="space-y-2">
                  {calculation.debt_by_envelope.map(debt => (
                    <div key={debt.envelope_id} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">{debt.envelope_name}</span>
                      <span className="font-semibold text-red-600">{formatCurrency(debt.debt_amount)}</span>
                    </div>
                  ))}
                  <div className="border-t border-red-200 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">Total Debt</span>
                      <span className="font-bold text-red-600">{formatCurrency(calculation.total_debt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Funding Targets */}
          {calculation.funding_targets.length > 0 && (
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3">🎯 Funding Targets</h4>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="space-y-2">
                  {calculation.funding_targets.map(target => (
                    <div key={target.envelope_id} className="flex justify-between items-center">
                      <div>
                        <span className="text-sm text-gray-700">{target.envelope_name}</span>
                        <span className="text-xs text-gray-500 ml-2">({target.target_type.replace('_', ' ')})</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-yellow-600">Need: {formatCurrency(target.shortfall)}</div>
                        <div className="text-xs text-gray-500">Current: {formatCurrency(target.current_balance)}</div>
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-yellow-200 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">Total Shortfall</span>
                      <span className="font-bold text-yellow-600">{formatCurrency(calculation.total_shortfall)}</span>
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
    <div className="space-y-6">
      {/* Add Target Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">🎯 Funding Targets</h3>
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
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add Target
        </button>
      </div>

      {/* Target Form */}
      {showTargetForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">
            {editingTarget ? 'Edit Funding Target' : 'Create Funding Target'}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Envelope
              </label>
              <select
                value={targetFormData.envelope_id}
                onChange={(e) => setTargetFormData(prev => ({ ...prev, envelope_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Type
              </label>
              <select
                value={targetFormData.target_type}
                onChange={(e) => setTargetFormData(prev => ({ ...prev, target_type: e.target.value as FundingTargetType }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="monthly_minimum">Monthly Minimum</option>
                <option value="per_paycheck">Per Paycheck</option>
                <option value="monthly_stipend">Monthly Stipend</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {getTargetTypeDescription(targetFormData.target_type)}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={targetFormData.target_amount}
                onChange={(e) => setTargetFormData(prev => ({ ...prev, target_amount: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
            
            {targetFormData.target_type === 'monthly_stipend' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={targetFormData.minimum_amount}
                  onChange={(e) => setTargetFormData(prev => ({ ...prev, minimum_amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
            )}
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={targetFormData.description}
              onChange={(e) => setTargetFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              placeholder="e.g., Emergency fund for car repairs"
            />
          </div>
          
          <div className="mt-6 flex space-x-3">
            <button
              onClick={editingTarget ? handleUpdateTarget : handleCreateTarget}
              disabled={loading || !targetFormData.envelope_id || !targetFormData.target_amount}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (editingTarget ? 'Update Target' : 'Create Target')}
            </button>
            <button
              onClick={() => {
                setShowTargetForm(false);
                setEditingTarget(null);
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Targets List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          {fundingTargets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No funding targets configured.</p>
              <p className="text-sm">Add targets to track envelope funding goals.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fundingTargets.map(target => (
                <div key={target.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-gray-900">{target.envelope_name}</h4>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {target.target_type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{target.account_name}</p>
                      {target.description && (
                        <p className="text-sm text-gray-500 mt-1">{target.description}</p>
                      )}
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className="text-lg font-bold text-blue-600">
                        {formatCurrency(target.target_amount)}
                      </div>
                      {target.minimum_amount && (
                        <div className="text-sm text-gray-500">
                          Min: {formatCurrency(target.minimum_amount)}
                        </div>
                      )}
                      <div className="text-sm text-gray-500">
                        Current: {formatCurrency(target.available_balance || 0)}
                      </div>
                    </div>
                    
                    <div className="ml-4 space-x-2">
                      <button
                        onClick={() => startEditTarget(target)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTarget(target.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
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
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">💰 Compensation Creator</h1>
          <p className="text-gray-600">Calculate twice-monthly self-employment payments with debt analysis and funding targets</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Close
          </button>
        )}
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex justify-between items-center">
            <p className="text-red-800">{error}</p>
            <button onClick={clearMessages} className="text-red-600 hover:text-red-800">
              ✕
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex justify-between items-center">
            <p className="text-green-800">{success}</p>
            <button onClick={clearMessages} className="text-green-600 hover:text-green-800">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'calculator'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📊 Calculator
          </button>
          <button
            onClick={() => setActiveTab('targets')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'targets'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🎯 Funding Targets ({fundingTargets.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="text-lg text-gray-600">Loading...</div>
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
