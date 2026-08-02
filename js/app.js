// Expense & Budget Visualizer - Main Application

(function() {
    'use strict';

    // ==================== State Management ====================
    const state = {
        transactions: [],
        categories: ['Food', 'Transport', 'Fun'],
        theme: 'light',
        currentMonth: new Date()
    };

    // Category colors for chart
    const categoryColors = {
        'Food': '#F59E0B',
        'Transport': '#3B82F6',
        'Fun': '#8B5CF6'
    };

    const customCategoryColors = ['#EC4899', '#10B981', '#F97316', '#06B6D4', '#84CC16'];
    let customColorIndex = 0;

    // ==================== Local Storage ====================
    function loadFromStorage() {
        try {
            const data = localStorage.getItem('expenseTracker');
            if (data) {
                const parsed = JSON.parse(data);
                state.transactions = parsed.transactions || [];
                state.categories = parsed.categories || ['Food', 'Transport', 'Fun'];
                state.theme = parsed.theme || 'light';
            }
        } catch (e) {
            console.error('Failed to load from storage:', e);
        }
    }

    function saveToStorage() {
        try {
            localStorage.setItem('expenseTracker', JSON.stringify({
                transactions: state.transactions,
                categories: state.categories,
                theme: state.theme
            }));
        } catch (e) {
            console.error('Failed to save to storage:', e);
        }
    }

    // ==================== Theme Management ====================
    function initTheme() {
        document.documentElement.setAttribute('data-theme', state.theme);
    }

    function toggleTheme() {
        state.theme = state.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', state.theme);
        saveToStorage();
    }

    // ==================== Transaction Management ====================
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    function addTransaction(name, amount, category) {
        const transaction = {
            id: generateId(),
            name: name.trim(),
            amount: parseFloat(amount),
            category: category,
            date: new Date().toISOString()
        };
        state.transactions.unshift(transaction);
        saveToStorage();
        return transaction;
    }

    function deleteTransaction(id) {
        const index = state.transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            const deleted = state.transactions.splice(index, 1)[0];
            saveToStorage();
            return deleted;
        }
        return null;
    }

    // ==================== Category Management ====================
    function addCategory(name) {
        const trimmed = name.trim();
        if (trimmed && !state.categories.includes(trimmed)) {
            state.categories.push(trimmed);
            saveToStorage();
            return true;
        }
        return false;
    }

    function getCategoryColor(category) {
        if (categoryColors[category]) {
            return categoryColors[category];
        }
        // Assign color to custom category
        const customIndex = state.categories.indexOf(category) - 3;
        return customCategoryColors[customIndex % customCategoryColors.length];
    }

    // ==================== Calculations ====================
    function calculateBalance() {
        return state.transactions.reduce((sum, t) => sum + t.amount, 0);
    }

    function getMonthlyTransactions() {
        const year = state.currentMonth.getFullYear();
        const month = state.currentMonth.getMonth();

        return state.transactions.filter(t => {
            const date = new Date(t.date);
            return date.getFullYear() === year && date.getMonth() === month;
        });
    }

    function calculateMonthlyStats() {
        const monthly = getMonthlyTransactions();
        const income = monthly.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
        const expenses = monthly.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const balance = income - expenses;

        return { income, expenses, balance, count: monthly.length };
    }

    function getCategoryBreakdown() {
        const breakdown = {};
        state.transactions.forEach(t => {
            if (!breakdown[t.category]) {
                breakdown[t.category] = 0;
            }
            breakdown[t.category] += Math.abs(t.amount);
        });
        return breakdown;
    }

    // ==================== UI Rendering ====================
    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function formatMonth(date) {
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    function renderBalance() {
        const balance = calculateBalance();
        const balanceEl = document.getElementById('balance');
        const amountEl = document.getElementById('balance-amount');

        amountEl.textContent = formatCurrency(balance);
        balanceEl.classList.remove('positive', 'negative');

        if (balance > 0) {
            balanceEl.classList.add('positive');
        } else if (balance < 0) {
            balanceEl.classList.add('negative');
        }
    }

    function renderTransactionList() {
        const listEl = document.getElementById('transaction-list');
        const emptyState = document.getElementById('empty-state');

        if (state.transactions.length === 0) {
            emptyState.style.display = 'flex';
            listEl.querySelectorAll('.transaction-item').forEach(el => el.remove());
            return;
        }

        emptyState.style.display = 'none';

        // Clear existing items
        listEl.querySelectorAll('.transaction-item').forEach(el => el.remove());

        // Render transactions
        state.transactions.forEach(t => {
            const item = document.createElement('div');
            item.className = 'transaction-item';
            item.dataset.id = t.id;

            const isExpense = t.amount < 0;
            const color = getCategoryColor(t.category);

            item.innerHTML = `
                <div class="transaction-info">
                    <span class="transaction-name">${escapeHtml(t.name)}</span>
                    <div class="transaction-meta">
                        <span class="category-badge" data-category="${t.category}" style="background: ${color}">${t.category}</span>
                        <span>${formatDate(t.date)}</span>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span class="transaction-amount ${isExpense ? 'expense' : 'income'}">${formatCurrency(t.amount)}</span>
                    <button class="btn-delete" aria-label="Delete transaction" data-id="${t.id}">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
                </div>
            `;

            listEl.appendChild(item);
        });
    }

    function renderCategoryDropdown() {
        const select = document.getElementById('category');
        const currentValue = select.value;

        // Clear existing options except defaults
        select.querySelectorAll('option:not([value=""]):not([value="Food"]):not([value="Transport"]):not([value="Fun"])').forEach(el => el.remove());

        // Add custom categories
        state.categories.slice(3).forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            select.appendChild(option);
        });

        // Restore selection if still valid
        if (state.categories.includes(currentValue)) {
            select.value = currentValue;
        }
    }

    function renderMonthlySummary() {
        const stats = calculateMonthlyStats();

        document.getElementById('current-month').textContent = formatMonth(state.currentMonth);
        document.getElementById('monthly-income').textContent = formatCurrency(stats.income);
        document.getElementById('monthly-expenses').textContent = formatCurrency(stats.expenses);
        document.getElementById('monthly-balance').textContent = formatCurrency(stats.balance);
        document.getElementById('monthly-count').textContent = stats.count;

        // Color code balance
        const balanceEl = document.getElementById('monthly-balance');
        balanceEl.classList.remove('income', 'expense');
        if (stats.balance > 0) {
            balanceEl.classList.add('income');
        } else if (stats.balance < 0) {
            balanceEl.classList.add('expense');
        }
    }

    // ==================== Chart ====================
    let chart = null;

    function renderChart() {
        const ctx = document.getElementById('expense-chart').getContext('2d');
        const chartEmpty = document.getElementById('chart-empty-state');
        const breakdown = getCategoryBreakdown();

        const categories = Object.keys(breakdown);
        const values = Object.values(breakdown);

        if (categories.length === 0) {
            chartEmpty.style.display = 'flex';
            if (chart) {
                chart.destroy();
                chart = null;
            }
            return;
        }

        chartEmpty.style.display = 'none';

        const colors = categories.map(cat => getCategoryColor(cat));

        if (chart) {
            chart.data.labels = categories;
            chart.data.datasets[0].data = values;
            chart.data.datasets[0].backgroundColor = colors;
            chart.update();
        } else {
            chart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: categories,
                    datasets: [{
                        data: values,
                        backgroundColor: colors,
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    cutout: '60%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 16,
                                usePointStyle: true,
                                pointStyle: 'circle',
                                color: getComputedStyle(document.documentElement).getPropertyValue('--text').trim()
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((context.raw / total) * 100).toFixed(1);
                                    return `${context.label}: ${formatCurrency(context.raw)} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    function updateChartTheme() {
        if (chart) {
            chart.options.plugins.legend.labels.color = getComputedStyle(document.documentElement).getPropertyValue('--text').trim();
            chart.update();
        }
    }

    // ==================== Toast Notifications ====================
    function showToast(message, type = 'success', action = null) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        let actionHtml = '';
        if (action) {
            actionHtml = `<button class="toast-action" data-action="${action.action}">${action.label}</button>`;
        }

        toast.innerHTML = `
            <span class="toast-message">${message}</span>
            ${actionHtml}
        `;

        container.appendChild(toast);

        // Auto dismiss
        const timeout = setTimeout(() => {
            toast.remove();
        }, 4000);

        // Action handler
        if (action) {
            toast.querySelector('.toast-action').addEventListener('click', () => {
                clearTimeout(timeout);
                toast.remove();
                if (action.handler) action.handler();
            });
        }
    }

    // ==================== Form Handling ====================
    function handleFormSubmit(e) {
        e.preventDefault();

        const nameInput = document.getElementById('item-name');
        const amountInput = document.getElementById('amount');
        const categorySelect = document.getElementById('category');

        const name = nameInput.value.trim();
        const amount = parseFloat(amountInput.value);
        const category = categorySelect.value;

        // Validation
        if (!name) {
            showToast('Please enter an item name', 'error');
            nameInput.focus();
            return;
        }

        if (!amount || isNaN(amount)) {
            showToast('Please enter a valid amount', 'error');
            amountInput.focus();
            return;
        }

        if (!category) {
            showToast('Please select a category', 'error');
            categorySelect.focus();
            return;
        }

        // Add transaction
        addTransaction(name, amount, category);

        // Reset form
        nameInput.value = '';
        amountInput.value = '';
        categorySelect.value = '';

        // Update UI
        renderAll();

        showToast('Transaction added successfully', 'success');
    }

    function handleAddCategory() {
        const input = document.getElementById('custom-category');
        const name = input.value.trim();

        if (!name) {
            showToast('Please enter a category name', 'error');
            return;
        }

        if (state.categories.includes(name)) {
            showToast('Category already exists', 'error');
            return;
        }

        addCategory(name);
        input.value = '';
        document.getElementById('custom-category-group').style.display = 'none';
        document.getElementById('show-custom-category').style.display = 'block';

        renderCategoryDropdown();
        showToast(`Category "${name}" added`, 'success');
    }

    function handleDeleteTransaction(id) {
        const deleted = deleteTransaction(id);
        if (deleted) {
            renderAll();
            showToast('Transaction deleted', 'success', {
                label: 'Undo',
                action: 'undo-delete',
                handler: () => {
                    state.transactions.unshift(deleted);
                    saveToStorage();
                    renderAll();
                }
            });
        }
    }

    // ==================== Month Navigation ====================
    function navigateMonth(direction) {
        state.currentMonth.setMonth(state.currentMonth.getMonth() + direction);
        renderMonthlySummary();
    }

    // ==================== Utility ====================
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function renderAll() {
        renderBalance();
        renderTransactionList();
        renderChart();
        renderMonthlySummary();
    }

    // ==================== Event Listeners ====================
    function initEventListeners() {
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            toggleTheme();
            updateChartTheme();
        });

        // Form submission
        document.getElementById('transaction-form').addEventListener('submit', handleFormSubmit);

        // Show custom category
        document.getElementById('show-custom-category').addEventListener('click', () => {
            document.getElementById('custom-category-group').style.display = 'block';
            document.getElementById('show-custom-category').style.display = 'none';
            document.getElementById('custom-category').focus();
        });

        // Add custom category
        document.getElementById('add-category-btn').addEventListener('click', handleAddCategory);

        document.getElementById('custom-category').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCategory();
            }
        });

        // Transaction list delegation
        document.getElementById('transaction-list').addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.btn-delete');
            if (deleteBtn) {
                handleDeleteTransaction(deleteBtn.dataset.id);
            }
        });

        // Month navigation
        document.getElementById('prev-month').addEventListener('click', () => navigateMonth(-1));
        document.getElementById('next-month').addEventListener('click', () => navigateMonth(1));
    }

    // ==================== Initialization ====================
    function init() {
        loadFromStorage();
        initTheme();
        initEventListeners();
        renderCategoryDropdown();
        renderAll();
    }

    // Start app when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
