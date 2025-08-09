# Transaction Amount Bug Fix - Documentation

## Issue Discovered
**Date**: August 9, 2025  
**Reporter**: User (via screenshots)  
**Component**: TransactionManagement.tsx  

## Problem Description
When creating debit transactions, the envelope balance was incorrectly INCREASING instead of DECREASING. 

### Example:
1. Unassigned envelope balance: $0
2. Created $500 credit transaction → Balance correctly became $500
3. Created $500 debit transaction → Balance incorrectly became $1,000 (should be $0)

## Root Cause Analysis

### The Bug
The application was storing ALL transaction amounts as positive values in the database, regardless of transaction type (debit/credit). The SQL views then SUM all transaction amounts, causing debits to add to balances instead of subtracting.

### Database View Logic (envelope_balances_by_status):
```sql
COALESCE(SUM(t.amount), 0) as total_balance
```

This sums all transaction amounts. If debits are positive, they increase the balance.

### Original Code Problem:
```javascript
const transactionData = {
    amount: formData.amount,  // Always positive, regardless of type
    type: formData.type,      // 'debit' or 'credit'
    // ...
};
```

## Solution Implemented

### Fixed Code:
```javascript
const transactionData = {
    // Use negative amounts for debits, positive for credits
    amount: formData.type === 'debit' ? -Math.abs(formData.amount) : Math.abs(formData.amount),
    type: formData.type,
    // ...
};
```

### Changes Made:
1. **handleCreate function**: Debits now use negative amounts
2. **handleUpdate function**: Same fix for editing transactions
3. **Amount input field**: Always shows positive values to users
4. **handleEdit function**: Converts stored negative values to positive for display
5. **Transaction list**: Shows absolute values in the table

## Impact

### Before Fix:
- Debit: +500 (incorrectly adds to balance)
- Credit: +500 (correctly adds to balance)
- Envelope balance after both: $1,000 ❌

### After Fix:
- Debit: -500 (correctly subtracts from balance)
- Credit: +500 (correctly adds to balance)
- Envelope balance after both: $0 ✅

## User Experience
- Users always enter positive amounts in the form
- The system automatically handles the sign based on transaction type
- Display always shows positive values for clarity
- Database stores the mathematically correct signed values

## Testing Recommendations
1. Create a test envelope with $0 balance
2. Add a $100 credit → balance should be $100
3. Add a $50 debit → balance should be $50
4. Add another $60 debit → balance should be -$10 (overdraft)
5. Verify all existing transactions display correctly

## Files Modified
- `src/components/TransactionManagement.tsx`

## Backup Created
The fix script automatically creates a backup before applying changes.

## How to Apply the Fix
```bash
cd C:\Users\caleb\OneDrive\Documents\personal-finance-app-v2
fix_transaction_amounts\fix-transaction-amount-bug.bat
```

Then start the application:
```bash
npm run start
```

## Notes
- This fix affects ALL future transactions
- Existing transactions may need to be manually corrected if they have the wrong sign
- The fix maintains backward compatibility with the display layer
