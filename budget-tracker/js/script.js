// script.js

// ----- Initial Data -----
const transactions = [
  { id: 1, type: 'expense', amount: 85.50, category: 'Food', description: 'Grocery shopping', date: '2024-05-20' },
  { id: 2, type: 'income', amount: 3200.00, category: 'Salary', description: 'Monthly salary', date: '2024-05-15' },
  { id: 3, type: 'expense', amount: 120.00, category: 'Transport', description: 'Gas and parking', date: '2024-05-18' },
  { id: 4, type: 'expense', amount: 45.99, category: 'Entertainment', description: 'Movie tickets', date: '2024-05-19' },
  { id: 5, type: 'expense', amount: 200.00, category: 'Utilities', description: 'Electricity bill', date: '2024-05-16' },
];

const budgets = [
  { category: 'Food', budget: 500, spent: 285.50 },
  { category: 'Transport', budget: 300, spent: 220.00 },
  { category: 'Entertainment', budget: 200, spent: 145.99 },
  { category: 'Utilities', budget: 400, spent: 200.00 },
];

// Expense categories for dropdown
const categories = ['Food', 'Transport', 'Entertainment', 'Utilities', 'Healthcare', 'Shopping', 'Education', 'Other'];

// ----- DOM Elements -----
const statBalance = document.getElementById('stat-balance');
const statIncome = document.getElementById('stat-income');
const statExpenses = document.getElementById('stat-expenses');
const statSavings = document.getElementById('stat-savings');

const pieCtx = document.getElementById('chart-pie').getContext('2d');
const lineCtx = document.getElementById('chart-line').getContext('2d');

const budgetDetails = document.getElementById('budget-details');
const btnToggleBudget = document.getElementById('btn-toggle-budget');

const transactionsList = document.getElementById('transactions-list');
const searchInput = document.getElementById('search');
const filterType = document.getElementById('filter-type');
const filterPeriod = document.getElementById('filter-period');

const modal = document.getElementById('modal');
const btnShowForm = document.getElementById('btn-show-form');
const btnCancel = document.getElementById('btn-cancel');
const form = document.getElementById('transaction-form');

const typeInput = document.getElementById('type');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const descInput = document.getElementById('description');
const dateInput = document.getElementById('date');

// Modal content for click handling
const modalContent = document.getElementById('modal-content');

// 1) clicking outside the box closes it
modal.addEventListener('click', () => {
  modal.classList.add('hidden');
  form.reset();
});

// 2) but clicks inside the box must NOT close it
modalContent.addEventListener('click', e => {
  e.stopPropagation();
});

// 3) Esc key closes the modal
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
    modal.classList.add('hidden');
    form.reset();
  }
});

// Chart instances
let pieChart, lineChart;

// ----- Utility Functions -----

// Calculate stats and update DOM
function updateStats() {
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expenses;
  const savingsRate = income > 0 ? (balance / income) * 100 : 0;

  statIncome.textContent = `$${income.toFixed(2)}`;
  statExpenses.textContent = `$${expenses.toFixed(2)}`;
  statBalance.textContent = `$${balance.toFixed(2)}`;
  statBalance.style.color = balance >= 0 ? '#0f9d58' : '#db4437';
  statSavings.textContent = `${savingsRate.toFixed(1)}%`;
}

// Render pie & line charts
function renderCharts() {
  // Pie: expenses by category
  const expenseData = categories.map(cat => {
    const val = transactions
      .filter(t => t.type === 'expense' && t.category === cat)
      .reduce((s, t) => s + t.amount, 0);
    return val;
  });
  const pieColors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1', '#84CC16'];

  if (pieChart) pieChart.destroy();
  pieChart = new Chart(pieCtx, {
    type: 'pie',
    data: {
      labels: categories,
      datasets: [{ data: expenseData, backgroundColor: pieColors }]
    }
  });

  // Line: monthly trend (hardcoded example)
  const months = ['Jan','Feb','Mar','Apr','May'];
  const incomeTrend = [3200,3400,3200,3600,3200];
  const expenseTrend= [2800,2950,2700,3100,2200];

  if (lineChart) lineChart.destroy();
  lineChart = new Chart(lineCtx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [
        { label: 'Income', data: incomeTrend, borderColor: '#10B981', fill: false },
        { label: 'Expenses', data: expenseTrend, borderColor: '#EF4444', fill: false }
      ]
    }
  });
}

// Render budget overview cards
function renderBudgetOverview() {
  budgetDetails.innerHTML = '';
  budgets.forEach(b => {
    const percent = Math.min((b.spent / b.budget) * 100, 100);
    const color = b.spent > b.budget ? '#EF4444' : '#10B981';
    const card = document.createElement('div');
    card.className = 'budget-card';
    card.innerHTML = `
      <h4>${b.category} (${percent.toFixed(0)}%)</h4>
      <div class="bar">
        <div class="bar-fill" style="width:${percent}%; background:${color}"></div>
      </div>
      <p class="remaining">$${(b.budget - b.spent).toFixed(2)} remaining</p>
    `;
    budgetDetails.appendChild(card);
  });
}

// Filter helper for period (week/month/year)
function inPeriod(dateStr, period) {
  const d = new Date(dateStr);
  const now = new Date();
  if (period === 'week') {
    const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    return d >= weekAgo;
  }
  if (period === 'year') {
    return d.getFullYear() === now.getFullYear();
  }
  // month
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

// Render transaction list
function renderTransactions() {
  transactionsList.innerHTML = '';
  const term = searchInput.value.toLowerCase();
  const typeFilter = filterType.value;
  const periodFilter = filterPeriod.value;

  transactions
    .filter(t => (typeFilter === 'all' || t.type === typeFilter)
      && (t.description.toLowerCase().includes(term) || t.category.toLowerCase().includes(term))
      && inPeriod(t.date, periodFilter)
    )
    .slice(0, 10)
    .forEach(t => {
      const li = document.createElement('li');
      li.className = `transaction-item ${t.type}`;
      li.innerHTML = `
        <div class="desc">${t.description} • ${t.category} • ${new Date(t.date).toLocaleDateString()}</div>
        <div class="amount">${t.type === 'income' ? '+' : '-'}$${t.amount.toFixed(2)}</div>
        <button onclick="removeTransaction(${t.id})">&times;</button>
      `;
      transactionsList.appendChild(li);
    });
}

// Remove by id
function removeTransaction(id) {
  const idx = transactions.findIndex(t => t.id === id);
  if (idx > -1) {
    transactions.splice(idx, 1);
    updateAll();
  }
}
window.removeTransaction = removeTransaction;

// ----- Event Handlers -----

// Show add form
btnShowForm.addEventListener('click', () => {
  modal.classList.remove('hidden');
});

// Cancel form
btnCancel.addEventListener('click', () => {
  modal.classList.add('hidden');
  form.reset();
});

// Toggle budget details
btnToggleBudget.addEventListener('click', () => {
  budgetDetails.classList.toggle('hidden');
  btnToggleBudget.textContent = budgetDetails.classList.contains('hidden') ? 'Show Details' : 'Hide Details';
});

// Filters & search
searchInput.addEventListener('input', renderTransactions);
filterType.addEventListener('change', renderTransactions);
filterPeriod.addEventListener('change', renderTransactions);

// Populate category dropdown
function populateCategories() {
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categoryInput.appendChild(opt);
  });
}

// Handle form submission
form.addEventListener('submit', e => {
  e.preventDefault();
  const newId = transactions.length ? transactions[transactions.length - 1].id + 1 : 1;
  const newT = {
    id: newId,
    type: typeInput.value,
    amount: parseFloat(amountInput.value),
    category: categoryInput.value,
    description: descInput.value,
    date: dateInput.value || new Date().toISOString().split('T')[0]
  };
  transactions.unshift(newT);
  form.reset();
  modal.classList.add('hidden');
  updateAll();
});

// Re-render everything
function updateAll() {
  updateStats();
  renderCharts();
  renderBudgetOverview();
  renderTransactions();
}

// ----- Init -----
document.addEventListener('DOMContentLoaded', () => {
  populateCategories();
  updateAll();
});
