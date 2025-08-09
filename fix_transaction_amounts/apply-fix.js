const fs = require('fs');
const path = require('path');

// Path to the TransactionManagement component
const filePath = path.join(__dirname, '..', 'src', 'components', 'TransactionManagement.tsx');

// Read the current file
let content = fs.readFileSync(filePath, 'utf8');

// Find the handleCreate function and fix the transaction amount logic
const handleCreatePattern = /const handleCreate = async \(e: React\.FormEvent\) => {[\s\S]*?const transactionData = {([\s\S]*?)};/;

const match = content.match(handleCreatePattern);
if (match) {
    console.log('Found handleCreate function, applying fix...');
    
    // Replace the transactionData object creation to handle debit/credit amounts
    const originalTransactionData = match[0];
    
    // Create the fixed version with proper amount handling
    const fixedTransactionData = originalTransactionData.replace(
        /amount: formData\.amount,/,
        `// FIXED: Use negative amounts for debits, positive for credits
        amount: formData.type === 'debit' ? -Math.abs(formData.amount) : Math.abs(formData.amount),`
    );
    
    content = content.replace(originalTransactionData, fixedTransactionData);
    
    // Also fix the handleUpdate function
    const handleUpdatePattern = /const handleUpdate = async \(e: React\.FormEvent\) => {[\s\S]*?const updateData = {([\s\S]*?)};/;
    const updateMatch = content.match(handleUpdatePattern);
    
    if (updateMatch) {
        console.log('Found handleUpdate function, applying fix...');
        const originalUpdateData = updateMatch[0];
        
        const fixedUpdateData = originalUpdateData.replace(
            /amount: formData\.amount,/,
            `// FIXED: Use negative amounts for debits, positive for credits
        amount: formData.type === 'debit' ? -Math.abs(formData.amount) : Math.abs(formData.amount),`
        );
        
        content = content.replace(originalUpdateData, fixedUpdateData);
    }
    
    // Also update the form input to always show positive values to the user
    const amountInputPattern = /value={formData\.amount === 0 \? '' : formData\.amount}/;
    if (content.match(amountInputPattern)) {
        console.log('Updating amount input display to show absolute values...');
        content = content.replace(
            amountInputPattern,
            `value={formData.amount === 0 ? '' : Math.abs(formData.amount)}`
        );
    }
    
    // Update the handleEdit function to show absolute amount when editing
    const handleEditPattern = /const handleEdit = async \(transaction: Transaction\) => {[\s\S]*?setTimeout\(\(\) => {[\s\S]*?amount: transaction\.amount,/;
    const editMatch = content.match(handleEditPattern);
    
    if (editMatch) {
        console.log('Updating handleEdit to show absolute amounts...');
        content = content.replace(
            /amount: transaction\.amount,/g,
            `amount: Math.abs(transaction.amount), // Show positive value in form`
        );
    }
    
    // Write the fixed content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Fix applied successfully!');
    
} else {
    console.error('Could not find handleCreate function in TransactionManagement.tsx');
    process.exit(1);
}

console.log('\n📝 Summary of changes:');
console.log('1. Debit transactions will now use negative amounts');
console.log('2. Credit transactions will use positive amounts');
console.log('3. Form will always show positive values to users');
console.log('4. Envelope balances will now correctly decrease for debits');
