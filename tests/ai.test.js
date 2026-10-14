const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const server = require('../server.js');

test('AI Endpoints - reject unauthenticated requests with 401', async () => {
    let httpServer;
    await new Promise((resolve) => {
        httpServer = server.listen(3098, resolve);
    });

    const postJson = (path, body) => new Promise((resolve, reject) => {
        const payload = JSON.stringify(body);
        const req = http.request({
            hostname: 'localhost',
            port: 3098,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, data: JSON.parse(data) }));
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });

    try {
        const chatRes = await postJson('/api/ai/chat', { message: 'Can I afford ₹200?' });
        assert.strictEqual(chatRes.statusCode, 401);
        assert.ok(chatRes.data.message.includes('sign in'));

        const insightsRes = await postJson('/api/ai/insights', {});
        assert.strictEqual(insightsRes.statusCode, 401);
        assert.ok(insightsRes.data.message.includes('sign in'));
    } finally {
        if (httpServer) {
            await new Promise((resolve) => httpServer.close(resolve));
        }
    }
});

test('Rule-Based Reasoner - accurately handles affordability queries', () => {
    const context = {
        availableMoney: 5000,
        totalExpenses: 2000,
        remainingBalance: 3000,
        minBalance: 1500,
        spendableMoney: 1500,
        daysRemaining: 5,
        recommendedDailyLimit: 300,
        averageDailySpending: 200,
        topCategory: { category: 'food', total: 1200, percent: 60 },
        isAtRisk: false,
        shortfall: 0
    };

    // Safe spend under daily limit (₹200 <= ₹300)
    const replySafe = server.generateRuleBasedChatReply('Can I afford to spend ₹200 today?', context);
    assert.ok(replySafe.includes('Yes, absolutely!'), 'Should approve safe spending');
    assert.ok(replySafe.includes('200.00'), 'Should mention amount');
    assert.ok(replySafe.includes('300.00'), 'Should mention daily limit');

    // Spend that breaches minimum safety buffer (₹2000 > ₹1500 spendable buffer)
    const replyBreach = server.generateRuleBasedChatReply('Can I afford ₹2000 for shopping?', context);
    assert.ok(replyBreach.includes('breaches your minimum safety buffer'), 'Should warn when buffer is breached');
    assert.ok(replyBreach.includes('1500.00'), 'Should mention buffer limit');
});

test('Rule-Based Reasoner - handles survival duration query (e.g., 7 days)', () => {
    const context = {
        availableMoney: 5000,
        totalExpenses: 2000,
        remainingBalance: 3000,
        minBalance: 900,
        spendableMoney: 2100, // 2100 / 7 days = 300/day
        daysRemaining: 10,
        recommendedDailyLimit: 210,
        averageDailySpending: 250,
        topCategory: { category: 'food', total: 1200, percent: 60 },
        isAtRisk: false,
        shortfall: 0
    };

    const reply = server.generateRuleBasedChatReply('How can I make my money last another 7 days?', context);
    assert.ok(reply.includes('Safe Daily Budget'), 'Should provide safe daily budget');
    assert.ok(reply.includes('300.00/day'), 'Should calculate ₹300/day for 7 days (2100/7)');
    assert.ok(reply.includes('FOOD'), 'Should cite top expense category');
});

test('Rule-Based Reasoner - analyzes category and overspending queries', () => {
    const context = {
        availableMoney: 5000,
        totalExpenses: 4000,
        remainingBalance: 1000,
        minBalance: 1200,
        spendableMoney: 0,
        daysRemaining: 4,
        recommendedDailyLimit: 0,
        averageDailySpending: 400,
        topCategory: { category: 'entertainment', total: 2400, percent: 60 },
        isAtRisk: true,
        shortfall: 600
    };

    const reply = server.generateRuleBasedChatReply('Which category am I overspending on?', context);
    assert.ok(reply.includes('ENTERTAINMENT'), 'Should identify entertainment as top category');
    assert.ok(reply.includes('60%'), 'Should show category percentage');
    assert.ok(reply.includes('shortfall of ₹600.00'), 'Should accurately report shortfall');
});

