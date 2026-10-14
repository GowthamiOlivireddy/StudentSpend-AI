/**
 * Student Expense Tracker - Main Application Controller
 * Handles authentication views, available money, minimum balance alerts & notifications,
 * financial summaries with low balance and overspending alerts, canvas donut chart, and LocalStorage persistence.
 */

(function () {
    'use strict';

    // Storage Keys
    const STORAGE_KEY_USER = 'student_tracker_user_v1';
    const STORAGE_KEY_AVAILABLE = 'student_tracker_available_v1';
    const STORAGE_KEY_MIN_BALANCE = 'student_tracker_min_balance_v1';
    const STORAGE_KEY_NOTIF = 'student_tracker_notif_enabled_v1';
    const STORAGE_KEY_EXPENSES = 'student_tracker_expenses_v1';
    const STORAGE_KEY_ALLOWANCE_DATE = 'student_tracker_allowance_date_v1';
    const STORAGE_KEY_ALLOWANCE_AMOUNT = 'student_tracker_allowance_amount_v1';

    // Application State
    const state = {
        currentUser: null,
        availableMoney: 5000,   // Default student allowance in ₹
        minBalance: 0,          // Minimum balance alert threshold in ₹
        allowanceDate: null,
        expectedAllowance: 0,
        notificationsEnabled: false,
        wasBelowThreshold: false, // Prevents repeated notification spam; triggers only on threshold transition
        expenses: [],
        currency: '₹',
        filterQuery: '',
        filterCategory: 'all'
    };

    // DOM Elements Cache
    const elements = {
        // Views
        loginView: document.getElementById('login-view'),
        dashboardView: document.getElementById('dashboard-view'),

        // Login View
        loginForm: document.getElementById('login-form'),
        
        // Registration View
        registerForm: document.getElementById('register-form'),
        registerName: document.getElementById('register-name'),
        registerEmail: document.getElementById('register-email'),
        registerPassword: document.getElementById('register-password'),
        registerConfirmPassword: document.getElementById('register-confirm-password'),
        registerAlert: document.getElementById('register-alert'),
        registerAlertText: document.getElementById('register-alert-text'),
        btnShowRegister: document.getElementById('btn-show-register'),
        btnShowLogin: document.getElementById('btn-show-login'),

        loginIdentifier: document.getElementById('login-identifier'),
        loginPassword: document.getElementById('login-password'),
        btnTogglePassword: document.getElementById('btn-toggle-password'),
        togglePasswordIcon: document.getElementById('toggle-password-icon'),
        errorLoginIdentifier: document.getElementById('error-login-identifier'),
        errorLoginPassword: document.getElementById('error-login-password'),
        loginAlert: document.getElementById('login-alert'),
        loginAlertText: document.getElementById('login-alert-text'),
        btnQuickDemo: document.getElementById('btn-quick-demo'),

        // Top Navigation
        userDisplayName: document.getElementById('user-display-name'),
        btnLogout: document.getElementById('btn-logout'),

        // Alert Banners
        lowBalanceAlert: document.getElementById('low-balance-alert'),
        lowBalanceText: document.getElementById('low-balance-text'),
        overspendingAlert: document.getElementById('overspending-alert'),
        overspendingText: document.getElementById('overspending-text'),

        // Section A: Available Money
        availableMoneyForm: document.getElementById('available-money-form'),
        inputAvailableMoney: document.getElementById('input-available-money'),
        errorAvailableMoney: document.getElementById('error-available-money'),

        // Section: Minimum Balance Alert
        minBalanceForm: document.getElementById('min-balance-form'),
        inputMinBalance: document.getElementById('input-min-balance'),
        errorMinBalance: document.getElementById('error-min-balance'),
        minBalanceStatusBadge: document.getElementById('min-balance-status-badge'),
        btnToggleNotifications: document.getElementById('btn-toggle-notifications'),
        notifBtnIcon: document.getElementById('notif-btn-icon'),
        notifBtnText: document.getElementById('notif-btn-text'),

        // Section C: Financial Summary Cards
        kpiAvailableMoney: document.getElementById('kpi-available-money'),
        kpiTotalExpenses: document.getElementById('kpi-total-expenses'),
        kpiExpensesCount: document.getElementById('kpi-expenses-count'),
        kpiRemainingBalance: document.getElementById('kpi-remaining-balance'),
        kpiBalanceStatus: document.getElementById('kpi-balance-status'),
        summaryCardBalance: document.getElementById('summary-card-balance'),
        balanceIcon: document.getElementById('balance-icon'),
        balanceBadge: document.getElementById('balance-badge'),

        // Section B: Add Expense Form
        expenseForm: document.getElementById('expense-form'),
        inputName: document.getElementById('expense-name'),
        inputAmount: document.getElementById('expense-amount'),
        inputCategory: document.getElementById('expense-category'),
        inputDate: document.getElementById('expense-date'),
        errorName: document.getElementById('error-name'),
        errorAmount: document.getElementById('error-amount'),
        errorCategory: document.getElementById('error-category'),
        errorDate: document.getElementById('error-date'),

        // Section E: Spending Insights
        budgetSpentPercent: document.getElementById('budget-spent-percent'),
        budgetProgressBar: document.getElementById('budget-progress-bar'),
        budgetMeterHint: document.getElementById('budget-meter-hint'),
        chartCanvas: document.getElementById('category-chart'),
        chartEmptyState: document.getElementById('chart-empty-state'),
        categoryBreakdownList: document.getElementById('category-breakdown-list'),

        // Section D: Expense History & Filters
        filterSearch: document.getElementById('filter-search'),
        filterCategory: document.getElementById('filter-category'),
        tableBody: document.getElementById('expenses-tbody'),
        tableEmptyState: document.getElementById('table-empty-state'),
        tableNoResultsState: document.getElementById('table-no-results-state'),
        btnEmptyLoadSample: document.getElementById('btn-empty-load-sample'),
        btnResetFilters: document.getElementById('btn-reset-filters'),
        showingCount: document.getElementById('showing-count'),
        filteredTotalAmount: document.getElementById('filtered-total-amount'),

        // Clear All Modal
        btnClearAll: document.getElementById('btn-clear-all'),
        clearModal: document.getElementById('clear-modal'),
        btnModalCancel: document.getElementById('btn-modal-cancel'),
        btnModalConfirm: document.getElementById('btn-modal-confirm'),

        // Toast Container
        toastContainer: document.getElementById('toast-container'),

        // Predictor Section
        allowanceForm: document.getElementById('allowance-form'),
        inputAllowanceDate: document.getElementById('input-allowance-date'),
        inputAllowanceAmount: document.getElementById('input-allowance-amount'),
        btnSaveAllowance: document.getElementById('btn-save-allowance'),
        errorAllowanceDate: document.getElementById('error-allowance-date'),
        errorAllowanceAmount: document.getElementById('error-allowance-amount'),
        futureAllowanceBadge: document.getElementById('future-allowance-badge'),
        futureAllowanceText: document.getElementById('future-allowance-text'),
        predDaysRemaining: document.getElementById('pred-days-remaining'),
        predDaysSub: document.getElementById('pred-days-sub'),
        predDailyLimit: document.getElementById('pred-daily-limit'),
        predLimitSub: document.getElementById('pred-limit-sub'),
        predAvgSpending: document.getElementById('pred-avg-spending'),
        predAvgSub: document.getElementById('pred-avg-sub'),
        predProjectedBalance: document.getElementById('pred-projected-balance'),
        predCardProjected: document.getElementById('pred-card-projected'),
        predAdviceBox: document.getElementById('predictor-advice-box'),
        predAdviceIcon: document.getElementById('pred-advice-icon'),
        predAdviceTitle: document.getElementById('pred-advice-title'),
        predAdviceMessage: document.getElementById('pred-advice-message'),
        predAdviceSubtext: document.getElementById('pred-advice-subtext'),

        // StudentSpend AI Coach & Suggestions
        aiCoachSection: document.getElementById('ai-coach-section'),
        aiEngineBadge: document.getElementById('ai-engine-badge'),
        aiEngineBadgeText: document.getElementById('ai-engine-badge-text'),
        btnRefreshAiInsights: document.getElementById('btn-refresh-ai-insights'),
        aiPacingBanner: document.getElementById('ai-pacing-banner'),
        aiBannerIcon: document.getElementById('ai-banner-icon'),
        aiBannerTitle: document.getElementById('ai-banner-title'),
        aiPacingStatusBadge: document.getElementById('ai-pacing-status-badge'),
        aiCoachMessage: document.getElementById('ai-coach-message'),
        aiSuggestionsGrid: document.getElementById('ai-suggestions-grid'),
        aiTopCategoryNote: document.getElementById('ai-top-category-note'),

        // StudentSpend AI Chat Assistant
        aiChatSection: document.getElementById('ai-chat-section'),
        aiChatMessages: document.getElementById('ai-chat-messages'),
        aiTypingIndicator: document.getElementById('ai-typing-indicator'),
        aiChatForm: document.getElementById('ai-chat-form'),
        aiChatInput: document.getElementById('ai-chat-input'),
        btnChatSend: document.getElementById('btn-chat-send')
    };

    /**
     * Formats amounts in Indian Rupees (₹)
     * Handles negative amounts cleanly (e.g. -₹500.00)
     * @param {number} amount 
     * @returns {string}
     */
    function formatCurrency(amount) {
        const val = Number(amount) || 0;
        const isNegative = val < 0;
        const absVal = Math.abs(val);

        const formattedNum = absVal.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        return isNegative ? `-${state.currency}${formattedNum}` : `${state.currency}${formattedNum}`;
    }

    /**
     * Displays temporary toast notification
     * @param {string} message 
     * @param {'info'|'success'|'warning'|'danger'} type 
     */
    function showToast(message, type = 'info') {
        if (!elements.toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let icon = 'ℹ️';
        if (type === 'success') icon = '✅';
        if (type === 'warning') icon = '⚠️';
        if (type === 'danger') icon = '🚨';

        toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
        elements.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => toast.remove(), 250);
        }, 3600);
    }

    /**
     * Sends Browser Desktop Notification if enabled and permitted
     * @param {string} title 
     * @param {Object} options 
     */
    function sendBrowserNotification(title, options = {}) {
        if (!state.notificationsEnabled) return;
        if (!('Notification' in window)) return;

        if (Notification.permission === 'granted') {
            try {
                new Notification(title, {
                    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⚠️</text></svg>',
                    ...options
                });
            } catch (err) {
                console.warn('Browser notification failed:', err);
            }
        }
    }

    /**
     * Updates notification button UI according to state & permission
     */
    function updateNotificationButtonUI() {
        if (!('Notification' in window)) {
            elements.notifBtnIcon.textContent = '🔕';
            elements.notifBtnText.textContent = 'Not Supported';
            elements.btnToggleNotifications.disabled = true;
            elements.btnToggleNotifications.title = 'Desktop notifications are not supported in this browser.';
            return;
        }

        if (state.notificationsEnabled && Notification.permission === 'granted') {
            elements.btnToggleNotifications.classList.add('active');
            elements.notifBtnIcon.textContent = '✅';
            elements.notifBtnText.textContent = 'Alerts Active';
            elements.btnToggleNotifications.title = 'Browser notifications are active. Click to disable.';
        } else {
            elements.btnToggleNotifications.classList.remove('active');
            elements.notifBtnIcon.textContent = '🔔';
            elements.notifBtnText.textContent = 'Enable Alerts';
            elements.btnToggleNotifications.title = 'Click to enable browser notifications for low balance alerts.';
        }
    }

    /**
     * Handles Toggling Desktop Notifications
     */
    function handleToggleNotifications() {
        if (!('Notification' in window)) {
            showToast('Desktop notifications are not supported by your browser. In-app alerts remain active.', 'info');
            return;
        }

        // If currently enabled, turn off
        if (state.notificationsEnabled) {
            state.notificationsEnabled = false;
            saveSettings();
            updateNotificationButtonUI();
            showToast('Browser notifications disabled. In-app alerts will continue to work.', 'info');
            return;
        }

        // If permission already granted
        if (Notification.permission === 'granted') {
            state.notificationsEnabled = true;
            saveSettings();
            updateNotificationButtonUI();
            sendBrowserNotification('Student Expense Tracker', {
                body: 'Desktop notifications are now enabled! You will be alerted when funds reach your minimum balance.'
            });
            showToast('Browser desktop notifications enabled!', 'success');
            return;
        }

        // If permission is denied
        if (Notification.permission === 'denied') {
            showToast('Notifications are blocked in your browser settings. Please allow notifications for this site to enable desktop alerts.', 'warning');
            return;
        }

        // Request permission from student
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                state.notificationsEnabled = true;
                saveSettings();
                updateNotificationButtonUI();
                sendBrowserNotification('Student Expense Tracker', {
                    body: 'Desktop notifications enabled! You will be alerted when funds drop to your minimum balance.'
                });
                showToast('Browser notifications enabled successfully!', 'success');
            } else {
                state.notificationsEnabled = false;
                saveSettings();
                updateNotificationButtonUI();
                showToast('Notification permission was not granted. In-app alerts will be displayed instead.', 'info');
            }
        });
    }

    /**
     * Loads state from localStorage
     */
    function loadState() {
        try {
            // User session
            const storedUser = localStorage.getItem(STORAGE_KEY_USER);
            if (storedUser) {
                state.currentUser = JSON.parse(storedUser);
            }

            // Available money
            const storedAvailable = localStorage.getItem(STORAGE_KEY_AVAILABLE);
            if (storedAvailable !== null) {
                const parsed = Number(storedAvailable);
                state.availableMoney = !isNaN(parsed) && parsed >= 0 ? parsed : 5000;
            } else {
                state.availableMoney = 5000;
            }

            // Minimum balance
            const storedMin = localStorage.getItem(STORAGE_KEY_MIN_BALANCE);
            if (storedMin !== null) {
                const parsedMin = Number(storedMin);
                state.minBalance = !isNaN(parsedMin) && parsedMin >= 0 ? parsedMin : 0;
            } else {
                state.minBalance = 0;
            }

            // Notification preference
            const storedNotif = localStorage.getItem(STORAGE_KEY_NOTIF);
            if (storedNotif !== null) {
                state.notificationsEnabled = storedNotif === 'true';
            }

            // Allowance settings
            state.allowanceDate = localStorage.getItem(STORAGE_KEY_ALLOWANCE_DATE) || null;
            const storedAllowanceAmt = localStorage.getItem(STORAGE_KEY_ALLOWANCE_AMOUNT);
            state.expectedAllowance = storedAllowanceAmt ? (Number(storedAllowanceAmt) || 0) : 0;

            // Expenses
            // Expenses are loaded from PostgreSQL after session verification
            state.expenses = [];
        } catch (e) {
            console.error('Failed to load state from localStorage:', e);
            state.availableMoney = 5000;
            state.minBalance = 0;
            state.allowanceDate = null;
            state.expectedAllowance = 0;
            state.expenses = Tracker.getSampleExpenses();
        }
    }
    



// Paste the new function here
async function loadExpensesFromServer() {
    try {
        const response = await fetch('/api/expenses');

        if (!response.ok) {
            throw new Error('Unable to load expenses.');
        }

        const result = await response.json();

        state.expenses = result.expenses.map((expense) => ({
            id: String(expense.id),
            name: expense.title,
            amount: Number(expense.amount),
            category: expense.category,
            date: String(expense.expense_date).slice(0, 10)
        }));

        renderFinancialSummary();
        renderSpendingInsights();
        renderTable();
        renderAllowancePredictor();
        loadAiInsights();

    } catch (error) {
        console.error('Error loading expenses:', error);
        showToast('Unable to load your expenses from the server.', 'error');
    }
}


// Your next existing function remains here


    /**
     * Saves settings (available money, min balance, notifications, allowance)
     */
    function saveSettings() {
        try {
            localStorage.setItem(STORAGE_KEY_AVAILABLE, state.availableMoney.toString());
            localStorage.setItem(STORAGE_KEY_MIN_BALANCE, state.minBalance.toString());
            localStorage.setItem(STORAGE_KEY_NOTIF, state.notificationsEnabled.toString());
            if (state.allowanceDate) {
                localStorage.setItem(STORAGE_KEY_ALLOWANCE_DATE, state.allowanceDate);
            }
            if (state.expectedAllowance > 0) {
                localStorage.setItem(STORAGE_KEY_ALLOWANCE_AMOUNT, state.expectedAllowance.toString());
            }
        } catch (e) {
            console.error('Failed to save settings:', e);
        }
    }

    /**
     * Saves expenses to localStorage
     */
    function saveExpenses() {
        try {
            localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(state.expenses));
        } catch (e) {
            console.error('Failed to save expenses:', e);
        }
    }

    /**
     * Saves user session to localStorage
     */
    function saveUserSession() {
        try {
            if (state.currentUser) {
                localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(state.currentUser));
            } else {
                localStorage.removeItem(STORAGE_KEY_USER);
            }
        } catch (e) {
            console.error('Failed to save user session:', e);
        }
    }

    /**
     * View Switching: Login vs Dashboard
     */
    function showLoginView() {
        elements.loginForm.classList.remove('hidden');
    elements.registerForm.classList.add('hidden');
        elements.loginView.classList.remove('hidden');
        elements.dashboardView.classList.add('hidden');
        elements.loginAlert.classList.add('hidden');
        elements.loginIdentifier.value = '';
        elements.loginPassword.value = '';
        clearLoginErrors();
    }

    function showDashboardView() {
        elements.loginView.classList.add('hidden');
        elements.dashboardView.classList.remove('hidden');

        if (state.currentUser) {
    elements.userDisplayName.textContent =
        state.currentUser.name || state.currentUser.identifier;
}

        elements.inputAvailableMoney.value = state.availableMoney;
        elements.inputMinBalance.value = state.minBalance > 0 ? state.minBalance : '';

        updateNotificationButtonUI();
        renderDashboard();
    }

    /**
     * Clears login form error messages
     */
    function clearLoginErrors() {
        elements.loginIdentifier.classList.remove('has-error');
        elements.loginPassword.classList.remove('has-error');
        elements.errorLoginIdentifier.textContent = '';
        elements.errorLoginPassword.textContent = '';
        elements.loginAlert.classList.add('hidden');
    }

   
     
    // Switch between Login and Registration forms

    function showRegisterForm() {
        elements.loginForm.classList.add('hidden');
        elements.registerForm.classList.remove('hidden');
        elements.registerAlert.classList.add('hidden');
        elements.registerForm.reset();
    }

    function showSignInForm() {
        elements.registerForm.classList.add('hidden');
        elements.loginForm.classList.remove('hidden');
        elements.loginAlert.classList.add('hidden');
        elements.registerAlert.classList.add('hidden');
    }

    // Register a new account using the backend API
    async function handleRegisterSubmit(e) {
        e.preventDefault();

        elements.registerAlert.classList.add('hidden');

        const name = elements.registerName.value.trim();
        const email = elements.registerEmail.value.trim();
        const password = elements.registerPassword.value;
        const confirmPassword = elements.registerConfirmPassword.value;

        if (!name || !email || !password) {
            elements.registerAlertText.textContent =
                'Please fill in all the fields.';
            elements.registerAlert.classList.remove('hidden');
            return;
        }

        if (password.length < 8) {
            elements.registerAlertText.textContent =
                'Password must contain at least 8 characters.';
            elements.registerAlert.classList.remove('hidden');
            return;
        }

        if (password !== confirmPassword) {
            elements.registerAlertText.textContent =
                'Passwords do not match.';
            elements.registerAlert.classList.remove('hidden');
            return;
        }

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Registration failed.');
            }

            showToast('Account created successfully! Please sign in.', 'success');
            showSignInForm();
            elements.loginIdentifier.value = email;
            elements.loginPassword.value = '';
        } catch (error) {
            elements.registerAlertText.textContent =
                error.message || 'Unable to register. Please try again.';
            elements.registerAlert.classList.remove('hidden');
        }
    }

    // Sign in using the backend API
    async function handleLoginSubmit(e) {
        e.preventDefault();
        clearLoginErrors();

        const email = elements.loginIdentifier.value.trim();
        const password = elements.loginPassword.value;

        if (!email || !password) {
            elements.loginAlertText.textContent =
                'Please enter your email and password.';
            elements.loginAlert.classList.remove('hidden');
            return;
        }

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Login failed.');
            }

            
state.currentUser = result.user;
saveUserSession();

state.wasBelowThreshold = false;

await loadExpensesFromServer();

showDashboardView();
showToast(`Welcome, ${result.user.name}!`, 'success');

        } catch (error) {
            elements.loginAlertText.textContent =
                error.message || 'Unable to sign in. Please try again.';
            elements.loginAlert.classList.remove('hidden');
        }
    }

    /**
     * Handles Quick Demo Fill
     */
    function handleQuickDemoFill() {
        clearLoginErrors();
        elements.loginIdentifier.value = 'student@college.edu';
        elements.loginPassword.value = 'college123';
        elements.loginIdentifier.focus();
    }

    
    /**
     * Handles Logout
     */
    async function handleLogout() {
        try {
            await fetch('/api/logout', {
                method: 'POST'
            });
        } catch (error) {
            console.error('Logout request failed:', error);
        }

        state.currentUser = null;
        saveUserSession();
        showLoginView();
        showToast('Logged out successfully.', 'info');
    }


    /**
     * Toggles Password Visibility
     */
    function handleTogglePassword() {
        const isPassword = elements.loginPassword.type === 'password';
        elements.loginPassword.type = isPassword ? 'text' : 'password';
        elements.togglePasswordIcon.textContent = isPassword ? '🙈' : '👁️';
        elements.btnTogglePassword.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    }

    /**
     * Handles Available Money Update
     * @param {Event} e 
     */
    function handleAvailableMoneySubmit(e) {
        e.preventDefault();
        elements.errorAvailableMoney.textContent = '';
        elements.inputAvailableMoney.classList.remove('has-error');

        const rawValue = elements.inputAvailableMoney.value;
        const validation = Tracker.validateAvailableMoney(rawValue);

        if (!validation.isValid) {
            elements.inputAvailableMoney.classList.add('has-error');
            elements.errorAvailableMoney.textContent = validation.error;
            return;
        }

        state.availableMoney = validation.value;
        saveSettings();
        renderFinancialSummary();
        renderSpendingInsights();
        renderAllowancePredictor();
        loadAiInsights();
        showToast(`Available money updated to ${formatCurrency(state.availableMoney)}`, 'success');
    }

    /**
     * Handles Minimum Balance Alert Update
     * @param {Event} e 
     */
    function handleMinBalanceSubmit(e) {
        e.preventDefault();
        elements.errorMinBalance.textContent = '';
        elements.inputMinBalance.classList.remove('has-error');

        const rawValue = elements.inputMinBalance.value;
        const validation = Tracker.validateMinimumBalance(rawValue);

        if (!validation.isValid) {
            elements.inputMinBalance.classList.add('has-error');
            elements.errorMinBalance.textContent = validation.error;
            return;
        }

        state.minBalance = validation.value;
        saveSettings();
        renderFinancialSummary();
        renderAllowancePredictor();
        loadAiInsights();

        if (state.minBalance > 0) {
            showToast(`Minimum balance alert limit set to ${formatCurrency(state.minBalance)}`, 'success');
        } else {
            showToast('Minimum balance limit cleared.', 'info');
        }
    }

    /**
     * Renders Section C: Financial Summary Cards, Low Balance Alert & Overspending Alert
     */
    function renderFinancialSummary() {
        const summary = Tracker.calculateFinancialSummary({
            availableMoney: state.availableMoney,
            expenses: state.expenses,
            minBalance: state.minBalance
        });

        // 1. Total Available Money
        elements.kpiAvailableMoney.textContent = formatCurrency(summary.totalAvailable);

        // 2. Total Expenses
        elements.kpiTotalExpenses.textContent = formatCurrency(summary.totalExpenses);
        elements.kpiExpensesCount.textContent = `${state.expenses.length} recorded items`;

        // 3. Remaining Balance
        elements.kpiRemainingBalance.textContent = formatCurrency(summary.remainingBalance);

        // Update Minimum Balance Badge
        if (summary.hasMinBalanceSet) {
            elements.minBalanceStatusBadge.textContent = `Limit: ${formatCurrency(summary.minBalance)}`;
            elements.minBalanceStatusBadge.classList.add('badge-buffer');
        } else {
            elements.minBalanceStatusBadge.textContent = 'Limit: Not Set';
        }

        // Reset classes on summary card
        elements.summaryCardBalance.classList.remove('status-positive', 'status-warning', 'status-negative');

        // Check Alert Conditions
        if (summary.isOverspent) {
            // STATE 1: OVERSPENT (Remaining Balance < 0)
            elements.summaryCardBalance.classList.add('status-negative');
            elements.balanceIcon.textContent = '🚨';
            elements.balanceBadge.textContent = '🚨 Over Budget';
            elements.kpiBalanceStatus.textContent = `Over budget by ${formatCurrency(summary.overspentAmount)}`;

            // Show Overspending Banner & Hide Low Balance Banner
            elements.overspendingAlert.classList.remove('hidden');
            elements.lowBalanceAlert.classList.add('hidden');
            elements.overspendingText.textContent = `Your total expenses (${formatCurrency(summary.totalExpenses)}) exceed your available money (${formatCurrency(summary.totalAvailable)}) by ${formatCurrency(summary.overspentAmount)}. Consider pausing non-essential purchases.`;

            // State transition notification: trigger if transitioning into breached threshold
            if (!state.wasBelowThreshold) {
                state.wasBelowThreshold = true;
                const msg = `Budget Warning! You are over budget by ${formatCurrency(summary.overspentAmount)}.`;
                showToast(msg, 'danger');
                sendBrowserNotification('Student Expense Tracker: Budget Warning!', { body: msg });
            }

        } else if (summary.isLowBalance) {
            // STATE 2: LOW BALANCE (Remaining Balance <= Min Balance and >= 0)
            elements.summaryCardBalance.classList.add('status-warning');
            elements.balanceIcon.textContent = '⚠️';
            elements.balanceBadge.textContent = '⚠️ Low Balance';
            elements.kpiBalanceStatus.textContent = `${formatCurrency(summary.lowBalanceDeficit)} below minimum limit`;

            // Show Low Balance Banner & Hide Overspending Banner
            elements.lowBalanceAlert.classList.remove('hidden');
            elements.overspendingAlert.classList.add('hidden');
            elements.lowBalanceText.textContent = `Low Balance Alert! Your remaining balance is ${formatCurrency(summary.remainingBalance)}, which is below your minimum balance of ${formatCurrency(summary.minBalance)}.`;

            // State transition notification: trigger only when first entering the low-balance zone
            if (!state.wasBelowThreshold) {
                state.wasBelowThreshold = true;
                const msg = `Low Balance Alert! Your remaining balance is ${formatCurrency(summary.remainingBalance)}, which is below your minimum balance of ${formatCurrency(summary.minBalance)}.`;
                showToast(msg, 'warning');
                sendBrowserNotification('Student Expense Tracker: Low Balance Alert!', { body: msg });
            }

        } else {
            // STATE 3: HEALTHY / SAFE BALANCE (Remaining Balance > Min Balance)
            elements.summaryCardBalance.classList.add('status-positive');
            elements.balanceIcon.textContent = '⚖️';
            elements.balanceBadge.textContent = summary.hasMinBalanceSet ? '✅ Healthy Balance' : 'Safe Balance';
            elements.kpiBalanceStatus.textContent = summary.remainingBalance === 0 ? 'Budget fully utilized' : 'Safe balance available';

            // Hide both alert banners
            elements.lowBalanceAlert.classList.add('hidden');
            elements.overspendingAlert.classList.add('hidden');

            // Reset transition tracker when balance rises back above the limit!
            state.wasBelowThreshold = false;
        }
    }

    /**
     * Renders Section E: Spending Insights (Budget Meter & Donut Chart)
     */
    function renderSpendingInsights() {
        const summary = Tracker.calculateFinancialSummary({
            availableMoney: state.availableMoney,
            expenses: state.expenses,
            minBalance: state.minBalance
        });

        const catSummary = Tracker.calculateCategorySummary(state.expenses);

        // Budget Meter
        elements.budgetSpentPercent.textContent = `${summary.percentSpent}%`;
        const barWidth = Math.min(100, summary.percentSpent);
        elements.budgetProgressBar.style.width = `${barWidth}%`;

        if (summary.totalAvailable <= 0) {
            elements.budgetMeterHint.textContent = 'Set your available money above to track budget consumption.';
            elements.budgetProgressBar.style.backgroundColor = 'var(--primary)';
        } else if (summary.isOverspent) {
            elements.budgetMeterHint.textContent = `Budget exceeded! You have spent ${summary.percentSpent}% of available money.`;
            elements.budgetProgressBar.style.backgroundColor = 'var(--danger)';
        } else if (summary.isLowBalance) {
            elements.budgetMeterHint.textContent = `Caution: Remaining funds (${formatCurrency(summary.remainingBalance)}) have breached your minimum buffer (${formatCurrency(summary.minBalance)}).`;
            elements.budgetProgressBar.style.backgroundColor = 'var(--warning)';
        } else {
            elements.budgetMeterHint.textContent = `${summary.percentSpent}% of your ${formatCurrency(summary.totalAvailable)} budget has been spent.`;
            elements.budgetProgressBar.style.backgroundColor = 'var(--primary)';
        }

        renderDonutChart(catSummary);
        renderCategoryBreakdown(catSummary);
    }

    /**
     * Renders Category Breakdown Progress Bars
     * @param {Array} catSummary 
     */
    function renderCategoryBreakdown(catSummary) {
        elements.categoryBreakdownList.innerHTML = '';
        const activeCategories = catSummary.filter(c => c.total > 0);

        if (activeCategories.length === 0) {
            elements.categoryBreakdownList.innerHTML = `
                <p style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 1rem 0;">
                    No categorized spending yet. Add an expense to see your budget distribution.
                </p>
            `;
            return;
        }

        activeCategories.forEach(cat => {
            const itemEl = document.createElement('div');
            itemEl.className = 'cat-breakdown-item';
            itemEl.innerHTML = `
                <div class="cat-breakdown-header">
                    <span class="cat-breakdown-label">
                        <span>${cat.icon}</span>
                        <span>${cat.name}</span>
                    </span>
                    <span class="cat-breakdown-stats">
                        ${formatCurrency(cat.total)}
                        <span class="cat-breakdown-pct">(${cat.percentage}%)</span>
                    </span>
                </div>
                <div class="cat-progress-bg">
                    <div class="cat-progress-bar" style="width: ${cat.percentage}%; background-color: ${cat.color};"></div>
                </div>
            `;
            elements.categoryBreakdownList.appendChild(itemEl);
        });
    }

    /**
     * Draws High-DPI Canvas Donut Chart
     * @param {Array} catSummary 
     */
    function renderDonutChart(catSummary) {
        const canvas = elements.chartCanvas;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const activeCategories = catSummary.filter(c => c.total > 0);

        if (activeCategories.length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            elements.chartEmptyState.classList.add('active');
            return;
        }

        elements.chartEmptyState.classList.remove('active');

        const dpr = window.devicePixelRatio || 1;
        const width = 280;
        const height = 280;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

        ctx.resetTransform?.();
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height / 2;
        const outerRadius = 110;
        const innerRadius = 72;

        let startAngle = -Math.PI / 2;
        const total = Tracker.calculateTotal(state.expenses);

        activeCategories.forEach(cat => {
            const sliceAngle = (cat.total / total) * (2 * Math.PI);
            const endAngle = startAngle + sliceAngle;

            ctx.beginPath();
            ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
            ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
            ctx.closePath();

            ctx.fillStyle = cat.color;
            ctx.fill();

            ctx.lineWidth = 2;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            startAngle = endAngle;
        });

        // Center Text
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillStyle = '#64748b';
        ctx.font = '700 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.fillText('TOTAL EXPENSES', centerX, centerY - 14);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.fillText(formatCurrency(total), centerX, centerY + 12);
    }

    /**
     * Clears Expense Form Errors
     */
    function clearExpenseFormErrors() {
        ['Name', 'Amount', 'Category', 'Date'].forEach(field => {
            const inputEl = elements[`input${field}`];
            const errorEl = elements[`error${field}`];
            if (inputEl) inputEl.classList.remove('has-error');
            if (errorEl) errorEl.textContent = '';
        });
    }

    /**
     * Displays Expense Form Errors
     * @param {Object} errors 
     */
    function displayExpenseFormErrors(errors) {
        clearExpenseFormErrors();

        if (errors.name) {
            elements.inputName.classList.add('has-error');
            elements.errorName.textContent = errors.name;
        }
        if (errors.amount) {
            elements.inputAmount.classList.add('has-error');
            elements.errorAmount.textContent = errors.amount;
        }
        if (errors.category) {
            elements.inputCategory.classList.add('has-error');
            elements.errorCategory.textContent = errors.category;
        }
        if (errors.date) {
            elements.inputDate.classList.add('has-error');
            elements.errorDate.textContent = errors.date;
        }
    }

    
/**
 * Handles Add Expense Form Submit
 * @param {Event} e
 */
async function handleExpenseFormSubmit(e) {
    e.preventDefault();

    const inputData = {
        name: elements.inputName.value,
        amount: elements.inputAmount.value,
        category: elements.inputCategory.value,
        date: elements.inputDate.value
    };

    // Validate expense using the existing validation function
    const validation = Tracker.validateExpense(inputData);

    if (!validation.isValid) {
        displayExpenseFormErrors(validation.errors);
        return;
    }

    clearExpenseFormErrors();

    try {
        // Send expense to the backend
        const response = await fetch('/api/expenses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: inputData.name,
                amount: Number(inputData.amount),
                category: inputData.category,
                expense_date: inputData.date
            })
        });

        const result = await response.json();

        if (!response.ok) {
            showToast(
                result.message || 'Unable to save expense.',
                'error'
            );
            return;
        }

        // Convert the database expense to the format used by the dashboard
        const savedExpense = {
            id: String(result.expense.id),
            name: result.expense.title,
            amount: Number(result.expense.amount),
            category: result.expense.category,
            date: String(result.expense.expense_date).slice(0, 10)
        };

        // Update the existing dashboard
        state.expenses.unshift(savedExpense);

        renderFinancialSummary();
        renderSpendingInsights();
        renderTable();
        renderAllowancePredictor();
        loadAiInsights();

        // Clear the form
        elements.inputName.value = '';
        elements.inputAmount.value = '';
        elements.inputCategory.value = '';
        elements.inputName.focus();

        showToast(
            `Added "${savedExpense.name}" (${formatCurrency(savedExpense.amount)})`,
            'success'
        );

    } catch (error) {
        console.error('Error saving expense:', error);

        showToast(
            'Unable to connect to the server. Please try again.',
            'error'
        );
    }
}

/**
 * Handles Expense Deletion
 * @param {string} id
 */
async function handleDeleteExpense(id) {
    const item = state.expenses.find(exp => exp.id === id);
    if (!item) return;

    try {
        const response = await fetch(`/api/expenses/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (!response.ok) {
            showToast(result.message || 'Unable to delete expense.', 'error');
            return;
        }

        state.expenses = state.expenses.filter(exp => exp.id !== id);

        renderFinancialSummary();
        renderSpendingInsights();
        renderTable();
        renderAllowancePredictor();
        loadAiInsights();

        showToast(`Deleted "${item.name}"`, 'success');
    } catch (error) {
        console.error('Error deleting expense:', error);
        showToast('Unable to connect to the server. Please try again.', 'error');
    }
}


    
/**
 * Handles Clearing All Expenses
 */ 
async function handleClearAllExpenses() {
    if (state.expenses.length === 0) {
        closeClearModal();
        showToast('There are no expenses to clear.', 'info');
        return;
    }

    try {
        const response = await fetch('/api/expenses', {
            method: 'DELETE'
        });

        const result = await response.json();

        if (!response.ok) {
            showToast(
                result.message || 'Unable to clear expenses.',
                'danger'
            );
            return;
        }

        state.expenses = [];

        renderFinancialSummary();
        renderSpendingInsights();
        renderTable();
        renderAllowancePredictor();
        loadAiInsights();
        closeClearModal();

        showToast('All expenses cleared.', 'success');
    } catch (error) {
        console.error('Error clearing expenses:', error);
        showToast(
            'Unable to connect to the server. Please try again.',
            'danger'
        );
    }
}


    
/**
 * Loads Demo Student Expenses
 */
async function handleLoadSampleData() {
    if (state.expenses.length > 0) {
        showToast(
            'Clear existing expenses before loading demo data.',
            'info'
        );
        return;
    }

    const sampleExpenses = Tracker.getSampleExpenses();

    try {
        for (const expense of sampleExpenses) {
            const response = await fetch('/api/expenses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: expense.name,
                    amount: Number(expense.amount),
                    category: expense.category,
                    expense_date: expense.date
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || 'Unable to save demo expenses.'
                );
            }
        }

        await loadExpensesFromServer();
        showToast('Loaded demo student expenses!', 'success');

    } catch (error) {
        console.error('Error loading demo expenses:', error);
        await loadExpensesFromServer();

        showToast(
            error.message || 'Unable to load demo expenses.',
            'error'
        );
    }
}


    /**
     * Escapes HTML to prevent XSS
     * @param {string} str 
     * @returns {string}
     */
    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag));
    }

    /**
     * Renders Expense Table
     */
    function renderTable() {
        const filtered = Tracker.filterExpenses(state.expenses, {
            query: state.filterQuery,
            category: state.filterCategory
        });

        elements.tableBody.innerHTML = '';
        const hasExpenses = state.expenses.length > 0;
        const hasMatches = filtered.length > 0;

        if (!hasExpenses) {
            elements.tableEmptyState.classList.remove('hidden');
            elements.tableNoResultsState.classList.add('hidden');
        } else if (!hasMatches) {
            elements.tableEmptyState.classList.add('hidden');
            elements.tableNoResultsState.classList.remove('hidden');
        } else {
            elements.tableEmptyState.classList.add('hidden');
            elements.tableNoResultsState.classList.add('hidden');
        }

        filtered.forEach(item => {
            const catInfo = Tracker.CATEGORIES[item.category] || Tracker.CATEGORIES.other;
            const tr = document.createElement('tr');
            tr.dataset.id = item.id;

            let displayDate = item.date || '';
            try {
                const dateObj = new Date(item.date + 'T00:00:00');
                if (!isNaN(dateObj)) {
                    displayDate = dateObj.toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    });
                }
            } catch (e) {
                // Keep raw date
            }

            tr.innerHTML = `
                <td class="td-expense-name">${escapeHTML(item.name)}</td>
                <td class="td-category">
                    <span class="category-badge" style="background-color: ${catInfo.color}18; color: ${catInfo.color}; border: 1.5px solid ${catInfo.color}40;">
                        <span>${catInfo.icon}</span> ${catInfo.name}
                    </span>
                </td>
                <td class="td-date">${displayDate}</td>
                <td class="td-amount text-right">${formatCurrency(item.amount)}</td>
                <td class="td-action text-center">
                    <button class="btn-delete" data-id="${item.id}" title="Delete expense" aria-label="Delete ${escapeHTML(item.name)}">
                        🗑️
                    </button>
                </td>
            `;

            elements.tableBody.appendChild(tr);
        });

        elements.showingCount.textContent = `Showing ${filtered.length} of ${state.expenses.length} expenses`;
        const filteredTotal = Tracker.calculateTotal(filtered);
        elements.filteredTotalAmount.textContent = formatCurrency(filteredTotal);
    }

    /**
     * Complete Dashboard Re-render
     */
    function renderDashboard() {
        renderFinancialSummary();
        renderSpendingInsights();
        renderTable();
        renderAllowancePredictor();
        loadAiInsights();
    }

    /**
     * Modal Dialog Handlers
     */
    function openClearModal() {
        if (state.expenses.length === 0) {
            showToast('There are no expenses to clear.', 'info');
            return;
        }
        elements.clearModal.classList.remove('hidden');
    }

    function closeClearModal() {
        elements.clearModal.classList.add('hidden');
    }

    /**
     * =========================================================================
     * ALLOWANCE SURVIVAL PREDICTOR & STUDENTSPEND AI CONTROLLER
     * =========================================================================
     */

    /**
     * Renders Section: Smart Allowance Survival Predictor
     */
    function renderAllowancePredictor() {
        if (!elements.predDaysRemaining) return;

        if (state.allowanceDate && elements.inputAllowanceDate) {
            elements.inputAllowanceDate.value = state.allowanceDate;
        }
        if (state.expectedAllowance > 0 && elements.inputAllowanceAmount) {
            elements.inputAllowanceAmount.value = state.expectedAllowance;
        }

        const summary = Tracker.calculateFinancialSummary({
            availableMoney: state.availableMoney,
            expenses: state.expenses,
            minBalance: state.minBalance
        });

        const prediction = Tracker.calculateAllowanceSurvival({
            remainingBalance: summary.remainingBalance,
            minBalance: state.minBalance,
            allowanceDate: state.allowanceDate,
            expectedAllowance: state.expectedAllowance,
            expenses: state.expenses
        });

        // 1. Days Remaining
        if (prediction.daysRemaining !== null) {
            elements.predDaysRemaining.textContent = `${prediction.daysRemaining} Day${prediction.daysRemaining === 1 ? '' : 's'}`;
            elements.predDaysSub.textContent = prediction.daysRemaining === 0 ? 'Today is allowance day!' : 'Until next allowance deposit';
            if (elements.futureAllowanceText) {
                elements.futureAllowanceText.textContent = `Next Deposit: ${formatCurrency(prediction.safeExpectedAllowance)} on ${prediction.formattedAllowanceDate || state.allowanceDate}`;
            }
        } else {
            elements.predDaysRemaining.textContent = '--';
            elements.predDaysSub.textContent = 'Set allowance date above';
            if (elements.futureAllowanceText) {
                elements.futureAllowanceText.textContent = 'No Upcoming Allowance Scheduled';
            }
        }

        // 2. Recommended Daily Spending Limit
        elements.predDailyLimit.textContent = formatCurrency(prediction.recommendedDailySpendingLimit);
        elements.predLimitSub.textContent = prediction.daysRemaining > 0 ? `For next ${prediction.daysRemaining} days` : 'Spendable buffer pool';

        // 3. Recent Average Daily Spending
        if (prediction.hasSufficientData) {
            elements.predAvgSpending.textContent = formatCurrency(prediction.averageDailySpending);
            elements.predAvgSub.textContent = `Across past ${prediction.daysSpan} day${prediction.daysSpan === 1 ? '' : 's'}`;
        } else if (prediction.averageDailySpending > 0) {
            elements.predAvgSpending.textContent = formatCurrency(prediction.averageDailySpending);
            elements.predAvgSub.textContent = 'Based on logged records';
        } else {
            elements.predAvgSpending.textContent = '--';
            elements.predAvgSub.textContent = 'No expenses logged yet';
        }

        // 4. Projected Balance Before Next Allowance
        if (prediction.hasPrediction) {
            elements.predProjectedBalance.textContent = formatCurrency(prediction.projectedBalance);
        } else {
            elements.predProjectedBalance.textContent = '--';
        }

        // 5. Dynamic Smart Advice Banner
        if (elements.predAdviceBox) {
            elements.predAdviceBox.className = `predictor-advice-card status-${prediction.status}`;
            if (elements.predAdviceIcon) {
                elements.predAdviceIcon.textContent = prediction.status === 'danger' ? '🚨' : (prediction.status === 'warning' ? '⚠️' : (prediction.status === 'success' ? '✅' : '💡'));
            }
            if (elements.predAdviceTitle) {
                elements.predAdviceTitle.textContent = prediction.headline;
            }
            if (elements.predAdviceMessage) {
                elements.predAdviceMessage.textContent = prediction.message;
            }
            if (elements.predAdviceSubtext) {
                elements.predAdviceSubtext.textContent = prediction.details;
            }
        }
    }

    /**
     * Handles Allowance Form Submission
     * @param {Event} e
     */
    function handleAllowanceFormSubmit(e) {
        if (e && e.preventDefault) e.preventDefault();

        if (elements.errorAllowanceDate) elements.errorAllowanceDate.textContent = '';
        if (elements.errorAllowanceAmount) elements.errorAllowanceAmount.textContent = '';
        if (elements.inputAllowanceDate) elements.inputAllowanceDate.classList.remove('has-error');
        if (elements.inputAllowanceAmount) elements.inputAllowanceAmount.classList.remove('has-error');

        const inputData = {
            date: elements.inputAllowanceDate ? elements.inputAllowanceDate.value : '',
            amount: elements.inputAllowanceAmount ? elements.inputAllowanceAmount.value : ''
        };

        const validation = Tracker.validateAllowancePlan(inputData);
        if (!validation.isValid) {
            if (validation.errors.date && elements.errorAllowanceDate) {
                elements.errorAllowanceDate.textContent = validation.errors.date;
                if (elements.inputAllowanceDate) elements.inputAllowanceDate.classList.add('has-error');
            }
            if (validation.errors.amount && elements.errorAllowanceAmount) {
                elements.errorAllowanceAmount.textContent = validation.errors.amount;
                if (elements.inputAllowanceAmount) elements.inputAllowanceAmount.classList.add('has-error');
            }
            return;
        }

        state.allowanceDate = validation.values.date;
        state.expectedAllowance = validation.values.amount;
        saveSettings();

        renderAllowancePredictor();
        loadAiInsights();
        showToast(`Allowance plan saved: ${formatCurrency(state.expectedAllowance)} on ${state.allowanceDate}`, 'success');
    }

    /**
     * Fetches personalized AI coach diagnosis, pacing alert, and saving suggestions from backend
     */
    let isAiInsightsLoading = false;
    async function loadAiInsights() {
        if (!elements.aiCoachSection || isAiInsightsLoading) return;
        isAiInsightsLoading = true;

        try {
            const payload = {
                availableMoney: state.availableMoney,
                minBalance: state.minBalance,
                allowanceDate: state.allowanceDate,
                expectedAllowance: state.expectedAllowance
            };

            const res = await fetch('/api/ai/insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                if (res.status === 401) return; // Session expired
                throw new Error(`Server returned ${res.status}`);
            }

            const data = await res.json();

            // 1. Update Engine Status Badge
            if (elements.aiEngineBadge && elements.aiEngineBadgeText) {
                elements.aiEngineBadgeText.textContent = data.label || (data.isFallback ? 'Rule-Based Financial Engine' : 'AI Connected');
                elements.aiEngineBadge.className = `badge-ai-mode ${data.isFallback ? 'badge-ai-fallback' : 'badge-ai-connected'}`;
            }

            // 2. Update Diagnostic Pacing Banner
            if (elements.aiPacingBanner) {
                const totalSpent = state.expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
                const isNegative = state.availableMoney - totalSpent < 0;
                const isAtRisk = data.survivalStatus?.isAtRisk;
                const statusClass = isNegative ? 'status-danger' : (isAtRisk ? 'status-warning' : 'status-success');

                elements.aiPacingBanner.className = `ai-diagnostic-banner alert-box ${statusClass}`;
                if (elements.aiBannerIcon) {
                    elements.aiBannerIcon.textContent = isNegative ? '🚨' : (isAtRisk ? '⚠️' : '✅');
                }
                if (elements.aiBannerTitle) {
                    elements.aiBannerTitle.textContent = data.spendingAlert?.title || 'AI Pacing Analysis';
                }
                if (elements.aiPacingStatusBadge) {
                    elements.aiPacingStatusBadge.textContent = isNegative ? 'Deficit' : (isAtRisk ? 'At Risk' : 'On Track');
                }
                if (elements.aiCoachMessage) {
                    elements.aiCoachMessage.textContent = data.spendingAlert?.message || data.coachMessage;
                }
            }

            // 3. Render Personalized Saving Recommendations
            if (elements.aiSuggestionsGrid && Array.isArray(data.savingSuggestions)) {
                elements.aiSuggestionsGrid.innerHTML = '';
                const icons = ['💡', '🎯', '🛡️', '📊'];
                data.savingSuggestions.forEach((sug, idx) => {
                    const card = document.createElement('div');
                    card.className = 'suggestion-card';
                    card.innerHTML = `
                        <div class="suggestion-icon">${icons[idx % icons.length]}</div>
                        <div class="suggestion-info">
                            <h4 class="suggestion-title">${escapeHTML(sug.title)}</h4>
                            <p class="suggestion-text">${escapeHTML(sug.tip)}</p>
                        </div>
                    `;
                    elements.aiSuggestionsGrid.appendChild(card);
                });
            }
        } catch (err) {
            console.error('Failed to load AI insights:', err);
            if (elements.aiPacingStatusBadge) {
                elements.aiPacingStatusBadge.textContent = 'Offline Fallback';
            }
            if (elements.aiCoachMessage) {
                elements.aiCoachMessage.textContent = 'Using localized financial rules while connecting to server.';
            }
        } finally {
            isAiInsightsLoading = false;
        }
    }

    /**
     * Handles interactive student chat submissions
     * @param {Event} e
     */
    async function handleAiChatSubmit(e) {
        if (e && e.preventDefault) e.preventDefault();

        const query = elements.aiChatInput ? elements.aiChatInput.value.trim() : '';
        if (!query) return;

        // Render user message bubble
        appendChatMessage('user', query);
        elements.aiChatInput.value = '';

        // Show typing indicator
        if (elements.aiTypingIndicator) {
            elements.aiTypingIndicator.classList.remove('hidden');
        }
        if (elements.aiChatMessages) {
            elements.aiChatMessages.scrollTop = elements.aiChatMessages.scrollHeight;
        }

        try {
            const payload = {
                message: query,
                availableMoney: state.availableMoney,
                minBalance: state.minBalance,
                allowanceDate: state.allowanceDate,
                expectedAllowance: state.expectedAllowance
            };

            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Unable to process chat request.');
            }

            const data = await res.json();
            appendChatMessage('ai', data.reply);
        } catch (err) {
            console.error('AI chat error:', err);
            appendChatMessage('ai', `⚠️ ${err.message || 'Unable to connect to StudentSpend AI right now. Please check your network connection.'}`);
        } finally {
            if (elements.aiTypingIndicator) {
                elements.aiTypingIndicator.classList.add('hidden');
            }
            if (elements.aiChatMessages) {
                elements.aiChatMessages.scrollTop = elements.aiChatMessages.scrollHeight;
            }
        }
    }

    /**
     * Appends a chat bubble to the message history container
     * @param {'user'|'ai'} sender
     * @param {string} text
     */
    function appendChatMessage(sender, text) {
        if (!elements.aiChatMessages) return;

        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const isAi = sender === 'ai';
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-msg ${isAi ? 'msg-ai' : 'msg-user'}`;

        const formattedHtml = formatChatText(text);

        msgDiv.innerHTML = `
            <div class="chat-avatar">${isAi ? '🤖' : '👨‍🎓'}</div>
            <div class="chat-bubble">
                <div class="bubble-header">
                    <span class="sender-name">${isAi ? 'StudentSpend AI' : (state.currentUser?.name || 'You')}</span>
                    <span class="msg-time">${timeStr}</span>
                </div>
                <div class="bubble-content">
                    ${formattedHtml}
                </div>
            </div>
        `;

        elements.aiChatMessages.appendChild(msgDiv);
        elements.aiChatMessages.scrollTop = elements.aiChatMessages.scrollHeight;
    }

    /**
     * Formats raw chat text with Markdown-style bold and bullet lists safely
     * @param {string} rawText
     * @returns {string}
     */
    function formatChatText(rawText) {
        if (!rawText) return '';
        const safe = escapeHTML(rawText);
        const withBold = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        const lines = withBold.split('\n');
        let inList = false;
        let result = '';

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
                if (!inList) {
                    result += '<ul>';
                    inList = true;
                }
                result += `<li>${trimmed.replace(/^[•-]\s*/, '')}</li>`;
            } else {
                if (inList) {
                    result += '</ul>';
                    inList = false;
                }
                if (trimmed) {
                    result += `<p>${trimmed}</p>`;
                }
            }
        }
        if (inList) result += '</ul>';
        return result || `<p>${withBold}</p>`;
    }

    /**
     * Sets up all DOM Event Listeners
     */
    function setupEventListeners() {
    
        
        // Authentication Events
        elements.loginForm.addEventListener('submit', handleLoginSubmit);
        elements.registerForm.addEventListener('submit', handleRegisterSubmit);
        elements.btnShowRegister.addEventListener('click', showRegisterForm);
        elements.btnShowLogin.addEventListener('click', showSignInForm);
        elements.btnQuickDemo.addEventListener('click', handleQuickDemoFill);
        elements.btnTogglePassword.addEventListener('click', handleTogglePassword);
        elements.btnLogout.addEventListener('click', handleLogout);


        // Realtime Login Validation Clearing
        elements.loginIdentifier.addEventListener('input', () => {
            elements.loginIdentifier.classList.remove('has-error');
            elements.errorLoginIdentifier.textContent = '';
            elements.loginAlert.classList.add('hidden');
        });
        elements.loginPassword.addEventListener('input', () => {
            elements.loginPassword.classList.remove('has-error');
            elements.errorLoginPassword.textContent = '';
            elements.loginAlert.classList.add('hidden');
        });

        // Available Money Form
        elements.availableMoneyForm.addEventListener('submit', handleAvailableMoneySubmit);
        elements.inputAvailableMoney.addEventListener('input', () => {
            elements.inputAvailableMoney.classList.remove('has-error');
            elements.errorAvailableMoney.textContent = '';
        });

        // Minimum Balance Form & Notification Toggle
        elements.minBalanceForm.addEventListener('submit', handleMinBalanceSubmit);
        elements.inputMinBalance.addEventListener('input', () => {
            elements.inputMinBalance.classList.remove('has-error');
            elements.errorMinBalance.textContent = '';
        });
        elements.btnToggleNotifications.addEventListener('click', handleToggleNotifications);

        // Expense Form Events
        elements.expenseForm.addEventListener('submit', handleExpenseFormSubmit);
        elements.inputName.addEventListener('input', () => {
            elements.inputName.classList.remove('has-error');
            elements.errorName.textContent = '';
        });
        elements.inputAmount.addEventListener('input', () => {
            elements.inputAmount.classList.remove('has-error');
            elements.errorAmount.textContent = '';
        });
        elements.inputCategory.addEventListener('change', () => {
            elements.inputCategory.classList.remove('has-error');
            elements.errorCategory.textContent = '';
        });

        // Allowance Predictor Form Events
        if (elements.allowanceForm) {
            elements.allowanceForm.addEventListener('submit', handleAllowanceFormSubmit);
        }
        if (elements.inputAllowanceDate) {
            elements.inputAllowanceDate.addEventListener('input', () => {
                elements.inputAllowanceDate.classList.remove('has-error');
                if (elements.errorAllowanceDate) elements.errorAllowanceDate.textContent = '';
            });
        }
        if (elements.inputAllowanceAmount) {
            elements.inputAllowanceAmount.addEventListener('input', () => {
                elements.inputAllowanceAmount.classList.remove('has-error');
                if (elements.errorAllowanceAmount) elements.errorAllowanceAmount.textContent = '';
            });
        }

        // StudentSpend AI Insights Refresh Button
        if (elements.btnRefreshAiInsights) {
            elements.btnRefreshAiInsights.addEventListener('click', () => {
                loadAiInsights();
                showToast('Refreshing StudentSpend AI insights...', 'info');
            });
        }

        // StudentSpend AI Chat Form Event
        if (elements.aiChatForm) {
            elements.aiChatForm.addEventListener('submit', handleAiChatSubmit);
        }

        // Quick-Ask Prompt Chips
        const promptChips = document.querySelectorAll('.prompt-chip');
        promptChips.forEach(chip => {
            chip.addEventListener('click', () => {
                const query = chip.dataset.query || chip.textContent.trim();
                if (elements.aiChatInput) {
                    elements.aiChatInput.value = query;
                }
                handleAiChatSubmit();
            });
        });

        // Table Action Delegation
        elements.tableBody.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.btn-delete');
            if (deleteBtn) {
                const id = deleteBtn.dataset.id;
                handleDeleteExpense(id);
            }
        });

        // Search and Filter Events
        elements.filterSearch.addEventListener('input', (e) => {
            state.filterQuery = e.target.value;
            renderTable();
        });
        elements.filterCategory.addEventListener('change', (e) => {
            state.filterCategory = e.target.value;
            renderTable();
        });
        elements.btnResetFilters.addEventListener('click', () => {
            state.filterQuery = '';
            state.filterCategory = 'all';
            elements.filterSearch.value = '';
            elements.filterCategory.value = 'all';
            renderTable();
        });

        // Demo Data Button
        elements.btnEmptyLoadSample.addEventListener('click', handleLoadSampleData);

        // Clear All Modal Events
        elements.btnClearAll.addEventListener('click', openClearModal);
        elements.btnModalCancel.addEventListener('click', closeClearModal);
        elements.btnModalConfirm.addEventListener('click', handleClearAllExpenses);
        elements.clearModal.addEventListener('click', (e) => {
            if (e.target === elements.clearModal) {
                closeClearModal();
            }
        });

        // ESC key closes modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !elements.clearModal.classList.contains('hidden')) {
                closeClearModal();
            }
        });

        // Window resize adjusts chart
        window.addEventListener('resize', () => {
            if (!elements.dashboardView.classList.contains('hidden')) {
                const catSummary = Tracker.calculateCategorySummary(state.expenses);
                renderDonutChart(catSummary);
            }
        });
    }

    /**
     * Initialization
     */
    

async function init() {
    const todayStr = new Date().toISOString().split('T')[0];
    elements.inputDate.value = todayStr;

    loadState();
    setupEventListeners();

    try {
        const response = await fetch('/api/me');

        if (response.ok) {
            const result = await response.json();
            state.currentUser = result.user;
            saveUserSession();

            await loadExpensesFromServer();

            showDashboardView();
        } else {
            state.currentUser = null;
            saveUserSession();
            showLoginView();
        }
    } catch (error) {
        console.error('Unable to verify login session:', error);
        state.currentUser = null;
        saveUserSession();
        showLoginView();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
})();
