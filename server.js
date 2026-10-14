
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
require('dotenv').config();

const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: false, // For local development on localhost
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));

// Test backend and database
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');

        res.json({
            message: 'Student Expense Tracker backend is running!',
            database: 'Connected'
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            message: 'Database connection failed.'
        });
    }
});

// Register a new account
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (
            typeof name !== 'string' ||
            typeof email !== 'string' ||
            typeof password !== 'string' ||
            !name.trim() ||
            !email.trim() ||
            password.length < 8
        ) {
            return res.status(400).json({
                message: 'Enter your name, a valid email, and a password of at least 8 characters.'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return res.status(400).json({
                message: 'Please enter a valid email address.'
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash)
             VALUES ($1, $2, $3)
             RETURNING id, name, email`,
            [name.trim(), normalizedEmail, passwordHash]
        );

        res.status(201).json({
            message: 'Account created successfully. You can now sign in.',
            user: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                message: 'An account with this email already exists.'
            });
        }

        console.error('Registration error:', error.message);
        res.status(500).json({
            message: 'Unable to create account right now.'
        });
    }
});

// Sign in
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== 'string' ||
            typeof password !== 'string' ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: 'Enter your email and password.'
            });
        }

        const result = await pool.query(
            `SELECT id, name, email, password_hash
             FROM users
             WHERE email = $1`,
            [email.trim().toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        const user = result.rows[0];
        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        // Regenerate session after successful authentication
        req.session.regenerate((error) => {
            if (error) {
                console.error(error.message);
                return res.status(500).json({
                    message: 'Unable to start your session.'
                });
            }

            req.session.userId = user.id;

            res.json({
                message: 'Login successful.',
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                }
            });
        });
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({
            message: 'Unable to sign in right now.'
        });
    }
});

// Check whether a user is signed in
app.get('/api/me', async (req, res) => {

    if (!req.session.userId) {
        return res.status(401).json({
            message: 'Not signed in.'
        });
    }

    try {
        const result = await pool.query(
            'SELECT id, name, email FROM users WHERE id = $1',
            [req.session.userId]
        );

        if (result.rows.length === 0) {
            return req.session.destroy(() => {
                res.status(401).json({
                    message: 'Account not found.'
                });
            });
        }

        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            message: 'Unable to check your session.'
        });
    }
});

// Sign out
app.post('/api/logout', (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            return res.status(500).json({
                message: 'Unable to sign out.'
            });
        }

        res.clearCookie('connect.sid');

        return res.json({
            message: 'Signed out successfully.'
        });
    });
});

 // Get expenses for the signed-in user
app.get('/api/expenses', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            message: 'Please sign in first.'
        });
    }

    try {
        const result = await pool.query(
            `SELECT id, title, amount, category, expense_date
             FROM expenses
             WHERE user_id = $1
             ORDER BY expense_date DESC, id DESC`,
            [req.session.userId]
        );

        res.json({ expenses: result.rows });
    } catch (error) {
        console.error('Error fetching expenses:', error.message);
        res.status(500).json({
            message: 'Unable to fetch expenses.'
        });
    }
});


// Add an expense for the signed-in user
app.post('/api/expenses', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            message: 'Please sign in first.'
        });
    }

    const { title, amount, category, expense_date } = req.body;

    if (
        typeof title !== 'string' ||
        !title.trim() ||
        title.trim().length > 150 ||
        typeof category !== 'string' ||
        !category.trim() ||
        category.trim().length > 50 ||
        amount === undefined ||
        amount === null ||
        amount === '' ||
        !Number.isFinite(Number(amount)) ||
        Number(amount) <= 0 ||
        Number(amount) > 99999999.99
    ) {
        return res.status(400).json({
            message: 'Please enter a valid title, amount, and category.'
        });
    }

    const date = expense_date || new Date().toISOString().split('T')[0];

    if (
        typeof date !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        Number.isNaN(Date.parse(date)) ||
        new Date(date).toISOString().slice(0, 10) !== date
    ) {
        return res.status(400).json({
            message: 'Please enter a valid expense date.'
        });
    }

    try {
        const result = await pool.query(
            `INSERT INTO expenses
                (user_id, title, amount, category, expense_date)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, title, amount, category, expense_date`,
            [
                req.session.userId,
                title.trim(),
                Number(amount),
                category.trim(),
                date
            ]
        );

        res.status(201).json({
            message: 'Expense added successfully.',
            expense: result.rows[0]
        });
    } catch (error) {
        console.error('Error adding expense:', error.message);
        res.status(500).json({
            message: 'Unable to add expense.'
        });
    }
});

/**
 * Delete an expense belonging to the logged-in user
 */
app.delete('/api/expenses/:id', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            message: 'Please log in first.'
        });
    }

    const expenseId = Number(req.params.id);

    if (!Number.isInteger(expenseId) || expenseId <= 0) {
        return res.status(400).json({
            message: 'Invalid expense ID.'
        });
    }

    try {
        const result = await pool.query(
            `DELETE FROM expenses
             WHERE id = $1 AND user_id = $2
             RETURNING id`,
            [expenseId, req.session.userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: 'Expense not found.'
            });
        }

        return res.json({
            message: 'Expense deleted successfully.'
        });
    } catch (error) {
        console.error('Error deleting expense:', error);
        return res.status(500).json({
            message: 'Unable to delete expense.'
        });
    }
});

/**
 * Clear all expenses for the signed-in user
 */
app.delete('/api/expenses', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            message: 'Please sign in first.'
        });
    }

    try {
        await pool.query(
            'DELETE FROM expenses WHERE user_id = $1',
            [req.session.userId]
        );

        return res.json({
            message: 'All expenses cleared successfully.'
        });
    } catch (error) {
        console.error('Error clearing expenses:', error);

        return res.status(500).json({
            message: 'Unable to clear expenses.'
        });
    }
});




        
/**
 * ============================================================================
 * STUDENTSPEND AI: FINANCIAL INTELLIGENCE & COACHING ENGINE
 * ============================================================================
 */

/**
 * Computes live financial metrics and context from the student's actual expenses in PostgreSQL.
 * Does not invent data; strictly operates on recorded rows and budget parameters.
 */
async function computeFinancialContext(userId, params = {}) {
    const availableMoney = Math.max(0, Number(params.availableMoney) || 0);
    const minBalance = Math.max(0, Number(params.minBalance) || 0);
    const expectedAllowance = Math.max(0, Number(params.expectedAllowance) || 0);
    const allowanceDate = params.allowanceDate && !isNaN(Date.parse(params.allowanceDate)) ? params.allowanceDate : null;

    // Fetch user's actual expenses from PostgreSQL
    const result = await pool.query(
        `SELECT id, title, amount, category, expense_date
         FROM expenses
         WHERE user_id = $1
         ORDER BY expense_date DESC, id DESC`,
        [userId]
    );

    const expenses = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        amount: Number(row.amount) || 0,
        category: (row.category || 'other').toLowerCase(),
        date: row.expense_date ? new Date(row.expense_date).toISOString().split('T')[0] : ''
    }));

    const totalExpenses = Math.round(expenses.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;
    const remainingBalance = Math.round((availableMoney - totalExpenses) * 100) / 100;
    const spendableMoney = Math.max(0, Math.round((remainingBalance - minBalance) * 100) / 100);

    // Calculate days remaining until allowance
    let daysRemaining = 0;
    if (allowanceDate) {
        const today = new Date();
        const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
        const parts = allowanceDate.split('-');
        const targetUtc = Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        const diffMs = targetUtc - todayUtc;
        daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    // Daily spending limit to survive until next allowance
    const recommendedDailyLimit = daysRemaining > 0 
        ? Math.max(0, Math.round((spendableMoney / daysRemaining) * 100) / 100) 
        : spendableMoney;

    // Category breakdown
    const categoryTotals = {};
    expenses.forEach(e => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    const categoryList = Object.entries(categoryTotals)
        .map(([cat, total]) => ({
            category: cat,
            total: Math.round(total * 100) / 100,
            percent: totalExpenses > 0 ? Math.round((total / totalExpenses) * 100) : 0
        }))
        .sort((a, b) => b.total - a.total);

    const topCategory = categoryList[0] || null;

    // Calculate average daily burn rate using date span
    let averageDailySpending = 0;
    let daysSpan = 1;
    if (expenses.length > 0) {
        const validDates = expenses.filter(e => e.date).map(e => e.date).sort();
        if (validDates.length > 0) {
            const earliest = new Date(validDates[0]);
            const latest = new Date(validDates[validDates.length - 1]);
            const today = new Date();
            const refEnd = latest > today ? latest : today;
            const diffDays = Math.max(1, Math.round((refEnd - earliest) / (1000 * 60 * 60 * 24)) + 1);
            daysSpan = Math.max(new Set(validDates).size, diffDays);
            averageDailySpending = Math.round((totalExpenses / daysSpan) * 100) / 100;
        } else {
            averageDailySpending = totalExpenses;
        }
    }

    const projectedSpending = daysRemaining > 0 ? Math.round((averageDailySpending * daysRemaining) * 100) / 100 : 0;
    const projectedBalance = Math.round((remainingBalance - projectedSpending) * 100) / 100;
    const shortfall = projectedBalance < minBalance 
        ? Math.max(0, Math.round((minBalance - projectedBalance) * 100) / 100) 
        : 0;

    const isAtRisk = (daysRemaining > 0 && projectedBalance < minBalance) || (remainingBalance <= minBalance);

    return {
        availableMoney,
        totalExpenses,
        remainingBalance,
        minBalance,
        spendableMoney,
        allowanceDate,
        expectedAllowance,
        daysRemaining,
        recommendedDailyLimit,
        averageDailySpending,
        daysSpan,
        projectedBalance,
        shortfall,
        isAtRisk,
        categoryList,
        topCategory,
        expenseCount: expenses.length
    };
}

/**
 * Transparent Rule-Based Financial Reasoner
 * Provides mathematically grounded, student-specific advice with zero hallucination.
 */
function generateRuleBasedChatReply(userMessage, context) {
    const text = (userMessage || '').toLowerCase();
    const {
        remainingBalance,
        minBalance,
        spendableMoney,
        daysRemaining,
        recommendedDailyLimit,
        averageDailySpending,
        topCategory,
        isAtRisk,
        shortfall
    } = context;

    // Check for affordability queries: e.g. "Can I spend ₹200?", "Can I afford 350?"
    const spendMatch = text.match(/(?:can\s+i\s+(?:afford|spend)|afford|spend|buy)\D*?(\d+(?:\.\d+)?)/i) ||
                       text.match(/(?:₹|rs\.?|inr)\s*(\d+(?:\.\d+)?)/i);

    if (spendMatch && spendMatch[1]) {
        const askAmount = parseFloat(spendMatch[1]);
        if (askAmount <= 0) {
            return `A ₹0 purchase has no financial impact! Your remaining balance is ₹${remainingBalance.toFixed(2)}.`;
        }

        if (remainingBalance <= 0) {
            return `🚨 Overspending Alert: Your balance is currently exhausted (₹${remainingBalance.toFixed(2)}). Spending ₹${askAmount.toFixed(2)} will worsen your deficit. Stick to essential emergency funds only.`;
        }

        if (remainingBalance - askAmount < minBalance) {
            const safeSpend = Math.max(0, remainingBalance - minBalance);
            return `⚠️ Careful! Spending ₹${askAmount.toFixed(2)} will drop your balance to ₹${(remainingBalance - askAmount).toFixed(2)}, which breaches your minimum safety buffer of ₹${minBalance.toFixed(2)}. To stay completely safe, you can spend up to ₹${safeSpend.toFixed(2)} today.`;
        }

        if (daysRemaining > 0) {
            if (askAmount <= recommendedDailyLimit) {
                return `✅ Yes, absolutely! ₹${askAmount.toFixed(2)} is well within your recommended safe daily limit of ₹${recommendedDailyLimit.toFixed(2)}. After this purchase, your balance will be ₹${(remainingBalance - askAmount).toFixed(2)} with ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining until your next allowance.`;
            } else if (askAmount <= spendableMoney) {
                const daysLeftAfterToday = Math.max(1, daysRemaining - 1);
                const remainingSpendableAfter = Math.max(0, spendableMoney - askAmount);
                const newDailyLimit = Math.round((remainingSpendableAfter / daysLeftAfterToday) * 100) / 100;
                return `⚠️ You can technically afford ₹${askAmount.toFixed(2)} without breaching your safety buffer, but it exceeds your recommended daily limit of ₹${recommendedDailyLimit.toFixed(2)}. If you spend this today, your daily limit for the remaining ${daysLeftAfterToday} day${daysLeftAfterToday === 1 ? '' : 's'} drops to ₹${newDailyLimit.toFixed(2)}/day.`;
            }
        }

        return `✅ Yes, you have ₹${remainingBalance.toFixed(2)} available. Spending ₹${askAmount.toFixed(2)} leaves you with ₹${(remainingBalance - askAmount).toFixed(2)}.`;
    }

    // Check for survival duration queries: e.g. "How can I make my money last another 7 days?"
    const daysMatch = text.match(/last\s*(?:another\s*)?(\d+)\s*days?/i) || text.match(/survive\s*(\d+)\s*days?/i);
    if (daysMatch && daysMatch[1]) {
        const targetDays = parseInt(daysMatch[1], 10);
        if (targetDays > 0) {
            const dailyRateForTarget = Math.round((spendableMoney / targetDays) * 100) / 100;
            const topCategoryNote = topCategory 
                ? `Your largest expense category is **${topCategory.category.toUpperCase()}** (₹${topCategory.total.toFixed(2)}, ${topCategory.percent}% of total spend). Trimming discretionary spending here will make the biggest difference.` 
                : 'Log your daily expenses consistently to pinpoint savings.';
            
            return `To make your money last ${targetDays} day${targetDays === 1 ? '' : 's'}:\n` +
                   `• **Safe Daily Budget:** Spend no more than **₹${dailyRateForTarget.toFixed(2)}/day** (from your spendable pool of ₹${spendableMoney.toFixed(2)} above your safety buffer).\n` +
                   `• **Category Insight:** ${topCategoryNote}\n` +
                   `• **Action Plan:** Prioritize campus meals/canteen over food deliveries, walk or use transit passes, and hold off non-essential shopping until your next allowance.`;
        }
    }

    // Category / overspending queries
    if (text.includes('category') || text.includes('overspending') || text.includes('where is my money') || text.includes('spending on')) {
        if (!topCategory) {
            return `You haven't recorded any expenses yet! Once you log a few meals or purchases, I will break down your category trends and highlight savings opportunities.`;
        }
        return `📊 **Spending Pattern Analysis:**\n` +
               `• Your #1 expense category is **${topCategory.category.toUpperCase()}** at ₹${topCategory.total.toFixed(2)} (${topCategory.percent}% of total expenses).\n` +
               `• Current burn rate: **₹${averageDailySpending.toFixed(2)}/day**.\n` +
               `• ${isAtRisk ? `⚠️ Warning: At this burn rate, you face a projected shortfall of ₹${shortfall.toFixed(2)} before your next allowance.` : `✅ You are currently on track to maintain your safety balance.`}`;
    }

    // General Student Guidance
    const daysNote = daysRemaining > 0 
        ? `You have **${daysRemaining} day${daysRemaining === 1 ? '' : 's'}** until your next allowance, with a safe daily spending limit of **₹${recommendedDailyLimit.toFixed(2)}/day**.`
        : `Set your next allowance date in the Predictor to unlock automated daily limits.`;

    return `🎓 **StudentSpend AI Coach:**\n` +
           `• **Remaining Balance:** ₹${remainingBalance.toFixed(2)} (Safety buffer: ₹${minBalance.toFixed(2)}).\n` +
           `• **Daily Target:** ${daysNote}\n` +
           `• **Quick Tip:** ${topCategory ? `Cut back on **${topCategory.category}** by 15% this week to build an extra cash cushion.` : `Keep tracking every small expense to stay stress-free!`}\n\n` +
           `Ask me things like *"Can I afford ₹150 for lunch?"* or *"How to last 5 days?"*`;
}

/**
 * Connects securely to the Google Gemini API if configured.
 * Never exposes API keys to client JavaScript.
 */
async function callGeminiAssistant(systemPrompt, userPrompt) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
    if (!apiKey || !apiKey.trim()) {
        return null;
    }

    try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey.trim())}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: `${systemPrompt}\n\nStudent Query: "${userPrompt}"\nProvide a direct, encouraging, practical answer in 2-4 sentences or short bullet points.` }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 300
                }
            })
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn(`Gemini API returned status ${response.status}. Falling back to rule-based engine.`);
            return null;
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        return text ? text.trim() : null;
    } catch (err) {
        console.warn('Gemini API call failed or timed out:', err.message);
        return null;
    }
}

/**
 * POST /api/ai/chat
 * Interactive student chat assistant with live financial context.
 */
app.post('/api/ai/chat', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Please sign in first.' });
    }

    const { message, availableMoney, minBalance, allowanceDate, expectedAllowance } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ message: 'Please provide a valid question.' });
    }

    try {
        const context = await computeFinancialContext(req.session.userId, {
            availableMoney,
            minBalance,
            allowanceDate,
            expectedAllowance
        });

        const systemPrompt = `You are StudentSpend AI, an empathetic, smart financial coach for college students.
Current verified financial context for this student:
- Available Money: ₹${context.availableMoney.toFixed(2)}
- Total Expenses Recorded: ₹${context.totalExpenses.toFixed(2)}
- Current Remaining Balance: ₹${context.remainingBalance.toFixed(2)}
- Minimum Safety Buffer: ₹${context.minBalance.toFixed(2)}
- Spendable Pool (Balance - Buffer): ₹${context.spendableMoney.toFixed(2)}
- Days until Next Allowance: ${context.daysRemaining} days (Expected: ₹${context.expectedAllowance.toFixed(2)})
- Recommended Daily Spending Limit: ₹${context.recommendedDailyLimit.toFixed(2)}/day
- Current Average Burn Rate: ₹${context.averageDailySpending.toFixed(2)}/day
- Top Spending Category: ${context.topCategory ? `${context.topCategory.category} (₹${context.topCategory.total.toFixed(2)}, ${context.topCategory.percent}%)` : 'None yet'}
- Financial Status: ${context.isAtRisk ? `At Risk of shortfall (₹${context.shortfall.toFixed(2)})` : 'Safe and on track'}

Strict guidelines:
1. Always use these exact figures. NEVER invent or hallucinate financial values.
2. If the student asks if they can afford an expense, compare it directly to their Recommended Daily Limit and Minimum Safety Buffer.
3. Be practical, friendly, and give specific college-student tips (mess food, bus passes, shared textbooks).`;

        const geminiReply = await callGeminiAssistant(systemPrompt, message.trim());

        if (geminiReply) {
            return res.json({
                reply: geminiReply,
                mode: 'gemini-ai',
                isFallback: false,
                context: {
                    remainingBalance: context.remainingBalance,
                    recommendedDailyLimit: context.recommendedDailyLimit,
                    daysRemaining: context.daysRemaining,
                    isAtRisk: context.isAtRisk
                }
            });
        }

        // Transparent Rule-Based Fallback Engine
        const ruleReply = generateRuleBasedChatReply(message.trim(), context);
        return res.json({
            reply: ruleReply,
            mode: 'rule-based-fallback',
            isFallback: true,
            label: 'Rule-Based Financial Intelligence Engine (Fallback Mode)',
            context: {
                remainingBalance: context.remainingBalance,
                recommendedDailyLimit: context.recommendedDailyLimit,
                daysRemaining: context.daysRemaining,
                isAtRisk: context.isAtRisk
            }
        });
    } catch (error) {
        console.error('AI chat endpoint error:', error);
        return res.status(500).json({ message: 'Unable to process AI request at this time.' });
    }
});

/**
 * POST /api/ai/insights
 * Delivers personalized coach summaries, survival alerts, and targeted saving suggestions.
 */
app.post('/api/ai/insights', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Please sign in first.' });
    }

    const { availableMoney, minBalance, allowanceDate, expectedAllowance } = req.body;

    try {
        const context = await computeFinancialContext(req.session.userId, {
            availableMoney,
            minBalance,
            allowanceDate,
            expectedAllowance
        });

        // 1. Personalized Saving Suggestions based on top category
        const savingSuggestions = [];
        if (context.topCategory) {
            const cat = context.topCategory.category;
            if (cat === 'food') {
                savingSuggestions.push({
                    title: 'Campus Meal Optimization',
                    tip: `Food accounts for ${context.topCategory.percent}% of your budget. Opt for college hostel mess or prepaid dining passes instead of external food deliveries to save ~₹500/week.`
                });
            } else if (cat === 'travel') {
                savingSuggestions.push({
                    title: 'Student Transit Pass',
                    tip: `Travel is ${context.topCategory.percent}% of your expenses. Apply for a monthly student bus/metro pass or carpool with batchmates to reduce transit costs by up to 40%.`
                });
            } else if (cat === 'shopping' || cat === 'entertainment') {
                savingSuggestions.push({
                    title: '48-Hour Purchase Rule',
                    tip: `${cat.charAt(0).toUpperCase() + cat.slice(1)} took ₹${context.topCategory.total.toFixed(2)}. Apply a mandatory 48-hour cooling period for non-essential buys to curb impulse spending.`
                });
            } else if (cat === 'education') {
                savingSuggestions.push({
                    title: 'Digital & Library Resources',
                    tip: `Borrow reference books from your campus library or use open-source student digital notes to cut book expenditures.`
                });
            } else {
                savingSuggestions.push({
                    title: `Audit ${cat.charAt(0).toUpperCase() + cat.slice(1)} Spending`,
                    tip: `Review your ₹${context.topCategory.total.toFixed(2)} spent on ${cat} and set a soft cap for the next 7 days.`
                });
            }
        } else {
            savingSuggestions.push({
                title: 'Track All Transactions',
                tip: 'Record every small snack or stationery purchase to allow StudentSpend AI to detect hidden leakages in your allowance.'
            });
        }

        // Generic supplementary tips
        savingSuggestions.push({
            title: 'Daily Spending Discipline',
            tip: context.daysRemaining > 0 
                ? `Cap your daily out-of-pocket spending at ₹${context.recommendedDailyLimit.toFixed(2)} to guarantee your allowance lasts until ${context.allowanceDate}.`
                : `Set a scheduled allowance date in the Predictor to establish an automated daily spending cap.`
        });

        // 2. Spending Alerts with rationale
        let spendingAlert = null;
        if (context.isAtRisk) {
            spendingAlert = {
                type: 'warning',
                title: 'Allowance Shortfall Risk Detected',
                message: context.daysRemaining > 0
                    ? `At your current burn rate of ₹${context.averageDailySpending.toFixed(2)}/day, your funds will drop below your minimum buffer of ₹${context.minBalance.toFixed(2)} before your next allowance, creating a projected shortfall of ₹${context.shortfall.toFixed(2)}.`
                    : `Your balance (₹${context.remainingBalance.toFixed(2)}) is equal to or below your saved minimum buffer limit of ₹${context.minBalance.toFixed(2)}.`
            };
        } else {
            spendingAlert = {
                type: 'success',
                title: 'Spending Pacing On Track',
                message: `You are spending safely. Your burn rate (₹${context.averageDailySpending.toFixed(2)}/day) is well matched with your daily limit of ₹${context.recommendedDailyLimit.toFixed(2)}/day.`
            };
        }

        // 3. Coach Diagnostic Summary
        const coachSummary = context.remainingBalance <= 0 
            ? 'Deficit Alert: Available money fully exhausted. Restrict expenditures to absolute essentials.'
            : context.isAtRisk 
                ? `Pacing Warning: Slow down spending by ₹${Math.max(0, context.averageDailySpending - context.recommendedDailyLimit).toFixed(2)}/day to protect your safety buffer.`
                : `Healthy Pacing: Your budget is well balanced for the remaining ${context.daysRemaining} days.`;

        const hasApiKey = Boolean(process.env.GEMINI_API_KEY || process.env.AI_API_KEY);

        return res.json({
            coachMessage: coachSummary,
            survivalStatus: {
                daysRemaining: context.daysRemaining,
                recommendedDailyLimit: context.recommendedDailyLimit,
                projectedBalance: context.projectedBalance,
                shortfall: context.shortfall,
                isAtRisk: context.isAtRisk
            },
            savingSuggestions,
            spendingAlert,
            mode: hasApiKey ? 'gemini-ai-ready' : 'rule-based-fallback',
            isFallback: !hasApiKey,
            label: hasApiKey ? 'AI Connected' : 'Rule-Based Financial Intelligence Engine (Fallback Mode)'
        });
    } catch (error) {
        console.error('AI insights endpoint error:', error);
        return res.status(500).json({ message: 'Unable to generate financial insights.' });
    }
});


if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Student Expense Tracker running at http://localhost:${PORT}`);
    });
}

process.on('SIGINT', async () => {
    await pool.end();
    process.exit(0);
});

app.generateRuleBasedChatReply = generateRuleBasedChatReply;
module.exports = app;

