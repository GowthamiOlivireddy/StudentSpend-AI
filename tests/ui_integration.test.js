const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('Client Controller (app.js) - includes AI Insights, Predictor, and Chat wiring', () => {
    const appJsPath = path.join(__dirname, '..', 'js', 'app.js');
    const content = fs.readFileSync(appJsPath, 'utf8');

    // 1. Controller functions exist
    assert.ok(content.includes('function loadAiInsights'), 'Missing loadAiInsights function in app.js');
    assert.ok(content.includes('function renderAllowancePredictor'), 'Missing renderAllowancePredictor function in app.js');
    assert.ok(content.includes('function handleAllowanceFormSubmit'), 'Missing handleAllowanceFormSubmit function in app.js');
    assert.ok(content.includes('function handleAiChatSubmit'), 'Missing handleAiChatSubmit function in app.js');
    assert.ok(content.includes('function appendChatMessage'), 'Missing appendChatMessage function in app.js');

    // 2. API Endpoints are called
    assert.ok(content.includes("fetch('/api/ai/insights'"), 'Missing /api/ai/insights call');
    assert.ok(content.includes("fetch('/api/ai/chat'"), 'Missing /api/ai/chat call');

    // 3. Form submission default navigation is prevented
    assert.ok(content.includes('elements.allowanceForm.addEventListener(\'submit\', handleAllowanceFormSubmit)'), 'Missing allowanceForm listener');
    assert.ok(content.includes('elements.aiChatForm.addEventListener(\'submit\', handleAiChatSubmit)'), 'Missing aiChatForm listener');
    assert.ok(content.includes('e.preventDefault()'), 'Missing preventDefault handling');

    // 4. Quick-ask prompt chips are connected
    assert.ok(content.includes('promptChips.forEach'), 'Missing promptChips click binding');
});
