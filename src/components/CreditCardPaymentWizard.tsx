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
    <div className="p-5" style={{ maxWidth: '1200px', margin: '0 auto' }}>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="message message-success">
          ✅ {successMessage}
        </div>
      )}
      
      {error && (
        <div className="message message-error">
          ❌ {error}
        </div>
      )}

      {/* Credit Card Selection */}
      <div className="finance-card mb-5">
        <div style={{ maxWidth: '400px' }}>
          <label className="form-label required">Credit Card Account</label>
          <select
            value={selectedCardId || ''}
            onChange={(e) => setSelectedCardId(e.target.value ? parseInt(e.target.value) : null)}
            className="form-select"
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
          <div className="finance-card mb-5">
            <h3 className="finance-card-title mb-4">
              Unpaid Credit Card Transactions
            </h3>
            {unpaidTransactions.length === 0 ? (
              <div className="text-center text-muted p-10">
                No unpaid transactions on this credit card
              </div>
            ) : (
              <div className="d-flex flex-col gap-4">
                {unpaidTransactions.map(transaction => {
                  const isSelected = selectedTransactions.some(sel => sel.transaction_id === transaction.transaction_id);
                  const selection = selectedTransactions.find(sel => sel.transaction_id === transaction.transaction_id);
                  
                  return (
                    <div key={transaction.transaction_id} className="finance-card" style={{ border: '1px solid #dee2e6' }}>
                      {/* Transaction Header */}
                      <div className="d-flex justify-between align-center mb-3">
                        <div className="d-flex align-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleTransactionToggle(transaction)}
                            style={{ width: '16px', height: '16px' }}
                          />
                          <div>
                            <div className="font-semibold text-dark">
                              {transaction.envelope_name} - ${transaction.amount.toFixed(2)}
                            </div>
                            <div className="text-sm text-muted">
                              {transaction.description} • {new Date(transaction.date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="balance-large text-error currency">
                            ${transaction.amount.toFixed(2)}
                          </div>
                          <div className="text-xs text-muted">
                            Unpaid Debt
                          </div>
                        </div>
                      </div>

                      {/* Payment Controls - Show when selected */}
                      {isSelected && selection && (
                        <div className="border-top pt-3 mt-3 bg-gray-50" style={{ margin: '0 -20px', padding: '16px 20px 16px 20px' }}>
                          <div className="form-grid-3">
                            {/* Cash Envelope Selection */}
                            <div className="form-group">
                              <label className="form-label">Pay From Cash Envelope</label>
                              <select
                                value={selection.cash_envelope_id}
                                onChange={(e) => handleUpdateSelection(transaction.transaction_id, 'cash_envelope_id', parseInt(e.target.value))}
                                className="form-select"
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
                            <div className="form-group">
                              <label className="form-label">Payment Amount</label>
                              <div className="d-flex gap-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  max={transaction.amount}
                                  value={selection.payment_amount}
                                  onChange={(e) => handleUpdateSelection(transaction.transaction_id, 'payment_amount', parseFloat(e.target.value) || 0)}
                                  className="form-input"
                                  style={{ flex: 1 }}
                                />
                                <button
                                  onClick={() => handleUpdateSelection(transaction.transaction_id, 'payment_amount', transaction.amount)}
                                  className="btn btn-sm btn-primary"
                                >
                                  Full
                                </button>
                              </div>
                            </div>

                            {/* Payment Status */}
                            <div className="form-group">
                              <label className="form-label">Payment Type</label>
                              <div className="text-sm">
                                {selection.is_partial ? (
                                  <div>
                                    <span className="badge badge-warning">
                                      Partial Payment
                                    </span>
                                    <div className="text-xs text-muted mt-1">
                                      Remaining: ${(transaction.amount - selection.payment_amount).toFixed(2)}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="badge badge-success">
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
          <div className="finance-card mb-5" style={{ backgroundColor: '#d4edda', border: '1px solid #c3e6cb' }}>
            <h3 className="finance-card-title text-success mb-4">
              Cash Envelopes Available
            </h3>
            {cashEnvelopes.length === 0 ? (
              <div className="text-muted">No cash envelopes with funds</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                {cashEnvelopes.map(envelope => (
                  <div key={envelope.id} className="finance-card" style={{ borderLeft: '4px solid #28a745', padding: '16px' }}>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
                      {envelope.name}
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745', fontFamily: 'monospace' }}>
                      ${envelope.current_balance.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Summary */}
          {selectedTransactions.length > 0 ? (
            <div className="finance-card mb-5">
              <h3 className="finance-card-title mb-4">Payment Summary</h3>
              
              {/* Selected Transactions List */}
              <div className="d-flex flex-col gap-3 mb-5">
                <h4 className="font-semibold text-muted">Selected Transactions:</h4>
                {selectedTransactions.map(selection => {
                  const transaction = unpaidTransactions.find(t => t.transaction_id === selection.transaction_id);
                  if (!transaction) return null;
                  
                  return (
                    <div key={selection.transaction_id} className="d-flex justify-between align-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-semibold">{selection.envelope_name}</div>
                        <div className="text-sm text-muted">
                          {transaction.description} • 
                          {selection.is_partial ? 'Partial' : 'Full'} Payment
                          {selection.cash_envelope_name && (
                            <span> • from {selection.cash_envelope_name}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold currency">
                          ${selection.payment_amount.toFixed(2)}
                        </div>
                        {selection.is_partial && (
                          <div className="text-xs text-muted">
                            of ${transaction.amount.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Payment Totals */}
              <div className="border-top pt-4">
                <div className="d-flex flex-col gap-2">
                  <div className="d-flex justify-between text-lg">
                    <span>Total Payment Amount:</span>
                    <span className="font-semibold text-primary currency">
                      ${getTotalPaymentAmount().toFixed(2)}
                    </span>
                  </div>
                  <div className="d-flex justify-between text-sm text-muted">
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
                      <div className="mt-3 pt-3 border-top">
                        <div className="text-sm font-semibold text-muted mb-2">Payment Breakdown by Envelope:</div>
                        {Object.entries(envelopeBreakdown).map(([envelopeName, amount]) => (
                          <div key={envelopeName} className="d-flex justify-between text-sm text-muted">
                            <span>{envelopeName}:</span>
                            <span className="currency">${amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()} 
                </div>
              </div>
            </div>
          ) : unpaidTransactions.length > 0 && (
            <div className="finance-card mb-5" style={{ backgroundColor: '#d1ecf1', border: '1px solid #bee5eb' }}>
              <h3 className="finance-card-title text-info mb-2">Ready to Make a Payment?</h3>
              <p className="text-info">
                Select the transactions above that you'd like to pay. You can choose to pay the full amount or enter a partial payment for any transaction.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="d-flex justify-end gap-4">
            <button
              onClick={handlePreviewPayment}
              disabled={isLoading || selectedTransactions.length === 0}
              className="btn btn-lg btn-secondary"
            >
              Preview Payment
            </button>
            <button
              onClick={handleExecutePayment}
              disabled={isLoading || selectedTransactions.length === 0}
              className="btn btn-lg btn-success"
            >
              {isLoading ? 'Processing...' : 'Execute Payment'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CreditCardPaymentWizard;