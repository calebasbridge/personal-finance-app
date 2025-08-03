// src/database/compensationCreator.ts - Compensation Creator System

import Database from 'better-sqlite3';
import { getDatabase } from './connection';
import { 
  FundingTarget,
  CreateFundingTargetData,
  UpdateFundingTargetData,
  FundingTargetWithEnvelope,
  CompensationCalculation,
  FundingTargetType,
  EnvelopeBalanceByStatus
} from './types';

export class CompensationCreatorDatabase {
  private db: Database.Database;

  constructor() {
    this.db = getDatabase();
    this.initializeTables();
  }

  private initializeTables(): void {
    // Create funding_targets table
    const createFundingTargetsTable = `
      CREATE TABLE IF NOT EXISTS funding_targets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        envelope_id INTEGER NOT NULL,
        target_type TEXT NOT NULL CHECK (target_type IN ('monthly_minimum', 'per_paycheck', 'monthly_stipend')),
        target_amount REAL NOT NULL,
        minimum_amount REAL,
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (envelope_id) REFERENCES envelopes (id) ON DELETE CASCADE
      )
    `;

    // Create indexes
    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_funding_targets_envelope_id ON funding_targets(envelope_id)',
      'CREATE INDEX IF NOT EXISTS idx_funding_targets_active ON funding_targets(is_active)'
    ];

    // Create update trigger
    const createUpdateTrigger = `
      CREATE TRIGGER IF NOT EXISTS update_funding_targets_updated_at 
      AFTER UPDATE ON funding_targets
      FOR EACH ROW
      BEGIN
        UPDATE funding_targets SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END
    `;

    this.db.exec(createFundingTargetsTable);
    createIndexes.forEach(index => this.db.exec(index));
    this.db.exec(createUpdateTrigger);
  }

  // CRUD Operations for Funding Targets

  createFundingTarget(data: CreateFundingTargetData): FundingTarget {
    const stmt = this.db.prepare(`
      INSERT INTO funding_targets (envelope_id, target_type, target_amount, minimum_amount, description, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.envelope_id,
      data.target_type,
      data.target_amount,
      data.minimum_amount || null,
      data.description || null,
      data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1
    );

    return this.getFundingTargetById(result.lastInsertRowid as number)!;
  }

  getFundingTargetById(id: number): FundingTarget | null {
    const stmt = this.db.prepare('SELECT * FROM funding_targets WHERE id = ?');
    return stmt.get(id) as FundingTarget || null;
  }

  getAllFundingTargets(): FundingTarget[] {
    const stmt = this.db.prepare('SELECT * FROM funding_targets ORDER BY created_at DESC');
    return stmt.all() as FundingTarget[];
  }

  getActiveFundingTargets(): FundingTarget[] {
    const stmt = this.db.prepare('SELECT * FROM funding_targets WHERE is_active = 1 ORDER BY created_at DESC');
    return stmt.all() as FundingTarget[];
  }

  getFundingTargetsByEnvelopeId(envelopeId: number): FundingTarget[] {
    const stmt = this.db.prepare('SELECT * FROM funding_targets WHERE envelope_id = ? ORDER BY created_at DESC');
    return stmt.all(envelopeId) as FundingTarget[];
  }

  getFundingTargetsWithEnvelopeInfo(): FundingTargetWithEnvelope[] {
    const stmt = this.db.prepare(`
      SELECT 
        ft.*,
        e.name as envelope_name,
        e.type as envelope_type,
        a.name as account_name,
        ebs.total_balance as current_balance,
        ebs.available_balance
      FROM funding_targets ft
      JOIN envelopes e ON ft.envelope_id = e.id
      JOIN accounts a ON e.account_id = a.id
      LEFT JOIN envelope_balances_by_status ebs ON e.id = ebs.envelope_id
      WHERE ft.is_active = 1
      ORDER BY a.name, e.name
    `);
    return stmt.all() as FundingTargetWithEnvelope[];
  }

  updateFundingTarget(id: number, data: UpdateFundingTargetData): FundingTarget | null {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.target_type !== undefined) {
      updates.push('target_type = ?');
      values.push(data.target_type);
    }
    if (data.target_amount !== undefined) {
      updates.push('target_amount = ?');
      values.push(data.target_amount);
    }
    if (data.minimum_amount !== undefined) {
      updates.push('minimum_amount = ?');
      values.push(data.minimum_amount);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(data.is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return this.getFundingTargetById(id);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE funding_targets 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `);

    const result = stmt.run(...values);
    
    if (result.changes === 0) {
      return null;
    }

    return this.getFundingTargetById(id);
  }

  deleteFundingTarget(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM funding_targets WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Compensation Calculation Methods

  getCurrentDebtByEnvelope(): { envelope_id: number; envelope_name: string; debt_amount: number }[] {
    const stmt = this.db.prepare(`
      SELECT 
        e.id as envelope_id,
        e.name as envelope_name,
        COALESCE(ebs.available_balance, 0) as debt_amount
      FROM envelopes e
      JOIN accounts a ON e.account_id = a.id
      LEFT JOIN envelope_balances_by_status ebs ON e.id = ebs.envelope_id
      WHERE e.type = 'debt' 
        AND a.type = 'credit_card' 
        AND COALESCE(ebs.available_balance, 0) > 0
      ORDER BY debt_amount DESC
    `);
    return stmt.all() as { envelope_id: number; envelope_name: string; debt_amount: number }[];
  }

  calculateCompensation(paycheckDate: string, customAmount?: number): CompensationCalculation {
    // Get current debt by envelope
    const debtByEnvelope = this.getCurrentDebtByEnvelope();
    const totalDebt = debtByEnvelope.reduce((sum, debt) => sum + debt.debt_amount, 0);

    // Get funding targets with current balances
    const fundingTargetsData = this.getFundingTargetsWithEnvelopeInfo();
    
    // Calculate shortfalls for each target
    const fundingTargets = fundingTargetsData.map(target => {
      let targetAmount = target.target_amount;
      
      // Adjust target amount based on type
      if (target.target_type === 'monthly_minimum' || target.target_type === 'monthly_stipend') {
        // For monthly targets, calculate what's needed to reach the target
        targetAmount = Math.max(0, target.target_amount - (target.available_balance || 0));
      }
      // For per_paycheck, use the full amount each time
      
      const shortfall = Math.max(0, targetAmount - (target.available_balance || 0));
      
      return {
        envelope_id: target.envelope_id,
        envelope_name: target.envelope_name,
        target_type: target.target_type,
        target_amount: targetAmount,
        current_balance: target.available_balance || 0,
        shortfall
      };
    });

    const totalShortfall = fundingTargets.reduce((sum, target) => sum + target.shortfall, 0);

    // Calculate recommended payment (debt + shortfalls + 10% buffer)
    const baseRecommendation = totalDebt + totalShortfall;
    const recommendedPayment = customAmount || Math.ceil(baseRecommendation * 1.1);

    // Calculate 75/25 split
    const w2Amount = Math.round(recommendedPayment * 0.75 * 100) / 100;
    const dividendAmount = Math.round(recommendedPayment * 0.25 * 100) / 100;

    return {
      paycheck_date: paycheckDate,
      total_payment: recommendedPayment,
      w2_amount: w2Amount,
      dividend_amount: dividendAmount,
      debt_by_envelope: debtByEnvelope,
      funding_targets: fundingTargets,
      total_debt: totalDebt,
      total_shortfall: totalShortfall,
      recommended_payment: recommendedPayment
    };
  }

  // Future Planning Methods
  
  getNextPaycheckDate(): string {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const currentDate = today.getDate();

    // If today is the 1st through 14th, next paycheck is the 15th of this month
    if (currentDate >= 1 && currentDate < 15) {
      return new Date(currentYear, currentMonth, 15).toISOString().split('T')[0];
    }
    // If today is the 15th through end of month, next paycheck is the 1st of next month
    else {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      return new Date(nextYear, nextMonth, 1).toISOString().split('T')[0];
    }
  }

  // Envelope analysis for smart defaults
  suggestFundingTargets(): { envelope_id: number; envelope_name: string; suggested_amount: number; reasoning: string }[] {
    const stmt = this.db.prepare(`
      SELECT 
        e.id as envelope_id,
        e.name as envelope_name,
        e.type as envelope_type,
        COALESCE(ebs.available_balance, 0) as current_balance,
        AVG(ABS(t.amount)) as avg_transaction_amount,
        COUNT(t.id) as transaction_count
      FROM envelopes e
      LEFT JOIN envelope_balances_by_status ebs ON e.id = ebs.envelope_id
      LEFT JOIN transactions t ON e.id = t.envelope_id 
        AND t.date >= date('now', '-3 months')
        AND t.amount < 0  -- Only outgoing transactions
      WHERE e.type = 'cash'
        AND NOT EXISTS (
          SELECT 1 FROM funding_targets ft 
          WHERE ft.envelope_id = e.id AND ft.is_active = 1
        )
      GROUP BY e.id, e.name, e.type, ebs.available_balance
      HAVING transaction_count > 0
      ORDER BY avg_transaction_amount DESC
    `);

    const results = stmt.all() as any[];
    
    return results.map(result => {
      const avgSpending = result.avg_transaction_amount || 0;
      const suggestedAmount = Math.ceil(avgSpending * 2); // 2x average spending as safety
      
      return {
        envelope_id: result.envelope_id,
        envelope_name: result.envelope_name,
        suggested_amount: suggestedAmount,
        reasoning: `Based on 3-month average spending of $${avgSpending.toFixed(2)}`
      };
    });
  }
}

// Export singleton instance
export const compensationCreatorDatabase = new CompensationCreatorDatabase();
