const test = require('node:test');
const assert = require('node:assert/strict');
const {
    CATEGORIES,
    validateLogin,
    validateAvailableMoney,
    validateMinimumBalance,
    validateExpense,
    createExpense,
    calculateTotal,
    calculateFinancialSummary,
    calculateCategorySummary,
    getTopCategory,
    filterExpenses,
    getSampleExpenses
} = require('../js/tracker.js');

// 1. Login Validation Tests
test('Login Validation - rejects empty fields and invalid formats', () => {
    // Empty identifier
    const resEmptyUser = validateLogin({ identifier: '', password: 'password123' });
    assert.strictEqual(resEmptyUser.isValid, false);
    assert.ok(resEmptyUser.errors.identifier);

    // Whitespace identifier
    const resWhiteUser = validateLogin({ identifier: '   ', password: 'password123' });
    assert.strictEqual(resWhiteUser.isValid, false);
    assert.ok(resWhiteUser.errors.identifier);

    // Invalid email format
    const resInvalidEmail = validateLogin({ identifier: 'student@not-a-valid-email', password: 'password123' });
    assert.strictEqual(resInvalidEmail.isValid, false);
    assert.ok(resInvalidEmail.errors.identifier.includes('valid email address'));

    // Empty password
    const resEmptyPass = validateLogin({ identifier: 'student@college.edu', password: '' });
    assert.strictEqual(resEmptyPass.isValid, false);
    assert.ok(resEmptyPass.errors.password);

    // Short password (< 4 chars)
    const resShortPass = validateLogin({ identifier: 'student@college.edu', password: '123' });
    assert.strictEqual(resShortPass.isValid, false);
    assert.ok(resShortPass.errors.password.includes('at least 4 characters'));
});

test('Login Validation - accepts valid student email or username', () => {
    // Valid email
    const resEmail = validateLogin({ identifier: 'student@college.edu', password: 'college123' });
    assert.strictEqual(resEmail.isValid, true);
    assert.strictEqual(resEmail.user.identifier, 'student@college.edu');
    assert.strictEqual(resEmail.user.name, 'student');

    // Valid username
    const resUser = validateLogin({ identifier: 'alex_scholar', password: 'secretpassword' });
    assert.strictEqual(resUser.isValid, true);
    assert.strictEqual(resUser.user.identifier, 'alex_scholar');
});

// 2. Available Money Validation Tests
test('Available Money Validation - handles empty, negative, zero, and positive numbers', () => {
    assert.strictEqual(validateAvailableMoney('').isValid, false);
    assert.strictEqual(validateAvailableMoney(null).isValid, false);
    assert.strictEqual(validateAvailableMoney('abc').isValid, false);

    const resNeg = validateAvailableMoney(-500);
    assert.strictEqual(resNeg.isValid, false);
    assert.ok(resNeg.error.includes('cannot be negative'));

    const resZero = validateAvailableMoney(0);
    assert.strictEqual(resZero.isValid, true);
    assert.strictEqual(resZero.value, 0);

    const res5000 = validateAvailableMoney(5000);
    assert.strictEqual(res5000.isValid, true);
    assert.strictEqual(res5000.value, 5000);
});

// 3. Minimum Balance Validation Tests
test('Minimum Balance Validation - validates thresholds and rejects negative/invalid numbers', () => {
    // Empty
    assert.strictEqual(validateMinimumBalance('').isValid, false);
    assert.strictEqual(validateMinimumBalance(null).isValid, false);

    // Non-numeric
    assert.strictEqual(validateMinimumBalance('invalid').isValid, false);

    // Negative
    const resNeg = validateMinimumBalance(-100);
    assert.strictEqual(resNeg.isValid, false);
    assert.ok(resNeg.error.includes('cannot be negative'));

    // Zero (allowed to disable or reset threshold)
    const resZero = validateMinimumBalance(0);
    assert.strictEqual(resZero.isValid, true);
    assert.strictEqual(resZero.value, 0);

    // Valid positive threshold (₹1,500)
    const res1500 = validateMinimumBalance(1500);
    assert.strictEqual(res1500.isValid, true);
    assert.strictEqual(res1500.value, 1500);
});

// 4. Expense Input Validation Tests
test('Expense Validation - rejects empty fields and invalid amounts', () => {
    const resNoName = validateExpense({ name: '', amount: 100, category: 'food' });
    assert.strictEqual(resNoName.isValid, false);
    assert.ok(resNoName.errors.name);

    const resShortName = validateExpense({ name: 'A', amount: 100, category: 'food' });
    assert.strictEqual(resShortName.isValid, false);
    assert.ok(resShortName.errors.name);

    const resZero = validateExpense({ name: 'Notebook', amount: 0, category: 'education' });
    assert.strictEqual(resZero.isValid, false);
    assert.ok(resZero.errors.amount.includes('greater than zero'));

    const resNeg = validateExpense({ name: 'Notebook', amount: -250, category: 'education' });
    assert.strictEqual(resNeg.isValid, false);
    assert.ok(resNeg.errors.amount.includes('greater than zero'));

    const resBadCat = validateExpense({ name: 'Notebook', amount: 50, category: 'crypto' });
    assert.strictEqual(resBadCat.isValid, false);
    assert.ok(resBadCat.errors.category);

    const resValid = validateExpense({
        name: 'College Canteen Thali',
        amount: '120.00',
        category: 'food',
        date: '2026-10-12'
    });
    assert.strictEqual(resValid.isValid, true);
});

// 5. User Minimum Balance Scenario Tests
test('User Scenario: Set Minimum Balance = ₹1,500, Available = ₹5,000, Expenses = ₹3,000 -> Remaining = ₹2,000, NO alert', () => {
    const availableMoney = 5000;
    const minBalance = 1500;
    const expenses = [
        createExpense({ name: 'Monthly Transit', amount: 2000, category: 'travel' }),
        createExpense({ name: 'Books & Stationery', amount: 1000, category: 'education' })
    ];

    const summary = calculateFinancialSummary({ availableMoney, expenses, minBalance });

    assert.strictEqual(summary.totalAvailable, 5000);
    assert.strictEqual(summary.totalExpenses, 3000);
    assert.strictEqual(summary.remainingBalance, 2000); // 5000 - 3000 = 2000
    assert.strictEqual(summary.minBalance, 1500);
    assert.strictEqual(summary.hasMinBalanceSet, true);
    assert.strictEqual(summary.isLowBalance, false); // 2000 > 1500, so NO alert
    assert.strictEqual(summary.isOverspent, false);
});

test('User Scenario: Add ₹700 expense -> Remaining = ₹1,300, Low Balance alert APPEARS (<= ₹1,500)', () => {
    const availableMoney = 5000;
    const minBalance = 1500;
    const expenses = [
        createExpense({ name: 'Monthly Transit', amount: 2000, category: 'travel' }),
        createExpense({ name: 'Books & Stationery', amount: 1000, category: 'education' }),
        createExpense({ name: 'Hostel Groceries', amount: 700, category: 'food' })
    ];

    const summary = calculateFinancialSummary({ availableMoney, expenses, minBalance });

    assert.strictEqual(summary.totalAvailable, 5000);
    assert.strictEqual(summary.totalExpenses, 3700);
    assert.strictEqual(summary.remainingBalance, 1300); // 5000 - 3700 = 1300
    assert.strictEqual(summary.isLowBalance, true); // 1300 <= 1500 -> Low balance triggered!
    assert.strictEqual(summary.lowBalanceDeficit, 200); // 1500 - 1300 = 200 below limit
    assert.strictEqual(summary.isOverspent, false);
});

test('User Scenario: Delete ₹700 expense -> Remaining rises back to ₹2,000, Low Balance alert CLEARS', () => {
    const availableMoney = 5000;
    const minBalance = 1500;
    // Deleted the ₹700 expense, so only ₹3,000 remains
    const expenses = [
        createExpense({ name: 'Monthly Transit', amount: 2000, category: 'travel' }),
        createExpense({ name: 'Books & Stationery', amount: 1000, category: 'education' })
    ];

    const summary = calculateFinancialSummary({ availableMoney, expenses, minBalance });

    assert.strictEqual(summary.totalExpenses, 3000);
    assert.strictEqual(summary.remainingBalance, 2000);
    assert.strictEqual(summary.isLowBalance, false); // Cleared!
    assert.strictEqual(summary.isOverspent, false);
});

test('User Scenario: Expenses exceed available money -> triggers Overspending warning and negative balance', () => {
    const availableMoney = 2000;
    const minBalance = 500;
    const expenses = [
        createExpense({ name: 'Semester Lab Manual', amount: 1500, category: 'education' }),
        createExpense({ name: 'Hostel Rent Share', amount: 1000, category: 'bills' })
    ];

    const summary = calculateFinancialSummary({ availableMoney, expenses, minBalance });

    assert.strictEqual(summary.totalAvailable, 2000);
    assert.strictEqual(summary.totalExpenses, 2500);
    assert.strictEqual(summary.remainingBalance, -500); // Negative balance
    assert.strictEqual(summary.isOverspent, true);
    assert.strictEqual(summary.overspentAmount, 500);
    // When overspent, isLowBalance is false because isOverspent takes precedence with distinct red alert
    assert.strictEqual(summary.isLowBalance, false);
});

test('Edge Case: Available money = 0 safely handles percent without NaN or Infinity', () => {
    const summary = calculateFinancialSummary({ availableMoney: 0, expenses: [{ amount: 150 }], minBalance: 100 });
    assert.strictEqual(summary.totalAvailable, 0);
    assert.strictEqual(summary.totalExpenses, 150);
    assert.strictEqual(summary.remainingBalance, -150);
    assert.strictEqual(summary.isOverspent, true);
    assert.strictEqual(summary.percentSpent, 0);
});

test('Category Summary - produces accurate totals and breakdown', () => {
    const expenses = [
        { name: 'Lunch', amount: 150, category: 'food' },
        { name: 'Dinner', amount: 150, category: 'food' },
        { name: 'Bus', amount: 200, category: 'travel' }
    ];

    const summary = calculateCategorySummary(expenses);
    const foodCat = summary.find(c => c.id === 'food');
    const travelCat = summary.find(c => c.id === 'travel');

    assert.strictEqual(foodCat.total, 300);
    assert.strictEqual(foodCat.percentage, 60);

    assert.strictEqual(travelCat.total, 200);
    assert.strictEqual(travelCat.percentage, 40);

    const top = getTopCategory(summary);
    assert.strictEqual(top.id, 'food');
});

test('Filter Expenses - filters accurately by query and category', () => {
    const expenses = [
        { id: '1', name: 'Metro Ticket', category: 'travel', amount: 50 },
        { id: '2', name: 'Math Book', category: 'education', amount: 300 },
        { id: '3', name: 'Bus Pass', category: 'travel', amount: 500 }
    ];

    assert.strictEqual(filterExpenses(expenses, { query: 'ticket' }).length, 1);
    assert.strictEqual(filterExpenses(expenses, { category: 'travel' }).length, 2);
    assert.strictEqual(filterExpenses(expenses, { query: 'bus', category: 'travel' }).length, 1);
});
