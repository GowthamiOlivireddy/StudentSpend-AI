
# 🎓 StudentSpend AI — Student Expense Tracker

A modern, responsive, and functional personal expense tracking and budgeting web application designed specifically for college students.

Built with **vanilla HTML5, CSS3, ES6 JavaScript, and LocalStorage**, requiring **zero paid services, zero external APIs, and zero heavy npm packages**.

---

## 🌟 Key Features

### 1. 🔐 Student Login Page (Demo Mode)
- **Application Name**: Student Expense Tracker.
- **Student Welcome Greeting**: Personalized college student greeting.
- **Email or Username Validation**: Checks for empty fields, email format patterns, and minimum length.
- **Password Input with Show/Hide Toggle**: Interactive button (`👁️` / `🙈`) allowing students to reveal or mask their password.
- **Quick Demo Fill Button**: Pre-fills `student@college.edu` with one click for easy evaluation.
- **Transparent Security Notice**: Clearly notes that this is a front-end educational simulation and explains that real production authentication requires a dedicated HTTPS backend, password hashing (e.g. `bcrypt`), and JWT/session tokens.

---

### 2. 📊 Student Financial Dashboard

#### A. Available Money Management
- Enter total available allowance or monthly budget in **Indian Rupees (₹)**.
- **Update Amount** button with instant validation preventing negative or invalid numbers.
- Reflects immediately in all summary cards.

#### B. 🛡️ Minimum Balance Alert & Notifications
- **Set a Safety Buffer**: Define a minimum balance threshold in ₹ (e.g., ₹1,500.00).
- **Edit / Update Anytime**: Change or clear the safety threshold at any time with validation preventing negative numbers.
- **Automatic Balance Monitoring**: Continuously evaluates remaining balance whenever expenses are added, deleted, or allowance is changed.
- **Low Balance Warning Banner**: When remaining balance drops to or below the minimum balance (`remaining balance <= minimum balance`), a distinct amber alert banner appears:
  > *⚠️ Low Balance Alert! Your remaining balance is ₹1,200.00, which is below your minimum balance of ₹1,500.00.*
- **Automatic Clear**: When money is added or expenses deleted such that the balance rises above the limit, the warning clears automatically.
- **Reminder Notifications**:
  - Attractive in-app banner and toast notifications.
  - Optional **Browser Desktop Notifications** using the Web Notification API (`window.Notification`).
  - Permission is requested only when the user clicks **"Enable Alerts"**.
  - Intelligent threshold-crossing detection prevents annoying duplicate notifications for every keystroke.
  - Technical transparency: Desktop notifications require HTTPS (or localhost) and the browser tab to remain open for client-side monitoring. If notifications are denied or unsupported, in-app alerts continue to function seamlessly.

#### C. Add Expenses
- Fields: **Expense Name**, **Amount in ₹**, **Category**, and **Date** (defaults to today).
- College-centric categories:
  - 🍔 **Food**
  - 🚌 **Travel**
  - 📚 **Education**
  - 🛍️ **Shopping**
  - 🎉 **Entertainment**
  - 💡 **Bills**
  - 📦 **Other**
- Validation prevents empty fields, zero amounts, negative numbers, or missing categories.

#### D. Financial Summary (3 Prominent Summary Cards)
1. **Total Available Money** (₹)
2. **Total Expenses** (₹, sum of all recorded transactions)
3. **Remaining Balance** (₹, `Total Available Money − Total Expenses`)
- **Real-Time Recalculation**: Immediately updates on expense addition, deletion, or allowance modification.
- **Dynamic Status Badges**:
  - `✅ Healthy Balance` (above minimum threshold)
  - `⚠️ Low Balance` (below or equal to minimum threshold)
  - `🚨 Over Budget` (negative balance with distinct red overspending alert)
- **Overspending Warning**: If expenses exceed available money, the balance card turns red with a minus sign (e.g., `-₹500.00`), and a prominent **Budget Warning Alert** appears.

#### E. Expense History
- Neatly structured table displaying Name, Category badge with icon, Date, Amount (₹), and a Delete (`🗑️`) button.
- **Real-time Search Filter** (by expense name).
- **Category Filter Dropdown**.
- Friendly empty states for zero expenses or no search matches.

#### F. Spending Insights
- **Budget Consumed Meter**: Displays the percentage of available money spent, safely handling zero available money (`0%` without `NaN` or `Infinity`).
- **HTML5 Canvas Donut Chart**: Lightweight, zero-dependency visual breakdown of expenses by category.
- **Category Progress Bars**: Displays exact expenditure and percentage shares.

#### G. Data Persistence (LocalStorage)
- Stores `availableMoney`, `minBalance`, `notificationsEnabled`, and `expenses` in the browser's `localStorage`.
- Restores all limits and records automatically upon page reload.

---

## 🚀 How to Run on Windows

### Method 1: Direct Double-Click (No Server Required!)
1. Open Windows File Explorer.
2. Navigate to the `student-expense-tracker` folder.
3. Double-click `index.html` (or right-click -> **Open with** -> Microsoft Edge / Google Chrome).

*Or launch from PowerShell:*
```powershell
start index.html
```

---

### Method 2: Using the Included Node.js Server
If you prefer running via a local web server:
```powershell
node server.js
```
Then visit:
```
http://localhost:3000
```

---

### Method 3: Using Python
```powershell
python -m http.server 3000
```
Then visit `http://localhost:3000`.

---

## 🧪 Testing

### 1. Run Automated Unit & Integration Tests
Run the comprehensive test suite with the native Node.js test runner:
```powershell
node --test tests/tracker.test.js tests/server.test.js
```

### 2. Run Direct Verification Scenarios
Verify specific user test scenarios (minimum balance ₹1,500, available ₹5,000, adding ₹3,000, adding ₹700, alert clearing, overspending, notifications):
```powershell
node tests/verification_scenarios.js
```

---

## 📁 File Structure

```
student-expense-tracker/
├── index.html                      # Single-page app with Login, Dashboard, and Min Balance views
├── server.js                       # Zero-dependency local static HTTP server (Node.js)
├── README.md                       # Documentation & Windows execution guide
├── css/
│   └── styles.css                  # Modern blue-and-white theme, warning alerts, and responsive styles
├── js/
│   ├── tracker.js                  # Business logic: validations, min balance math, categories
│   └── app.js                      # DOM controller, Notification API, canvas chart, localStorage
└── tests/
    ├── tracker.test.js             # Automated unit tests for logic & math
    ├── server.test.js              # Integration tests for HTML structure & HTTP server
    └── verification_scenarios.js   # Script running user-requested verification scenarios
```


