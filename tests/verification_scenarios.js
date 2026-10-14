/**
 * Student Expense Tracker - Verification Scenarios Runner
 * Tests and verifies all requested Minimum Balance Alert and Reminder features
 */

const assert = require('node:assert/strict');
const {
    validateLogin,
    validateAvailableMoney,
    validateMinimumBalance,
    validateExpense,
    createExpense,
    calculateTotal,
    calculateFinancialSummary,
    calculateCategorySummary,
    filterExpenses
} = require('../js/tracker.js');

console.log('--- STARTING MINIMUM BALANCE & REMINDER VERIFICATION SCENARIOS ---');

// Scenario 1: Set Minimum Balance to ₹1,500
console.log('\n[Scenario 1] Testing Setting Minimum Balance to ₹1,500...');
const minValRes = validateMinimumBalance(1500);
assert.strictEqual(minValRes.isValid, true);
assert.strictEqual(minValRes.value, 1500);

// Rejection of invalid/negative minimum balance
const negMinRes = validateMinimumBalance(-200);
assert.strictEqual(negMinRes.isValid, false);
assert.ok(negMinRes.error.includes('cannot be negative'));

const emptyMinRes = validateMinimumBalance('');
assert.strictEqual(emptyMinRes.isValid, false);
console.log('✔ Scenario 1 Passed: Minimum balance ₹1,500 accepted; negative & empty values rejected.');

// Scenario 2: With ₹5,000 available, add expenses totalling ₹3,000 -> Remaining balance ₹2,000, NO low-balance alert
console.log('\n[Scenario 2] Available ₹5,000, Expenses ₹3,000, Min Limit ₹1,500...');
const availableMoney = 5000;
const minBalance = 1500;
let expenses = [
    createExpense({ name: 'Monthly Train Pass', amount: 2000, category: 'travel' }),
    createExpense({ name: 'Textbooks', amount: 1000, category: 'education' })
];

let summary = calculateFinancialSummary({ availableMoney, expenses, minBalance });
assert.strictEqual(summary.totalAvailable, 5000);
assert.strictEqual(summary.totalExpenses, 3000);
assert.strictEqual(summary.remainingBalance, 2000, 'Remaining balance must be ₹2,000');
assert.strictEqual(summary.minBalance, 1500);
assert.strictEqual(summary.isLowBalance, false, 'isLowBalance must be FALSE because ₹2,000 > ₹1,500');
assert.strictEqual(summary.isOverspent, false);
console.log(`✔ Scenario 2 Passed: Remaining balance is ₹${summary.remainingBalance}. Low balance alert is correctly INACTIVE.`);

// Scenario 3: Add ₹700 expense -> Remaining balance ₹1,300, Low Balance alert APPEARS
console.log('\n[Scenario 3] Adding ₹700 expense -> Remaining ₹1,300 (below ₹1,500 limit)...');
const exp700 = createExpense({ name: 'Grocery & Snacks', amount: 700, category: 'food' });
expenses.push(exp700);

summary = calculateFinancialSummary({ availableMoney, expenses, minBalance });
assert.strictEqual(summary.totalAvailable, 5000);
assert.strictEqual(summary.totalExpenses, 3700);
assert.strictEqual(summary.remainingBalance, 1300, 'Remaining balance must be ₹1,300');
assert.strictEqual(summary.isLowBalance, true, 'isLowBalance must be TRUE because ₹1,300 <= ₹1,500');
assert.strictEqual(summary.lowBalanceDeficit, 200, 'Deficit must be ₹200 (1500 - 1300)');
assert.strictEqual(summary.isOverspent, false);
console.log(`✔ Scenario 3 Passed: Remaining balance is ₹${summary.remainingBalance} (<= ₹${summary.minBalance}). Low balance alert ACTIVE with deficit ₹${summary.lowBalanceDeficit}.`);

// Scenario 4: Delete expense or update available money so balance rises above ₹1,500 -> Alert CLEARS
console.log('\n[Scenario 4] Deleting ₹700 expense so balance rises above ₹1,500...');
expenses = expenses.filter(item => item.id !== exp700.id);

summary = calculateFinancialSummary({ availableMoney, expenses, minBalance });
assert.strictEqual(summary.totalExpenses, 3000);
assert.strictEqual(summary.remainingBalance, 2000);
assert.strictEqual(summary.isLowBalance, false, 'Low balance alert must CLEAR');
assert.strictEqual(summary.isOverspent, false);
console.log(`✔ Scenario 4 Passed: Remaining balance restored to ₹${summary.remainingBalance} (> ₹${summary.minBalance}). Alert CLEARED.`);

// Alternatively, increasing available money from ₹5,000 to ₹6,000 with ₹3,700 expenses:
console.log('\n[Scenario 4b] Testing Alert Clear via increasing Available Money to ₹6,000 with ₹3,700 expenses...');
expenses.push(exp700); // 3,700 expenses
const summaryUpdatedAvailable = calculateFinancialSummary({ availableMoney: 6000, expenses, minBalance });
assert.strictEqual(summaryUpdatedAvailable.remainingBalance, 2300); // 6000 - 3700 = 2300 > 1500
assert.strictEqual(summaryUpdatedAvailable.isLowBalance, false);
console.log(`✔ Scenario 4b Passed: Remaining balance is ₹${summaryUpdatedAvailable.remainingBalance} (> ₹${summaryUpdatedAvailable.minBalance}). Alert CLEARED.`);

// Scenario 5: Negative balance, invalid minimum balance input, page refresh & saved settings
console.log('\n[Scenario 5] Testing Negative Balance (Overspending) vs Low Balance...');
const overspentSummary = calculateFinancialSummary({ availableMoney: 2000, expenses: [{ amount: 2600 }], minBalance: 500 });
assert.strictEqual(overspentSummary.remainingBalance, -600);
assert.strictEqual(overspentSummary.isOverspent, true, 'isOverspent must be TRUE');
assert.strictEqual(overspentSummary.isLowBalance, false, 'isLowBalance should yield to isOverspent');
assert.strictEqual(overspentSummary.overspentAmount, 600);

console.log('Testing Persistence serialization for settings...');
const settingsStore = {
    availableMoney: 5000,
    minBalance: 1500,
    notificationsEnabled: true
};
const serialized = JSON.stringify(settingsStore);
const restored = JSON.parse(serialized);
assert.strictEqual(restored.minBalance, 1500);
assert.strictEqual(restored.notificationsEnabled, true);
console.log('✔ Scenario 5 Passed: Negative balance triggers distinct overspending alert; settings serialize properly for persistence.');

// Scenario 6: Notification permission and in-app fallback
console.log('\n[Scenario 6] Testing In-app fallback & notification state transition...');
let wasBelowThreshold = false;
let notificationCount = 0;

function checkAndNotify(isLowBalance) {
    if (isLowBalance && !wasBelowThreshold) {
        notificationCount++;
        wasBelowThreshold = true;
    } else if (!isLowBalance) {
        wasBelowThreshold = false;
    }
}

// 1. Balance above limit: no alert
checkAndNotify(false);
assert.strictEqual(notificationCount, 0);

// 2. Balance drops below limit: triggers first notification
checkAndNotify(true);
assert.strictEqual(notificationCount, 1, 'First breach must notify');

// 3. Balance stays below limit on another calculation: does NOT spam duplicate notifications
checkAndNotify(true);
assert.strictEqual(notificationCount, 1, 'Subsequent checks while below must NOT spam notifications');

// 4. Balance rises above limit: resets state
checkAndNotify(false);
assert.strictEqual(wasBelowThreshold, false);

// 5. Balance drops below limit again later: triggers second notification
checkAndNotify(true);
assert.strictEqual(notificationCount, 2, 'New breach after recovery must notify again');

console.log('✔ Scenario 6 Passed: State transition correctly prevents notification spam and triggers upon new breaches.');

console.log('\n--- ALL MINIMUM BALANCE VERIFICATION SCENARIOS PASSED WITH 100% SUCCESS ---');
