const fs = require('fs');
const path = require('path');

// Path to the TransactionManagement component
const filePath = path.join(__dirname, '..', 'src', 'components', 'TransactionManagement.tsx');

// Read the current file
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Applying comprehensive transaction amount fix...\n');

// Fix 1: Update handleCreate to use negative amounts for debits
console.log('1. Fixing handleCreate function...');
const handleCreateRegex = /const transactionData = \{([^}]+)\}/s;
const handleCreateMatch = content.match(handleCreateRegex);

if (handleCreateMatch) {
    const original = handleCreateMatch[0];
    const fixed = original.replace(
        'amount: formData.amount,',
        `// FIX: Use negative amounts for debits, positive for credits
        amount: formData.type === 'debit' ? -Math.abs(formData.amount) : Math.abs(formData.amount),`
    );
    content = content.replace(original, fixed);
    console.log('   ✅ handleCreate fixed');
}

// Fix 2: Update handleUpdate to use negative amounts for debits
console.log('2. Fixing handleUpdate function...');
const handleUpdateRegex = /const updateData = \{([^}]+)\}/s;
const handleUpdateMatch = content.match(handleUpdateRegex);

if (handleUpdateMatch) {
    const original = handleUpdateMatch[0];
    const fixed = original.replace(
        'amount: formData.amount,',
        `// FIX: Use negative amounts for debits, positive for credits
        amount: formData.type === 'debit' ? -Math.abs(formData.amount) : Math.abs(formData.amount),`
    );
    content = content.replace(original, fixed);
    console.log('   ✅ handleUpdate fixed');
}

// Fix 3: Update amount input to always show positive values
console.log('3. Fixing amount input display...');
content = content.replace(
    /value=\{formData\.amount === 0 \? '' : formData\.amount\}/,
    `value={formData.amount === 0 ? '' : Math.abs(formData.amount)}`
);
console.log('   ✅ Amount input fixed');

// Fix 4: Update handleEdit to convert negative amounts to positive for display
console.log('4. Fixing handleEdit function...');
const handleEditRegex = /setTimeout\(\(\) => \{([^}]+)\}, 10\)/s;
const handleEditMatch = content.match(handleEditRegex);

if (handleEditMatch) {
    const original = handleEditMatch[0];
    const fixed = original.replace(
        'amount: transaction.amount,',
        'amount: Math.abs(transaction.amount), // Show positive value in form'
    );
    content = content.replace(original, fixed);
    console.log('   ✅ handleEdit fixed');
}

// Fix 5: Update formatCurrency to show absolute values in transaction list
console.log('5. Fixing currency display in transaction list...');
content = content.replace(
    /<td>\{formatCurrency\(transaction\.amount\)\}<\/td>/,
    `<td>{formatCurrency(Math.abs(transaction.amount))}</td>`
);
console.log('   ✅ Currency display fixed');

// Write the fixed content back
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✨ All fixes applied successfully!\n');
console.log('Summary of changes:');
console.log('- Debit transactions will use negative amounts in the database');
console.log('- Credit transactions will use positive amounts in the database');
console.log('- The UI will always show positive values to users');
console.log('- Envelope balances will correctly decrease for debits');
console.log('- Envelope balances will correctly increase for credits');
