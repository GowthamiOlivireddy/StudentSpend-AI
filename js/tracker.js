/**
 * Student Expense Tracker - Core Business Logic
 * Independent module containing validation, financial calculations, and state manipulation.
 * Works seamlessly in both browser and Node.js environments.
 */

// User-requested Student Categories
const CATEGORIES = {
    food: { id: 'food', name: 'Food', icon: '🍔', color: '#f59e0b' },
    travel: { id: 'travel', name: 'Travel', icon: '🚌', color: '#10b981' },
    education: { id: 'education', name: 'Education', icon: '📚', color: '#2563eb' },
    shopping: { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#ec4899' },
    entertainment: { id: 'entertainment', name: 'Entertainment', icon: '🎉', color: '#8b5cf6' },
    bills: { id: 'bills', name: 'Bills', icon: '💡', color: '#06b6d4' },
    other: { id: 'other', name: 'Other', icon: '📦', color: '#64748b' }
};

/**
 * Validates login input fields (demo frontend validation)
 * @param {Object} input - { identifier, password }
 * @returns {Object} - { isValid: boolean, errors: Object, user: Object|null }
 */
function validateLogin(input) {
    const errors = {};
    const identifier = input && typeof input.identifier === 'string' ? input.identifier.trim() : '';
    const password = input && typeof input.password === 'string' ? input.password : '';

    if (!identifier) {
        errors.identifier = 'Please enter your student email or username.';
    } else if (identifier.includes('@')) {
        // Basic RFC-compliant email pattern check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(identifier)) {
            errors.identifier = 'Please enter a valid email address (e.g., student@college.edu).';
        }
    } else if (identifier.length < 3) {
        errors.identifier = 'Username must be at least 3 characters long.';
    }

    if (!password) {
        errors.password = 'Please enter your password.';
    } else if (password.length < 4) {
        errors.password = 'Password must be at least 4 characters long.';
    }

    const isValid = Object.keys(errors).length === 0;

    return {
        isValid,
        errors,
        user: isValid ? {
            identifier,
            name: identifier.includes('@') ? identifier.split('@')[0] : identifier
        } : null
    };
}

/**
 * Validates available money input
 * @param {any} amount 
 * @returns {Object} - { isValid: boolean, error: string|null, value: number }
 */
function validateAvailableMoney(amount) {
    if (amount === '' || amount === null || amount === undefined) {
        return { isValid: false, error: 'Please enter your available money.', value: 0 };
    }

    const parsed = Number(amount);
    if (isNaN(parsed) || !isFinite(parsed)) {
        return { isValid: false, error: 'Available money must be a valid number.', value: 0 };
    }

    if (parsed < 0) {
        return { isValid: false, error: 'Available money cannot be negative.', value: 0 };
    }

    if (parsed > 100000000) {
        return { isValid: false, error: 'Amount exceeds maximum allowable limit (₹10,00,00,000).', value: 0 };
    }

    return {
        isValid: true,
        error: null,
        value: Math.round(parsed * 100) / 100
    };
}

/**
 * Validates minimum balance threshold input
 * @param {any} amount 
 * @returns {Object} - { isValid: boolean, error: string|null, value: number }
 */
function validateMinimumBalance(amount) {
    if (amount === '' || amount === null || amount === undefined) {
        return { isValid: false, error: 'Please enter a minimum balance amount.', value: 0 };
    }

    const parsed = Number(amount);
    if (isNaN(parsed) || !isFinite(parsed)) {
        return { isValid: false, error: 'Minimum balance must be a valid number.', value: 0 };
    }

    if (parsed < 0) {
        return { isValid: false, error: 'Minimum balance cannot be negative.', value: 0 };
    }

    if (parsed > 100000000) {
        return { isValid: false, error: 'Amount exceeds maximum allowable limit (₹10,00,00,000).', value: 0 };
    }

    return {
        isValid: true,
        error: null,
        value: Math.round(parsed * 100) / 100
    };
}

/**
 * Validates expense input fields
 * @param {Object} input - { name, amount, category, date }
 * @returns {Object} - { isValid: boolean, errors: Object }
 */
function validateExpense(input) {
    const errors = {};

    // Validate Name
    if (!input || typeof input.name !== 'string' || input.name.trim() === '') {
        errors.name = 'Please enter an expense name.';
    } else if (input.name.trim().length < 2) {
        errors.name = 'Expense name must be at least 2 characters long.';
    } else if (input.name.trim().length > 60) {
        errors.name = 'Expense name cannot exceed 60 characters.';
    }

    // Validate Amount
    const rawAmount = input ? input.amount : undefined;
    if (rawAmount === '' || rawAmount === null || rawAmount === undefined) {
        errors.amount = 'Please enter an expense amount.';
    } else {
        const parsedAmount = Number(rawAmount);
        if (isNaN(parsedAmount) || !isFinite(parsedAmount)) {
            errors.amount = 'Amount must be a valid number.';
        } else if (parsedAmount <= 0) {
            errors.amount = 'Expense amount must be greater than zero.';
        } else if (parsedAmount > 10000000) {
            errors.amount = 'Amount cannot exceed ₹1,00,00,000.';
        }
    }

    // Validate Category
    if (!input || !input.category || typeof input.category !== 'string' || !CATEGORIES[input.category]) {
        errors.category = 'Please select a valid expense category.';
    }

    // Validate Date (defaults to today if missing or invalid)
    if (input && input.date && isNaN(Date.parse(input.date))) {
        errors.date = 'Please provide a valid date.';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

/**
 * Creates a normalized expense object
 * @param {Object} data - { name, amount, category, date }
 * @returns {Object}
 */
function createExpense(data) {
    const dateStr = data.date && !isNaN(Date.parse(data.date))
        ? data.date
        : new Date().toISOString().split('T')[0];

    return {
        id: 'exp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
        name: data.name.trim(),
        amount: Math.round(Number(data.amount) * 100) / 100,
        category: data.category,
        date: dateStr,
        createdAt: new Date().toISOString()
    };
}

/**
 * Calculates total expenses
 * @param {Array} expenses 
 * @returns {number}
 */
function calculateTotal(expenses) {
    if (!Array.isArray(expenses) || expenses.length === 0) return 0;
    const total = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    return Math.round(total * 100) / 100;
}

/**
 * Calculates complete financial summary including balance, low balance alert, overspending, and budget percentage
 * @param {Object} params - { availableMoney, expenses, minBalance }
 * @returns {Object}
 */
function calculateFinancialSummary({ availableMoney = 0, expenses = [], minBalance = 0 }) {
    const safeAvailable = Math.max(0, Math.round((Number(availableMoney) || 0) * 100) / 100);
    const totalExpenses = calculateTotal(expenses);
    const remainingBalance = Math.round((safeAvailable - totalExpenses) * 100) / 100;
    const safeMinBalance = Math.max(0, Math.round((Number(minBalance) || 0) * 100) / 100);

    const isOverspent = remainingBalance < 0;
    const overspentAmount = isOverspent ? Math.round(Math.abs(remainingBalance) * 100) / 100 : 0;

    const hasMinBalanceSet = safeMinBalance > 0;
    // Low balance triggered when remaining balance <= min balance and NOT already negative
    const isLowBalance = hasMinBalanceSet && !isOverspent && remainingBalance <= safeMinBalance;
    const lowBalanceDeficit = isLowBalance ? Math.round((safeMinBalance - remainingBalance) * 100) / 100 : 0;

    // Percentage of available money spent (safely handling available money = 0)
    let percentSpent = 0;
    if (safeAvailable > 0) {
        percentSpent = Math.round((totalExpenses / safeAvailable) * 1000) / 10;
    }

    return {
        totalAvailable: safeAvailable,
        totalExpenses,
        remainingBalance,
        minBalance: safeMinBalance,
        hasMinBalanceSet,
        isLowBalance,
        lowBalanceDeficit,
        isOverspent,
        overspentAmount,
        percentSpent
    };
}

/**
 * Calculates category-wise summary with spending amounts, counts, and percentages
 * @param {Array} expenses 
 * @returns {Array} Array of summary objects sorted by total amount descending
 */
function calculateCategorySummary(expenses) {
    if (!Array.isArray(expenses)) return [];

    const totalSpending = calculateTotal(expenses);
    const categoryTotals = {};

    // Initialize all existing categories
    Object.keys(CATEGORIES).forEach(catKey => {
        categoryTotals[catKey] = {
            id: catKey,
            name: CATEGORIES[catKey].name,
            icon: CATEGORIES[catKey].icon,
            color: CATEGORIES[catKey].color,
            total: 0,
            count: 0,
            percentage: 0
        };
    });

    // Accumulate amounts
    expenses.forEach(item => {
        const catKey = item.category && CATEGORIES[item.category] ? item.category : 'other';
        categoryTotals[catKey].total += Number(item.amount) || 0;
        categoryTotals[catKey].count += 1;
    });

    // Compute percentages and format amounts
    const result = Object.values(categoryTotals).map(cat => {
        cat.total = Math.round(cat.total * 100) / 100;
        cat.percentage = totalSpending > 0
            ? Math.round((cat.total / totalSpending) * 1000) / 10
            : 0;
        return cat;
    });

    // Sort: categories with spending first, descending by total
    return result.sort((a, b) => b.total - a.total);
}

/**
 * Returns top spending category or null
 * @param {Array} summary 
 * @returns {Object|null}
 */
function getTopCategory(summary) {
    if (!Array.isArray(summary) || summary.length === 0) return null;
    const active = summary.filter(c => c.total > 0);
    return active.length > 0 ? active[0] : null;
}

/**
 * Filters expenses by search query and category
 * @param {Array} expenses 
 * @param {Object} filters - { query: string, category: string }
 * @returns {Array}
 */
function filterExpenses(expenses, filters = {}) {
    if (!Array.isArray(expenses)) return [];
    const query = (filters.query || '').trim().toLowerCase();
    const category = filters.category || 'all';

    return expenses.filter(item => {
        const matchesQuery = !query || item.name.toLowerCase().includes(query);
        const matchesCategory = category === 'all' || item.category === category;
        return matchesQuery && matchesCategory;
    });
}

/**
 * Returns realistic sample student expenses in Indian Rupees (₹)
 * @returns {Array}
 */
function getSampleExpenses() {
    const today = new Date();
    const formatDate = (daysAgo) => {
        const d = new Date(today);
        d.setDate(d.getDate() - daysAgo);
        return d.toISOString().split('T')[0];
    };

    return [
        {
            id: 'sample-1',
            name: 'Campus Cafeteria Lunch',
            amount: 120.00,
            category: 'food',
            date: formatDate(0),
            createdAt: new Date().toISOString()
        },
        {
            id: 'sample-2',
            name: 'Metro Transit Pass',
            amount: 500.00,
            category: 'travel',
            date: formatDate(1),
            createdAt: new Date().toISOString()
        },
        {
            id: 'sample-3',
            name: 'Semester Notebooks & Pens',
            amount: 250.00,
            category: 'education',
            date: formatDate(2),
            createdAt: new Date().toISOString()
        },
        {
            id: 'sample-4',
            name: 'Dorm Shared Wi-Fi Bill',
            amount: 350.00,
            category: 'bills',
            date: formatDate(4),
            createdAt: new Date().toISOString()
        },
        {
            id: 'sample-5',
            name: 'College Fest Ticket',
            amount: 200.00,
            category: 'entertainment',
            date: formatDate(6),
            createdAt: new Date().toISOString()
        }
    ];
}

/**
 * Calculates calendar days remaining from base date to target date string (YYYY-MM-DD)
 * @param {string} targetDateStr 
 * @param {Date} [baseDate] 
 * @returns {number|null} Days difference, 0 for today, negative for past, or null if invalid
 */
function calculateDaysRemaining(targetDateStr, baseDate = new Date()) {
    if (!targetDateStr || typeof targetDateStr !== 'string') return null;
    const parts = targetDateStr.split('-');
    if (parts.length !== 3) return null;

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

    const target = new Date(year, month, day);
    if (isNaN(target.getTime())) return null;

    const base = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
    const diffMs = target.getTime() - base.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Validates allowance plan form inputs
 * @param {Object} input - { date, amount }
 * @param {Date} [baseDate]
 * @returns {Object} { isValid, errors, data }
 */
function validateAllowancePlan(input, baseDate = new Date()) {
    const errors = {};

    if (!input || !input.date || typeof input.date !== 'string' || input.date.trim() === '') {
        errors.date = 'Please select your next expected allowance date.';
    } else {
        const days = calculateDaysRemaining(input.date, baseDate);
        if (days === null) {
            errors.date = 'Please provide a valid date.';
        } else if (days < 0) {
            errors.date = 'Next allowance date cannot be in the past.';
        }
    }

    const rawAmt = input ? input.amount : undefined;
    if (rawAmt === '' || rawAmt === null || rawAmt === undefined) {
        errors.amount = 'Please enter your expected allowance amount.';
    } else {
        const parsed = Number(rawAmt);
        if (isNaN(parsed) || !isFinite(parsed)) {
            errors.amount = 'Allowance amount must be a valid number.';
        } else if (parsed < 0) {
            errors.amount = 'Allowance amount cannot be negative.';
        } else if (parsed > 100000000) {
            errors.amount = 'Amount exceeds maximum limit (₹10,00,00,000).';
        }
    }

    const isValid = Object.keys(errors).length === 0;
    return {
        isValid,
        errors,
        data: isValid ? {
            date: input.date,
            amount: Math.round(Number(input.amount) * 100) / 100,
            daysRemaining: calculateDaysRemaining(input.date, baseDate)
        } : null
    };
}

/**
 * Calculates historical average daily spending using actual expense dates
 * @param {Array} expenses 
 * @param {Date} [baseDate] 
 * @returns {Object} { hasSufficientData, averageDailySpending, daysSpan, totalSpending, message }
 */
function calculateAverageDailySpending(expenses, baseDate = new Date()) {
    if (!Array.isArray(expenses) || expenses.length === 0) {
        return {
            hasSufficientData: false,
            averageDailySpending: 0,
            daysSpan: 0,
            totalSpending: 0,
            message: 'No recorded expense history yet.'
        };
    }

    const validExpenses = expenses.filter(e => {
        const amt = Number(e.amount);
        return !isNaN(amt) && amt > 0 && e.date && !isNaN(Date.parse(e.date));
    });

    if (validExpenses.length === 0) {
        return {
            hasSufficientData: false,
            averageDailySpending: 0,
            daysSpan: 0,
            totalSpending: 0,
            message: 'No valid expenses found.'
        };
    }

    const totalSpending = calculateTotal(validExpenses);
    const uniqueDates = Array.from(new Set(validExpenses.map(e => e.date))).sort();

    // If there is only 1 expense entry, flag as insufficient data for a reliable multi-day rate
    if (validExpenses.length < 2) {
        return {
            hasSufficientData: false,
            averageDailySpending: totalSpending,
            daysSpan: 1,
            totalSpending,
            message: 'Only 1 expense record found. Log expenses over multiple transactions for a reliable average.'
        };
    }

    // Determine calendar span from earliest expense to latest expense (or today if latest is earlier)
    const earliestDate = new Date(uniqueDates[0] + 'T00:00:00');
    const latestDate = new Date(uniqueDates[uniqueDates.length - 1] + 'T00:00:00');
    const todayNorm = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());

    const referenceEnd = latestDate > todayNorm ? latestDate : todayNorm;
    const diffMs = referenceEnd.getTime() - earliestDate.getTime();
    const daysDifference = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    const daysSpan = Math.max(uniqueDates.length, daysDifference + 1);

    const averageDailySpending = Math.round((totalSpending / daysSpan) * 100) / 100;

    return {
        hasSufficientData: true,
        averageDailySpending,
        daysSpan,
        totalSpending,
        message: `Calculated from ₹${totalSpending.toFixed(2)} spent across ${daysSpan} day${daysSpan === 1 ? '' : 's'}.`
    };
}

/**
 * Calculates allowance survival metrics and spending prediction
 * @param {Object} params
 * @returns {Object}
 */
function calculateAllowanceSurvival({
    remainingBalance = 0,
    minBalance = 0,
    allowanceDate = null,
    expectedAllowance = 0,
    expenses = [],
    baseDate = new Date()
}) {
    const safeRemaining = Math.round((Number(remainingBalance) || 0) * 100) / 100;
    const safeMinBalance = Math.max(0, Math.round((Number(minBalance) || 0) * 100) / 100);
    const safeExpectedAllowance = Math.max(0, Math.round((Number(expectedAllowance) || 0) * 100) / 100);

    const daysRemaining = calculateDaysRemaining(allowanceDate, baseDate);
    const hasPlanSet = daysRemaining !== null && daysRemaining >= 0;

    // Spendable money = current remaining balance - saved minimum balance (Never negative)
    const spendableMoney = Math.max(0, Math.round((safeRemaining - safeMinBalance) * 100) / 100);

    // Recommended daily spending limit = spendable money / days remaining (when days remaining > 0)
    let recommendedDailyLimit = 0;
    if (hasPlanSet) {
        if (daysRemaining > 0) {
            recommendedDailyLimit = Math.max(0, Math.round((spendableMoney / daysRemaining) * 100) / 100);
        } else {
            // Days remaining === 0 (due today)
            recommendedDailyLimit = spendableMoney;
        }
    }

    // Historical average daily spending
    const historyAnalysis = calculateAverageDailySpending(expenses, baseDate);
    const { hasSufficientData, averageDailySpending } = historyAnalysis;

    // Future projections
    let estimatedFutureSpending = null;
    let projectedBalance = null;
    let status = 'no_plan'; // 'no_plan' | 'due_today' | 'insufficient_data' | 'danger_run_out' | 'warning_buffer_breach' | 'safe_on_track'
    let message = '';
    let advice = '';

    if (!hasPlanSet) {
        status = 'no_plan';
        message = 'Set your next expected allowance date to unlock survival predictions.';
        advice = 'Setting your next allowance date helps you establish a realistic daily spending limit.';
    } else if (daysRemaining === 0) {
        status = 'due_today';
        message = 'Your allowance is due today!';
        advice = `You have ${spendableMoney > 0 ? '₹' + spendableMoney.toFixed(2) + ' spendable buffer' : '₹0 spendable buffer'} remaining before your new deposit.`;
    } else if (spendableMoney <= 0 && safeRemaining <= 0) {
        status = 'danger_run_out';
        message = `You currently have no remaining balance (${safeRemaining < 0 ? '-₹' + Math.abs(safeRemaining).toFixed(2) : '₹0.00'}) to last for the next ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}.`;
        advice = 'Pause all discretionary spending until your next allowance is received.';
    } else if (spendableMoney <= 0 && safeRemaining <= safeMinBalance) {
        status = 'warning_buffer_breach';
        message = `Your remaining balance (₹${safeRemaining.toFixed(2)}) is at or below your safety buffer (₹${safeMinBalance.toFixed(2)}). Your recommended daily spending limit is ₹0.`;
        advice = 'Avoid additional expenses to protect your emergency minimum balance.';
    } else if (!hasSufficientData) {
        status = 'insufficient_data';
        message = `Your next allowance is in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}. Recommended daily spending limit: ₹${recommendedDailyLimit.toFixed(2)}.`;
        advice = 'There is not enough recorded expense history for a reliable future prediction. Follow your recommended daily spending limit.';
    } else {
        estimatedFutureSpending = Math.round((averageDailySpending * daysRemaining) * 100) / 100;
        projectedBalance = Math.round((safeRemaining - estimatedFutureSpending) * 100) / 100;

        if (projectedBalance < 0) {
            status = 'danger_run_out';
            message = `Warning: At your current spending rate of ₹${averageDailySpending.toFixed(2)}/day, you may run out of money ${Math.abs(projectedBalance) > 0 ? '(deficit of ₹' + Math.abs(projectedBalance).toFixed(2) + ')' : ''} before your next allowance on ${allowanceDate}!`;
            advice = `Consider reducing your daily expenses toward your recommended limit of ₹${recommendedDailyLimit.toFixed(2)} to avoid running out of money.`;
        } else if (projectedBalance < safeMinBalance) {
            status = 'warning_buffer_breach';
            message = `Budget Warning: Your current spending rate (₹${averageDailySpending.toFixed(2)}/day) will cause your projected balance (₹${projectedBalance.toFixed(2)}) to drop below your minimum buffer of ₹${safeMinBalance.toFixed(2)}.`;
            advice = `Consider reducing your daily expenses toward ₹${recommendedDailyLimit.toFixed(2)} to protect your minimum balance buffer.`;
        } else {
            status = 'safe_on_track';
            message = `Great job! Your current spending rate (₹${averageDailySpending.toFixed(2)}/day) is sustainable. You are projected to reach your next allowance with ₹${projectedBalance.toFixed(2)} remaining.`;
            advice = `Keep your daily spending under your recommended limit of ₹${recommendedDailyLimit.toFixed(2)} to stay on track.`;
        }
    }

    return {
        remainingBalance: safeRemaining,
        minBalance: safeMinBalance,
        expectedAllowance: safeExpectedAllowance,
        allowanceDate,
        hasPlanSet,
        daysRemaining,
        spendableMoney,
        recommendedDailyLimit,
        hasSufficientData,
        averageDailySpending,
        estimatedFutureSpending,
        projectedBalance,
        status,
        message,
        advice
    };
}

// Module export for Node.js test runner and browser window object
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CATEGORIES,
        validateLogin,
        validateAvailableMoney,
        validateMinimumBalance,
        validateAllowancePlan,
        validateExpense,
        createExpense,
        calculateTotal,
        calculateFinancialSummary,
        calculateCategorySummary,
        calculateDaysRemaining,
        calculateAverageDailySpending,
        calculateAllowanceSurvival,
        getTopCategory,
        filterExpenses,
        getSampleExpenses
    };
}

if (typeof window !== 'undefined') {
    window.Tracker = {
        CATEGORIES,
        validateLogin,
        validateAvailableMoney,
        validateMinimumBalance,
        validateAllowancePlan,
        validateExpense,
        createExpense,
        calculateTotal,
        calculateFinancialSummary,
        calculateCategorySummary,
        calculateDaysRemaining,
        calculateAverageDailySpending,
        calculateAllowanceSurvival,
        getTopCategory,
        filterExpenses,
        getSampleExpenses
    };
}
