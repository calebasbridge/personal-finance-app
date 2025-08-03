import React, { useState, useEffect } from 'react';
import { Account, Envelope, CreditCardPayment, PaymentAllocation } from '../database/types';

interface UnpaidTransaction {
  transaction_id: number;
  envelope_id: number;
  envelope_name: string;
  amount: number;
  date: string;
  description: string;
  status: 'unpaid';
}

interface SelectedTransaction {
  transaction_id: number;
  envelope_id: number;
  cash_envelope_id: number;
  original_amount: number;
  payment_amount: number;
  is_partial: boolean;
  description: string;
  envelope_name: string;
  cash_envelope_name: string;
}

const CreditCardPaymentWizard: React.FC = () => {
  const [creditCards, setCreditCards] = useState<Account[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [unpaidTransactions, setUnpaidTransactions] = useState<UnpaidTransaction[]>([]);
  const [cashEnvelopes, setCashEnvelopes] = useState<Envelope[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<SelectedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Load credit cards on component mount
  useEffect(() => {
    const loadCreditCards = async () => {
      try {
        // Use transaction-aware balance API instead of static account data
        const accountBalances = await (window as any).electronAPI.balances.getAccountBalancesByStatus();
        
        // Transform account balance data to match the Account interface (like in TransactionEntry)
        const accountsWithCorrectBalances = accountBalances.map((balance: any) => ({
          id: balance.account_id,
          name: balance.account_name,
          type: balance.account_type,
          current_balance: balance.available_balance // Use transaction-aware balance
        }));
        
        const creditCardAccounts = accountsWithCorrectBalances.filter((account: Account) => account.type === 'credit_card');
        setCreditCards(creditCardAccounts);
        
        if (creditCardAccounts.length === 1) {
          setSelectedCardId(creditCardAccounts[0].id);
        }
      } catch (err) {
        setError('Failed to load credit card accounts');
        console.error('Error loading credit cards:', err);
      }
    };

    loadCreditCards();
  }, []);

  // Load transactions and envelopes when credit card is selected
  useEffect(() => {
    const loadData = async () => {
      if (!selectedCardId) {
        setUnpaidTransactions([]);
        setCashEnvelopes([]);
        return;
      }

      try {
        setIsLoading(true);
        
        // Get unpaid transactions for the selected credit card
        const transactions = await (window as any).electronAPI.debt.getUnpaidTransactionsByCreditCard(selectedCardId);
        setUnpaidTransactions(transactions);
        
        // Get all cash envelopes with positive balances
        const envelopeBalances = await (window as any).electronAPI.balances.getEnvelopeBalancesByStatus();
        
        const transformedEnvelopes = envelopeBalances.map((balance: any) => ({
          id: balance.envelope_id,
          name: balance.envelope_name,
          account_id: balance.account_id,
          type: balance.envelope_type,
          current_balance: balance.available_balance
        }));
        
        const availableCashEnvelopes = transformedEnvelopes.filter(
          (env: Envelope) => {
            const isCashEnvelope = env.type === 'cash';
            const hasPositiveBalance = env.current_balance > 0.01;
            return isCashEnvelope && hasPositiveBalance;
          }
        );

        setCashEnvelopes(availableCashEnvelopes);
        
        // Clear previous selections when switching cards
        setSelectedTransactions([]);
        
      } catch (err) {
        setError('Failed to load transaction data');
        console.error('Error loading data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedCardId]);

  // Helper function to suggest matching cash envelope
  const suggestCashEnvelope = (debtEnvelopeName: string): number => {
    // Remove "Credit Card " prefix to find matching cash envelope
    const baseName = debtEnvelopeName.replace('Credit Card ', '');
    const matchingEnvelope = cashEnvelopes.find(env => env.name === baseName);
    return matchingEnvelope?.id || 0;
  };

  // Toggle transaction selection
  const handleTransactionToggle = (transaction: UnpaidTransaction) => {
    const isSelected = selectedTransactions.some(sel => sel.transaction_id === transaction.transaction_id);
    
    if (isSelected) {
      // Remove transaction
      setSelectedTransactions(prev => prev.filter(sel => sel.transaction_id !== transaction.transaction_id));
    } else {
      // Add transaction with full payment by default
      const suggestedCashEnvelopeId = suggestCashEnvelope(transaction.envelope_name);
      const cashEnvelope = cashEnvelopes.find(env => env.id === suggestedCashEnvelopeId);
      
      const newSelection: SelectedTransaction = {
        transaction_id: transaction.transaction_id,
        envelope_id: transaction.envelope_id,
        cash_envelope_id: suggestedCashEnvelopeId,
        original_amount: transaction.amount,
        payment_amount: transaction.amount,
        is_partial: false,
        description: transaction.description,
        envelope_name: transaction.envelope_name,
        cash_envelope_name: cashEnvelope?.name || ''
      };
      
      setSelectedTransactions(prev => [...prev, newSelection]);
    }
  };

  // Update selected transaction
  const handleUpdateSelection = (transactionId: number, field: keyof SelectedTransaction, value: any) => {
    setSelectedTransactions(prev => prev.map(sel => {
      if (sel.transaction_id === transactionId) {
        const updated = { ...sel, [field]: value };
        
        // Update cash envelope name when ID changes
        if (field === 'cash_envelope_id') {
          const envelope = cashEnvelopes.find(env => env.id === value);
          updated.cash_envelope_name = envelope?.name || '';
        }
        
        // Update partial status when payment amount changes
        if (field === 'payment_amount') {
          updated.is_partial = value < updated.original_amount;
        }
        
        return updated;
      }
      return sel;
    }));
  };

  const getTotalPaymentAmount = () => {
    return selectedTransactions.reduce((sum, sel) => sum + sel.payment_amount, 0);
  };

  const validatePayment = (): string | null => {
    if (!selectedCardId) return 'Please select a credit card';
    if (selectedTransactions.length === 0) return 'Please select at least one transaction to pay';
    
    // Validate each selected transaction
    for (const selection of selectedTransactions) {
      if (!selection.cash_envelope_id) {
        return `Please select a cash envelope for ${selection.description}`;
      }
      if (selection.payment_amount <= 0) {
        return 'All payment amounts must be greater than zero';
      }
      if (selection.payment_amount > selection.original_amount) {
        return `Payment amount cannot exceed original debt for ${selection.description}`;
      }
      
      // Check if paying envelope has sufficient funds
      const payingEnvelope = cashEnvelopes.find(env => env.id === selection.cash_envelope_id);
      if (!payingEnvelope || payingEnvelope.current_balance < selection.payment_amount) {
        return `Insufficient funds in ${selection.cash_envelope_name} envelope`;
      }
    }

    return null;
  };

  const handlePreviewPayment = () => {
    const validationError = validatePayment();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    // Show preview in console for now
    console.log('Payment Preview:', {
      creditCardId: selectedCardId,
      totalAmount: getTotalPaymentAmount(),
      selectedTransactions: selectedTransactions
    });
  };

  const handleExecutePayment = async () => {
    const validationError = validatePayment();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Create the credit card payment with allocations
      // For now, we'll convert selectedTransactions back to the existing allocation format
      // In the next phase, we'll implement transaction splitting for partial payments
      const paymentData = {
        credit_card_account_id: selectedCardId!,
        total_amount: getTotalPaymentAmount(),
        date: new Date().toISOString(),
        description: `Credit card payment - ${selectedTransactions.length} transaction(s)`,
        allocations: selectedTransactions.map(selection => ({
          envelope_id: selection.cash_envelope_id,
          amount: selection.payment_amount
        }))
      };

      const payment = await (window as any).electronAPI.creditCardPayments.create(paymentData);

      setSuccessMessage(`Payment of ${getTotalPaymentAmount().toFixed(2)} successfully processed!`);
      
      // Reset form
      setSelectedTransactions([]);
      
      // Reload data to reflect changes
      const transactions = await (window as any).electronAPI.debt.getUnpaidTransactionsByCreditCard(selectedCardId!);
      setUnpaidTransactions(transactions);
      
      const envelopeBalances = await (window as any).electronAPI.balances.getEnvelopeBalancesByStatus();
      const transformedEnvelopes = envelopeBalances.map((balance: any) => ({
        id: balance.envelope_id,
        name: balance.envelope_name,
        account_id: balance.account_id,
        type: balance.envelope_type,
        current_balance: balance.available_balance
      }));
      
      const availableCashEnvelopes = transformedEnvelopes.filter(
        (env: Envelope) => env.type === 'cash' && env.current_balance > 0.01
      );
      setCashEnvelopes(availableCashEnvelopes);
      
    } catch (err) {
      setError('Failed to process payment: ' + (err as Error).message);
      console.error('Payment execution error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Credit Card Payment Wizard</h2>

      {/* Credit Card Selection */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Credit Card Account
          </label>
          <select
            value={selectedCardId || ''}
            onChange={(e) => setSelectedCardId(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Credit Card</option>
            {creditCards.map(card => (
              <option key={card.id} value={card.id}>
                {card.name} (Balance: ${Math.abs(card.current_balance).toFixed(2)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedCardId && (
        <>
          {/* Unpaid Transactions Display */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">
              Unpaid Credit Card Transactions
            </h3>
            {unpaidTransactions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No unpaid transactions on this credit card
              </p>
            ) : (
              <div className="space-y-4">
                {unpaidTransactions.map(transaction => {
                  const isSelected = selectedTransactions.some(sel => sel.transaction_id === transaction.transaction_id);
                  const selection = selectedTransactions.find(sel => sel.transaction_id === transaction.transaction_id);
                  
                  return (
                    <div key={transaction.transaction_id} className="border border-gray-200 rounded-lg p-4">
                      {/* Transaction Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleTransactionToggle(transaction)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div>
                            <div className="font-medium text-gray-900">
                              {transaction.envelope_name} - ${transaction.amount.toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {transaction.description} • {new Date(transaction.date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-red-600">
                            ${transaction.amount.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Unpaid Debt
                          </div>
                        </div>
                      </div>

                      {/* Payment Controls - Show when selected */}
                      {isSelected && selection && (
                        <div className="border-t pt-3 mt-3 bg-gray-50 -mx-4 px-4 pb-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Cash Envelope Selection */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Pay From Cash Envelope
                              </label>
                              <select
                                value={selection.cash_envelope_id}
                                onChange={(e) => handleUpdateSelection(transaction.transaction_id, 'cash_envelope_id', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value={0}>Select Cash Envelope</option>
                                {cashEnvelopes.map(envelope => (
                                  <option key={envelope.id} value={envelope.id}>
                                    {envelope.name} (${envelope.current_balance.toFixed(2)})
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Payment Amount */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Payment Amount
                              </label>
                              <div className="flex space-x-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  max={transaction.amount}
                                  value={selection.payment_amount}
                                  onChange={(e) => handleUpdateSelection(transaction.transaction_id, 'payment_amount', parseFloat(e.target.value) || 0)}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                  onClick={() => handleUpdateSelection(transaction.transaction_id, 'payment_amount', transaction.amount)}
                                  className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                  Full
                                </button>
                              </div>
                            </div>

                            {/* Payment Status */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Payment Type
                              </label>
                              <div className="text-sm">
                                {selection.is_partial ? (
                                  <div>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                      Partial Payment
                                    </span>
                                    <div className="text-xs text-gray-500 mt-1">
                                      Remaining: ${(transaction.amount - selection.payment_amount).toFixed(2)}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Full Payment
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cash Envelopes Available */}
          <div className="bg-green-50 rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-green-800 mb-4">
              Cash Envelopes Available
            </h3>
            {cashEnvelopes.length === 0 ? (
              <p className="text-gray-500">No cash envelopes with funds</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {cashEnvelopes.map(envelope => (
                  <div key={envelope.id} className="bg-white rounded-lg p-4 border-l-4 border-green-400">
                    <div className="font-medium text-gray-900">{envelope.name}</div>
                    <div className="text-lg font-semibold text-green-600">
                      ${envelope.current_balance.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Summary */}
          {selectedTransactions.length > 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Payment Summary</h3>
              
              {/* Selected Transactions List */}
              <div className="space-y-3 mb-6">
                <h4 className="font-medium text-gray-700">Selected Transactions:</h4>
                {selectedTransactions.map(selection => {
                  const transaction = unpaidTransactions.find(t => t.transaction_id === selection.transaction_id);
                  if (!transaction) return null;
                  
                  return (
                    <div key={selection.transaction_id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{selection.envelope_name}</div>
                        <div className="text-sm text-gray-500">
                          {transaction.description} • 
                          {selection.is_partial ? 'Partial' : 'Full'} Payment
                          {selection.cash_envelope_name && (
                            <span> • from {selection.cash_envelope_name}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          ${selection.payment_amount.toFixed(2)}
                        </div>
                        {selection.is_partial && (
                          <div className="text-xs text-gray-500">
                            of ${transaction.amount.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Payment Totals */}
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-lg">
                    <span>Total Payment Amount:</span>
                    <span className="font-semibold text-blue-600">
                      ${getTotalPaymentAmount().toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Selected Transactions:</span>
                    <span>{selectedTransactions.length}</span>
                  </div>
                  
                  {/* Cash Envelope Breakdown */}
                  {(() => {
                    const envelopeBreakdown = selectedTransactions.reduce((acc, sel) => {
                      if (sel.cash_envelope_id && sel.cash_envelope_name) {
                        acc[sel.cash_envelope_name] = (acc[sel.cash_envelope_name] || 0) + sel.payment_amount;
                      }
                      return acc;
                    }, {} as Record<string, number>);
                    
                    return Object.keys(envelopeBreakdown).length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-sm font-medium text-gray-700 mb-2">Payment Breakdown by Envelope:</div>
                        {Object.entries(envelopeBreakdown).map(([envelopeName, amount]) => (
                          <div key={envelopeName} className="flex justify-between text-sm text-gray-600">
                            <span>{envelopeName}:</span>
                            <span>${amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()} 
                </div>
              </div>
            </div>
          ) : unpaidTransactions.length > 0 && (
            <div className="bg-blue-50 rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Ready to Make a Payment?</h3>
              <p className="text-blue-700">
                Select the transactions above that you'd like to pay. You can choose to pay the full amount or enter a partial payment for any transaction.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <button
              onClick={handlePreviewPayment}
              disabled={isLoading || selectedTransactions.length === 0}
              className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Preview Payment
            </button>
            <button
              onClick={handleExecutePayment}
              disabled={isLoading || selectedTransactions.length === 0}
              className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {isLoading ? 'Processing...' : 'Execute Payment'}
            </button>
          </div>
        </>
      )}

      {/* Messages */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-600">{successMessage}</p>
        </div>
      )}
    </div>
  );
};

export default CreditCardPaymentWizard;
