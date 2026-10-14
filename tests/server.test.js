const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const http = require('http');
const server = require('../server.js');

test('HTML Structure - contains all required elements for Login, Dashboard, and Minimum Balance Alert', () => {
    const htmlPath = path.join(__dirname, '..', 'index.html');
    const content = fs.readFileSync(htmlPath, 'utf8');

    // 1. Login View elements
    assert.ok(content.includes('id="login-view"'), 'Missing login view container');
    assert.ok(content.includes('id="login-form"'), 'Missing login form');
    assert.ok(content.includes('id="login-identifier"'), 'Missing email/username input');
    assert.ok(content.includes('id="login-password"'), 'Missing password input');
    assert.ok(content.includes('id="btn-toggle-password"'), 'Missing password show/hide toggle');

    // 2. Dashboard View & Alerts
    assert.ok(content.includes('id="dashboard-view"'), 'Missing dashboard view container');
    assert.ok(content.includes('id="low-balance-alert"'), 'Missing low balance alert banner');
    assert.ok(content.includes('id="overspending-alert"'), 'Missing overspending alert banner');

    // 3. Minimum Balance Alert Section
    assert.ok(content.includes('id="min-balance-section"'), 'Missing min balance section');
    assert.ok(content.includes('id="min-balance-form"'), 'Missing min balance form');
    assert.ok(content.includes('id="input-min-balance"'), 'Missing min balance input');
    assert.ok(content.includes('id="btn-update-min-balance"'), 'Missing update min balance button');
    assert.ok(content.includes('id="min-balance-status-badge"'), 'Missing min balance status badge');
    assert.ok(content.includes('id="btn-toggle-notifications"'), 'Missing notification toggle button');

    // 4. Summary Cards & Remaining Balance Badge
    assert.ok(content.includes('id="kpi-available-money"'), 'Missing available money KPI card');
    assert.ok(content.includes('id="kpi-total-expenses"'), 'Missing total expenses KPI card');
    assert.ok(content.includes('id="kpi-remaining-balance"'), 'Missing remaining balance KPI card');
    assert.ok(content.includes('id="balance-badge"'), 'Missing balance status badge');

    // 5. StudentSpend AI Coach & Chat Assistant
    assert.ok(content.includes('id="ai-coach-section"'), 'Missing AI coach section');
    assert.ok(content.includes('id="ai-pacing-banner"'), 'Missing AI pacing banner');
    assert.ok(content.includes('id="ai-suggestions-grid"'), 'Missing AI saving suggestions grid');
    assert.ok(content.includes('id="ai-chat-section"'), 'Missing AI chat section');
    assert.ok(content.includes('id="ai-chat-messages"'), 'Missing AI chat messages feed');
    assert.ok(content.includes('id="ai-chat-input"'), 'Missing AI chat input field');
});

test('HTTP Server - successfully serves updated index.html, styles, and scripts', async () => {
    let httpServer;
    await new Promise((resolve) => {
        httpServer = server.listen(3097, resolve);
    });

    const fetchUrl = (urlPath) => new Promise((resolve, reject) => {
        http.get(`http://localhost:3097${urlPath}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
        }).on('error', reject);
    });

    try {
        const homeRes = await fetchUrl('/');
        assert.strictEqual(homeRes.statusCode, 200);
        assert.ok(homeRes.body.includes('Minimum Balance Alert'));
        assert.ok(homeRes.body.includes('id="low-balance-alert"'));

        const trackerRes = await fetchUrl('/js/tracker.js');
        assert.strictEqual(trackerRes.statusCode, 200);
        assert.ok(trackerRes.body.includes('validateMinimumBalance'));

        const appRes = await fetchUrl('/js/app.js');
        assert.strictEqual(appRes.statusCode, 200);
        assert.ok(appRes.body.includes('STORAGE_KEY_MIN_BALANCE'));
    } finally {
        if (httpServer) {
            await new Promise((resolve) => httpServer.close(resolve));
        }
    }
});
