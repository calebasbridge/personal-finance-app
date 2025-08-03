import { getDatabase } from './connection';
import {
  CreditCardPayment,
  PaymentAllocation,
  CreateCreditCardPaymentData,
  CreditCardPaymentWithAllocations,
  AccountType,
  EnvelopeType
} from './types';

export class CreditCardPaymentDatabase {
  private db = getDatabase();

  constructor() {
    this.createTables();
  }

  private createTables(): void {
    // Create credit_card_payments table
    const createPaymentsTable = `
      CREATE TABLE IF NOT EXISTS credit_card_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        credit_card_account_id INTEGER NOT NULL,
        total_amount REAL NOT NULL,
        date DATETIME NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (credit_card_account_id) REFERENCES accounts (id) ON DELETE CASCADE,
        CHECK (total_amount > 0)
      )
    `;

    // Create payment_allocations table
    const createAllocationsTable = `
      CREATE TABLE IF NOT EXISTS payment_allocations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        payment_id INTEGER NOT NULL,
        envelope_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (payment_id) REFERENCES credit_card_payments (id) ON DELETE CASCADE,
        FOREIGN KEY (envelope_id) REFERENCES envelopes (id) ON DELETE CASCADE,
        CHECK (amount > 0)
      )
    `;

    // Create indexes for performance
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_credit_card_payments_account_id ON credit_card_payments (credit_card_account_id);
      CREATE INDEX IF NOT EXISTS idx_credit_card_payments_date ON credit_card_payments (date);
      CREATE INDEX IF NOT EXISTS idx_payment_allocations_payment_id ON payment_allocations (payment_id);
      CREATE INDEX IF NOT EXISTS idx_payment_allocations_envelope_id ON payment_allocations (envelope_id);
    `;

    this.db.exec(createPaymentsTable);
    this.db.exec(createAllocationsTable);
    this.db.exec(createIndexes);
  }

  // Credit Card Payment CRUD Operations
  createCreditCardPayment(paymentData: CreateCreditCardPaymentData): CreditCardPaymentWithAllocations {
    // Validate credit card account exists and is actually a credit card
    const account = this.db.prepare('SELECT id, name, type FROM accounts WHERE id = ?').get(paymentData.credit_card_account_id) as { id: number, name: string, type: AccountType };
    if (!account) {
      throw new Error('Credit card account not found');
    }

    if (account.type !== 'credit_card') {
      throw new Error('Account must be a credit card account');
    }

    // Validate allocations sum equals total amount
    const allocationTotal = paymentData.allocations.reduce((sum, allocation) => sum + allocation.amount, 0);
    if (Math.abs(allocationTotal - paymentData.total_amount) > 0.001) {
      throw new Error(`Allocation total (${allocationTotal}) does not match payment total (${paymentData.total_amount})`);
    }

    // Validate all envelopes exist and are cash envelopes
    for (const allocation of paymentData.allocations) {
      const envelope = this.db.prepare('SELECT id, name, type, account_id FROM envelopes WHERE id = ?').get(allocation.envelope_id) as { id: number, name: string, type: EnvelopeType, account_id: number };
      if (!envelope) {
        throw new Error(`Envelope ${allocation.envelope_id} not found`);
      }

      if (envelope.type !== 'cash') {
        throw new Error(`Envelope ${envelope.name} must be a cash envelope for credit card payments`);
      }

      // Validate envelope has sufficient balance
      const balanceStmt = this.db.prepare(`
        SELECT COALESCE(SUM(t.amount), 0) as current_balance
        FROM transactions t
        WHERE t.envelope_id = ? AND t.status IN ('pending', 'cleared')
      `);
      const balanceResult = balanceStmt.get(allocation.envelope_id) as { current_balance: number };
      
      if (balanceResult.current_balance < allocation.amount) {
        throw new Error(`Insufficient funds in envelope ${envelope.name}. Available: ${balanceResult.current_balance}, Required: ${allocation.amount}`);
      }
    }

    // Create payment and allocations in a transaction
    const createPayment = this.db.prepare(`
      INSERT INTO credit_card_payments (credit_card_account_id, total_amount, date, description)
      VALUES (?, ?, ?, ?)
    `);

    const createAllocation = this.db.prepare(`
      INSERT INTO payment_allocations (payment_id, envelope_id, amount)
      VALUES (?, ?, ?)
    `);

    const createFromEnvelopeTransaction = this.db.prepare(`
      INSERT INTO transactions (account_id, envelope_id, amount, date, status, description)
      VALUES (?, ?, ?, ?, 'cleared', ?)
    `);

    const markTransactionAsPaid = this.db.prepare(`
      UPDATE transactions 
      SET status = 'paid' 
      WHERE id = ?
    `);

    let paymentId: number;

    this.db.transaction(() => {
      // Create the payment record
      const paymentResult = createPayment.run(
        paymentData.credit_card_account_id,
        paymentData.total_amount,
        paymentData.date,
        paymentData.description || null
      );

      paymentId = paymentResult.lastInsertRowid as number;

      // Create allocations and mark existing debt transactions as paid
      for (const allocation of paymentData.allocations) {
        // Create allocation record
        createAllocation.run(paymentId, allocation.envelope_id, allocation.amount);

        // Get cash envelope info
        const envelope = this.db.prepare('SELECT account_id, name FROM envelopes WHERE id = ?').get(allocation.envelope_id) as { account_id: number; name: string };

        // Create outgoing transaction from cash envelope (negative amount)
        const fromDescription = `Credit card payment to ${account.name}${paymentData.description ? `: ${paymentData.description}` : ''}`;
        createFromEnvelopeTransaction.run(
          envelope.account_id,
          allocation.envelope_id,
          -allocation.amount,
          paymentData.date,
          fromDescription
        );

        // Find corresponding debt envelope by matching cash envelope name
        // First try exact name matching (e.g., "Electric" cash -> "Credit Card Electric" debt)
        let debtEnvelope = this.db.prepare(`
          SELECT id, name FROM envelopes 
          WHERE account_id = ? AND type = 'debt' AND name LIKE ?
          ORDER BY 
            CASE 
              WHEN name = ? THEN 1  -- Exact match first
              WHEN name LIKE ? THEN 2  -- Contains match second
              ELSE 3
            END
          LIMIT 1
        `).get(
          paymentData.credit_card_account_id, 
          `%${envelope.name}%`,
          `Credit Card ${envelope.name}`,
          `%${envelope.name}%`
        ) as { id: number; name: string } | null;

        // If no name match found, fall back to unassigned debt envelope
        if (!debtEnvelope) {
          debtEnvelope = this.db.prepare(`
            SELECT id, name FROM envelopes 
            WHERE account_id = ? AND type = 'debt' AND name LIKE 'Unassigned%'
            ORDER BY id 
            LIMIT 1
          `).get(paymentData.credit_card_account_id) as { id: number; name: string } | null;
        }

        if (debtEnvelope) {
          // Find unpaid transactions in this debt envelope and mark them as paid
          const unpaidTransactions = this.db.prepare(`
            SELECT id, amount, date, description FROM transactions 
            WHERE envelope_id = ? AND status = 'unpaid' 
            ORDER BY date ASC
          `).all(debtEnvelope.id) as Array<{ id: number; amount: number; date: string; description: string }>;

          let remainingPayment = allocation.amount;
          
          for (const transaction of unpaidTransactions) {
            if (remainingPayment <= 0) break;
            
            if (transaction.amount <= remainingPayment) {
              // Mark entire transaction as paid
              markTransactionAsPaid.run(transaction.id);
              remainingPayment -= transaction.amount;
            } else {
              // Partial payment - split the transaction
              const paidAmount = remainingPayment;
              const remainingAmount = transaction.amount - paidAmount;
              
              // Update the original transaction to reflect only the paid amount
              const updateOriginalTransaction = this.db.prepare(`
                UPDATE transactions 
                SET amount = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
              `);
              updateOriginalTransaction.run(paidAmount, transaction.id);
              
              // Mark the updated transaction as paid
              markTransactionAsPaid.run(transaction.id);
              
              // Create a new unpaid transaction for the remaining amount
              const createRemainingTransaction = this.db.prepare(`
                INSERT INTO transactions (account_id, envelope_id, amount, date, status, description, created_at, updated_at)
                VALUES (?, ?, ?, ?, 'unpaid', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
              `);
              
              const remainingDescription = transaction.description ? 
                `${transaction.description} (Remaining after partial payment)` : 
                'Remaining balance after partial payment';
              
              createRemainingTransaction.run(
                paymentData.credit_card_account_id,
                debtEnvelope.id,
                remainingAmount,
                transaction.date,
                remainingDescription
              );
              
              remainingPayment = 0; // Payment fully allocated
              break;
            }
          }
          
          if (remainingPayment > 0.001) {
            console.warn(`Excess payment of ${remainingPayment} for envelope ${debtEnvelope.name}`);
          }
        }
      }
    })();

    return this.getCreditCardPaymentWithAllocationsById(paymentId!)!;
  }

  getCreditCardPaymentById(id: number): CreditCardPayment | null {
    const stmt = this.db.prepare('SELECT * FROM credit_card_payments WHERE id = ?');
    return stmt.get(id) as CreditCardPayment | null;
  }

  getCreditCardPaymentWithAllocationsById(id: number): CreditCardPaymentWithAllocations | null {
    const payment = this.getCreditCardPaymentById(id);
    if (!payment) {
      return null;
    }

    const allocationsStmt = this.db.prepare(`
      SELECT 
        pa.*,
        e.name as envelope_name,
        a.name as envelope_account_name
      FROM payment_allocations pa
      JOIN envelopes e ON pa.envelope_id = e.id
      JOIN accounts a ON e.account_id = a.id
      WHERE pa.payment_id = ?
      ORDER BY pa.created_at
    `);

    const allocations = allocationsStmt.all(id) as (PaymentAllocation & {
      envelope_name: string;
      envelope_account_name: string;
    })[];

    return {
      ...payment,
      allocations
    };
  }

  getAllCreditCardPayments(): CreditCardPaymentWithAllocations[] {
    const paymentsStmt = this.db.prepare(`
      SELECT * FROM credit_card_payments 
      ORDER BY date DESC, created_at DESC
    `);
    
    const payments = paymentsStmt.all() as CreditCardPayment[];
    
    return payments.map(payment => {
      const withAllocations = this.getCreditCardPaymentWithAllocationsById(payment.id);
      return withAllocations!;
    });
  }

  getCreditCardPaymentsByAccount(accountId: number): CreditCardPaymentWithAllocations[] {
    const paymentsStmt = this.db.prepare(`
      SELECT * FROM credit_card_payments 
      WHERE credit_card_account_id = ?
      ORDER BY date DESC, created_at DESC
    `);
    
    const payments = paymentsStmt.all(accountId) as CreditCardPayment[];
    
    return payments.map(payment => {
      const withAllocations = this.getCreditCardPaymentWithAllocationsById(payment.id);
      return withAllocations!;
    });
  }

  deleteCreditCardPayment(id: number): boolean {
    // This will cascade delete allocations due to foreign key constraints
    // and should also handle related transactions
    const stmt = this.db.prepare('DELETE FROM credit_card_payments WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Debt Analysis Methods
  getDebtByEnvelopeCategory(): Array<{
    envelope_id: number;
    envelope_name: string;
    account_id: number;
    account_name: string;
    unpaid_balance: number;
  }> {
    const stmt = this.db.prepare(`
      SELECT 
        e.id as envelope_id,
        e.name as envelope_name,
        a.id as account_id,
        a.name as account_name,
        COALESCE(SUM(CASE WHEN t.status = 'unpaid' THEN t.amount ELSE 0 END), 0) as unpaid_balance
      FROM envelopes e
      JOIN accounts a ON e.account_id = a.id
      LEFT JOIN transactions t ON e.id = t.envelope_id
      WHERE e.type = 'debt' AND a.type = 'credit_card'
      GROUP BY e.id, e.name, a.id, a.name
      HAVING unpaid_balance != 0
      ORDER BY a.name, e.name
    `);

    return stmt.all() as Array<{
      envelope_id: number;
      envelope_name: string;
      account_id: number;
      account_name: string;
      unpaid_balance: number;
    }>;
  }

  // Enhanced method for transaction-level payment interface
  getUnpaidTransactionsByCreditCard(creditCardAccountId: number): Array<{
    transaction_id: number;
    envelope_id: number;
    envelope_name: string;
    amount: number;
    date: string;
    description: string;
    status: 'unpaid';
  }> {
    const stmt = this.db.prepare(`
      SELECT 
        t.id as transaction_id,
        t.envelope_id,
        e.name as envelope_name,
        t.amount,
        t.date,
        t.description,
        t.status
      FROM transactions t
      JOIN envelopes e ON t.envelope_id = e.id
      WHERE e.account_id = ? 
        AND e.type = 'debt'
        AND t.status = 'unpaid'
      ORDER BY t.date ASC, t.created_at ASC
    `);

    return stmt.all(creditCardAccountId) as Array<{
      transaction_id: number;
      envelope_id: number;
      envelope_name: string;
      amount: number;
      date: string;
      description: string;
      status: 'unpaid';
    }>;
  }

  getCashEnvelopeBalances(): Array<{
    envelope_id: number;
    envelope_name: string;
    account_id: number;
    account_name: string;
    available_balance: number;
  }> {
    const stmt = this.db.prepare(`
      SELECT 
        e.id as envelope_id,
        e.name as envelope_name,
        a.id as account_id,
        a.name as account_name,
        COALESCE(SUM(CASE WHEN t.status IN ('pending', 'cleared') THEN t.amount ELSE 0 END), 0) as available_balance
      FROM envelopes e
      JOIN accounts a ON e.account_id = a.id
      LEFT JOIN transactions t ON e.id = t.envelope_id
      WHERE e.type = 'cash'
      GROUP BY e.id, e.name, a.id, a.name
      ORDER BY a.name, e.name
    `);

    return stmt.all() as Array<{
      envelope_id: number;
      envelope_name: string;
      account_id: number;
      account_name: string;
      available_balance: number;
    }>;
  }

  // Payment Simulation and Planning
  simulatePayment(creditCardAccountId: number, allocations: { envelope_id: number; amount: number }[]): {
    valid: boolean;
    errors: string[];
    totalAmount: number;
    envelopeImpacts: Array<{
      envelope_id: number;
      envelope_name: string;
      current_balance: number;
      after_payment: number;
      sufficient_funds: boolean;
    }>;
  } {
    const errors: string[] = [];
    const envelopeImpacts: Array<{
      envelope_id: number;
      envelope_name: string;
      current_balance: number;
      after_payment: number;
      sufficient_funds: boolean;
    }> = [];

    // Validate credit card account
    const account = this.db.prepare('SELECT id, name, type FROM accounts WHERE id = ?').get(creditCardAccountId) as { id: number, name: string, type: AccountType };
    if (!account) {
      errors.push('Credit card account not found');
      return { valid: false, errors, totalAmount: 0, envelopeImpacts };
    }

    if (account.type !== 'credit_card') {
      errors.push('Account must be a credit card account');
      return { valid: false, errors, totalAmount: 0, envelopeImpacts };
    }

    const totalAmount = allocations.reduce((sum, allocation) => sum + allocation.amount, 0);

    // Check each envelope
    for (const allocation of allocations) {
      const envelope = this.db.prepare(`
        SELECT e.id, e.name, e.type, a.name as account_name
        FROM envelopes e
        JOIN accounts a ON e.account_id = a.id
        WHERE e.id = ?
      `).get(allocation.envelope_id) as { id: number, name: string, type: EnvelopeType, account_name: string };

      if (!envelope) {
        errors.push(`Envelope ${allocation.envelope_id} not found`);
        continue;
      }

      if (envelope.type !== 'cash') {
        errors.push(`Envelope ${envelope.name} must be a cash envelope`);
        continue;
      }

      // Get current balance
      const balanceStmt = this.db.prepare(`
        SELECT COALESCE(SUM(t.amount), 0) as current_balance
        FROM transactions t
        WHERE t.envelope_id = ? AND t.status IN ('pending', 'cleared')
      `);
      const balanceResult = balanceStmt.get(allocation.envelope_id) as { current_balance: number };
      const currentBalance = balanceResult.current_balance;
      const afterPayment = currentBalance - allocation.amount;
      const sufficientFunds = currentBalance >= allocation.amount;

      if (!sufficientFunds) {
        errors.push(`Insufficient funds in ${envelope.name}. Available: ${currentBalance}, Required: ${allocation.amount}`);
      }

      envelopeImpacts.push({
        envelope_id: envelope.id,
        envelope_name: envelope.name,
        current_balance: currentBalance,
        after_payment: afterPayment,
        sufficient_funds: sufficientFunds
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      totalAmount,
      envelopeImpacts
    };
  }

  suggestPaymentAllocation(creditCardAccountId: number, targetAmount: number): {
    suggested_allocations: Array<{
      envelope_id: number;
      envelope_name: string;
      available_balance: number;
      suggested_amount: number;
      debt_coverage: number; // What percentage of this envelope's debt would be covered
    }>;
    total_suggested: number;
    coverage_percentage: number; // What percentage of target amount can be covered
  } {
    // Get debt by envelope category for this credit card
    const debtStmt = this.db.prepare(`
      SELECT 
        e.id as envelope_id,
        e.name as envelope_name,
        COALESCE(SUM(CASE WHEN t.status = 'unpaid' THEN t.amount ELSE 0 END), 0) as debt_amount
      FROM envelopes e
      LEFT JOIN transactions t ON e.id = t.envelope_id
      WHERE e.account_id = ? AND e.type = 'debt'
      GROUP BY e.id, e.name
      HAVING debt_amount > 0
      ORDER BY debt_amount DESC
    `);

    const debts = debtStmt.all(creditCardAccountId) as Array<{
      envelope_id: number;
      envelope_name: string;
      debt_amount: number;
    }>;

    // Get cash envelopes with available balances
    const cashStmt = this.db.prepare(`
      SELECT 
        e.id as envelope_id,
        e.name as envelope_name,
        COALESCE(SUM(CASE WHEN t.status IN ('pending', 'cleared') THEN t.amount ELSE 0 END), 0) as available_balance
      FROM envelopes e
      LEFT JOIN transactions t ON e.id = t.envelope_id
      WHERE e.type = 'cash'
      GROUP BY e.id, e.name
      HAVING available_balance > 0
      ORDER BY available_balance DESC
    `);

    const cashEnvelopes = cashStmt.all() as Array<{
      envelope_id: number;
      envelope_name: string;
      available_balance: number;
    }>;

    const suggestedAllocations: Array<{
      envelope_id: number;
      envelope_name: string;
      available_balance: number;
      suggested_amount: number;
      debt_coverage: number;
    }> = [];

    let remainingTarget = targetAmount;
    let totalSuggested = 0;

    // First, try to match debt categories with cash envelopes by name similarity
    for (const debt of debts) {
      if (remainingTarget <= 0) break;

      // Find matching cash envelope (by name similarity)
      const matchingCash = cashEnvelopes.find(cash => 
        cash.envelope_name.toLowerCase().includes(debt.envelope_name.toLowerCase()) ||
        debt.envelope_name.toLowerCase().includes(cash.envelope_name.toLowerCase())
      );

      if (matchingCash && matchingCash.available_balance > 0) {
        const suggestedAmount = Math.min(
          matchingCash.available_balance,
          Math.abs(debt.debt_amount),
          remainingTarget
        );

        if (suggestedAmount > 0) {
          suggestedAllocations.push({
            envelope_id: matchingCash.envelope_id,
            envelope_name: matchingCash.envelope_name,
            available_balance: matchingCash.available_balance,
            suggested_amount: suggestedAmount,
            debt_coverage: (suggestedAmount / Math.abs(debt.debt_amount)) * 100
          });

          remainingTarget -= suggestedAmount;
          totalSuggested += suggestedAmount;
          matchingCash.available_balance -= suggestedAmount; // Mark as allocated
        }
      }
    }

    // If target not met, allocate from remaining cash envelopes
    if (remainingTarget > 0) {
      const remainingCash = cashEnvelopes.filter(cash => cash.available_balance > 0);
      
      for (const cash of remainingCash) {
        if (remainingTarget <= 0) break;

        const suggestedAmount = Math.min(cash.available_balance, remainingTarget);
        
        if (suggestedAmount > 0) {
          // Check if already allocated
          const existing = suggestedAllocations.find(a => a.envelope_id === cash.envelope_id);
          if (existing) {
            existing.suggested_amount += suggestedAmount;
          } else {
            suggestedAllocations.push({
              envelope_id: cash.envelope_id,
              envelope_name: cash.envelope_name,
              available_balance: cash.available_balance,
              suggested_amount: suggestedAmount,
              debt_coverage: 0 // No specific debt match
            });
          }

          remainingTarget -= suggestedAmount;
          totalSuggested += suggestedAmount;
        }
      }
    }

    return {
      suggested_allocations: suggestedAllocations,
      total_suggested: totalSuggested,
      coverage_percentage: targetAmount > 0 ? (totalSuggested / targetAmount) * 100 : 0
    };
  }
}