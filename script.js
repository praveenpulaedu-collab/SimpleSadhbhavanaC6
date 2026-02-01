// ===================================
// Township Management System - Script
// ===================================

// Configuration
const CONFIG = {
    // Google Sheets Configuration
    SHEET_ID: '1lT0hQ-vdYMnYKiTQ_EeaUkZwLJaL87niz6qbos75nuU',

    // Sheet Names
    SHEETS: {
        USERS: 'Users',
        PAYMENTS: 'Payments',
        ISSUES: 'Issues',
        NOTIFICATIONS: 'Notifications'
    },

    // Google Apps Script Web App URL (for write operations)
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbyWksFLmMaurYzfd8m-k6Wx3tvQMMIqx5eVgGCUIElUQ6IYoxfcxYdLxkp9ZzqA7VMn/exec',
    //https://script.google.com/macros/library/d/128UwCxFCxkEHfq567NgoBNEjh0XTvG8snH2EggHlp4DCPVfLQ7tBC6pU/1
    // LocalStorage keys
    STORAGE_KEYS: {
        USERS: 'township_users',
        PAYMENTS: 'township_payments',
        ISSUES: 'township_issues',
        NOTIFICATIONS: 'township_notifications',
        CURRENT_USER: 'township_current_user'
    }
};

// Global State
const state = {
    currentUser: null,
    users: [],
    payments: [],
    issues: [],
    notifications: [],
    filteredPayments: [],
    filteredIssues: []
};

// ===================================
// Initialization
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Check if user is already logged in
    const savedUser = localStorage.getItem(CONFIG.STORAGE_KEYS.CURRENT_USER);
    if (savedUser) {
        state.currentUser = JSON.parse(savedUser);
        showDashboard(state.currentUser.role);
        loadAllData();
    } else {
        showPage('loginPage');
    }

    // Initialize event listeners
    initializeEventListeners();
}

function initializeEventListeners() {
    // Login form
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);

    // Logout buttons
    document.getElementById('adminLogout')?.addEventListener('click', handleLogout);
    document.getElementById('residentLogout')?.addEventListener('click', handleLogout);

    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', handleNavigation);
    });

    // Admin actions
    document.getElementById('recordPaymentBtn')?.addEventListener('click', () => openPaymentModal());
    document.getElementById('sendNotificationBtn')?.addEventListener('click', () => openNotificationModal());
    document.getElementById('raiseIssueBtn')?.addEventListener('click', () => openIssueModal());
    document.getElementById('addUserBtn')?.addEventListener('click', () => openUserModal());

    // Forms
    document.getElementById('paymentForm')?.addEventListener('submit', handlePaymentSubmit);
    document.getElementById('issueForm')?.addEventListener('submit', handleIssueSubmit);
    document.getElementById('notificationForm')?.addEventListener('submit', handleNotificationSubmit);
    document.getElementById('userForm')?.addEventListener('submit', handleUserSubmit);

    // User role change handler
    document.getElementById('userRole')?.addEventListener('change', handleUserRoleChange);

    // Filters
    document.getElementById('paymentSearch')?.addEventListener('input', filterPayments);
    document.getElementById('paymentStatusFilter')?.addEventListener('change', filterPayments);
    document.getElementById('issueSearch')?.addEventListener('input', filterIssues);
    document.getElementById('issueStatusFilter')?.addEventListener('change', filterIssues);
    document.getElementById('issueTypeFilter')?.addEventListener('change', filterIssues);
}

// ===================================
// Authentication
// ===================================

async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('userRole').value;

    showLoading(true);

    // Load users data
    await loadAllData();

    // Find user
    const user = state.users.find(u =>
        u.username === username &&
        u.password === password &&
        u.role === role
    );

    if (user) {
        state.currentUser = user;
        localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        showDashboard(user.role);
        await loadAllData();
    } else {
        alert('Invalid credentials! Please check username, password, and role.');
    }

    showLoading(false);
}

function handleLogout() {
    state.currentUser = null;
    localStorage.removeItem(CONFIG.STORAGE_KEYS.CURRENT_USER);
    showPage('loginPage');

    // Reset form
    document.getElementById('loginForm').reset();
}

// ===================================
// Page & Navigation Management
// ===================================

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId)?.classList.add('active');
}

function showDashboard(role) {
    if (role === 'admin') {
        showPage('adminDashboard');
        document.getElementById('adminUserInfo').textContent = state.currentUser.name;
        // Reset admin nav to overview
        switchSection('overview');
    } else {
        showPage('residentDashboard');
        document.getElementById('residentUserInfo').textContent = state.currentUser.name;
        // Reset resident nav to overview and refresh all resident views
        switchSection('resident-overview');
    }
}

function handleNavigation(e) {
    const section = e.currentTarget.dataset.section;

    // Update active nav item
    e.currentTarget.parentElement.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    e.currentTarget.classList.add('active');

    // Show section
    const container = e.currentTarget.closest('.dashboard-container');
    container.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.remove('active');
    });
    container.querySelector(`#${section}`)?.classList.add('active');

    // Load section data
    loadSectionData(section);
}

function switchSection(sectionId) {
    const navItem = document.querySelector(`[data-section="${sectionId}"]`);
    if (navItem) {
        navItem.click();
    }
}

// Make switchSection available globally
window.switchSection = switchSection;

// ===================================
// Data Loading
// ===================================

async function loadAllData() {
    showLoading(true);

    try {
        // Try to load from Google Sheets first
        const googleData = await loadFromGoogleSheets();

        if (googleData) {
            state.users = googleData.users || [];
            state.payments = googleData.payments || [];
            state.issues = googleData.issues || [];
            state.notifications = googleData.notifications || [];
            // Save to local storage but DO NOT sync back to Google Sheets (prevent loop)
            saveToLocalStorage(false);
        } else {
            // Fallback to localStorage
            loadFromLocalStorage();
        }

        // If no data exists, use sample data
        if (state.users.length === 0) {
            state.users = getSampleUsers();
            state.payments = getSamplePayments();
            state.issues = getSampleIssues();
            state.notifications = getSampleNotifications();
            saveToLocalStorage(false); // No need to sync sample data immediately
        }

        // Update UI
        updateDashboard();

    } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to localStorage
        loadFromLocalStorage();

        if (state.users.length === 0) {
            state.users = getSampleUsers();
            state.payments = getSamplePayments();
            state.issues = getSampleIssues();
            state.notifications = getSampleNotifications();
            saveToLocalStorage(false);
        }

        updateDashboard();
    } finally {
        showLoading(false);
    }
}

async function loadFromGoogleSheets() {
    // Only try if Apps Script URL is configured
    if (!CONFIG.APPS_SCRIPT_URL || CONFIG.APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE') {
        console.log('Google Sheets not configured');
        return null;
    }

    try {
        console.log('Loading from Google Sheets...');
        const response = await fetch(CONFIG.APPS_SCRIPT_URL);
        const data = await response.json();

        if (data.error) {
            console.error('Google Sheets error:', data.error);
            return null;
        }

        console.log('Data loaded from Google Sheets:', data);
        return data;
    } catch (error) {
        console.error('Error fetching from Google Sheets:', error);
        return null;
    }
}

function loadFromLocalStorage() {
    const users = localStorage.getItem(CONFIG.STORAGE_KEYS.USERS);
    const payments = localStorage.getItem(CONFIG.STORAGE_KEYS.PAYMENTS);
    const issues = localStorage.getItem(CONFIG.STORAGE_KEYS.ISSUES);
    const notifications = localStorage.getItem(CONFIG.STORAGE_KEYS.NOTIFICATIONS);

    if (users) state.users = JSON.parse(users);
    if (payments) state.payments = JSON.parse(payments);
    if (issues) state.issues = JSON.parse(issues);
    if (notifications) state.notifications = JSON.parse(notifications);
}

function saveToLocalStorage(sync = true) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.USERS, JSON.stringify(state.users));
    localStorage.setItem(CONFIG.STORAGE_KEYS.PAYMENTS, JSON.stringify(state.payments));
    localStorage.setItem(CONFIG.STORAGE_KEYS.ISSUES, JSON.stringify(state.issues));
    localStorage.setItem(CONFIG.STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(state.notifications));

    // Only sync to Google Sheets if requested (e.g., on user mutation)
    if (sync) {
        syncToGoogleSheets();
    }
}

async function syncToGoogleSheets() {
    // Only sync if Apps Script URL is configured
    if (!CONFIG.APPS_SCRIPT_URL || CONFIG.APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE') {
        return;
    }

    try {
        console.log('Syncing to Google Sheets...');
        const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Apps Script requires no-cors
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                users: state.users,
                payments: state.payments,
                issues: state.issues,
                notifications: state.notifications
            })
        });

        console.log('Data synced to Google Sheets');
    } catch (error) {
        console.error('Error syncing to Google Sheets:', error);
        // Don't fail the operation if sync fails
    }
}

function loadSectionData(section) {
    switch (section) {
        case 'overview':
            updateAdminOverview();
            break;
        case 'payments':
            filterPayments();
            break;
        case 'issues':
            filterIssues();
            break;
        case 'notifications':
            renderNotifications();
            break;
        case 'residents':
            renderResidents();
            break;
        case 'user-management':
            renderUsers();
            break;
        case 'resident-overview':
            updateResidentOverview();
            break;
        case 'resident-payments':
            renderResidentPayments();
            break;
        case 'resident-issues':
            renderResidentIssues();
            break;
        case 'resident-notifications':
            renderResidentNotifications();
            break;
    }
}

// ===================================
// Dashboard Updates
// ===================================

function updateDashboard() {
    // Don't update if no user is logged in
    if (!state.currentUser) {
        return;
    }

    if (state.currentUser.role === 'admin') {
        updateAdminOverview();
    } else {
        updateResidentOverview();
        // Also ensure resident-specific lists are rendered
        renderResidentPayments();
        renderResidentIssues();
        renderResidentNotifications();
    }
}

function updateAdminOverview() {
    // Update stats
    document.getElementById('totalResidents').textContent = state.users.filter(u => u.role === 'resident').length;

    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentMonthPayments = state.payments.filter(p => p.month === currentMonth);

    document.getElementById('paymentsPaid').textContent = currentMonthPayments.filter(p => p.status === 'paid').length;
    document.getElementById('paymentsPending').textContent = currentMonthPayments.filter(p => p.status === 'pending').length;
    document.getElementById('openIssues').textContent = state.issues.filter(i => i.status !== 'resolved').length;

    // Recent payments
    const recentPayments = state.payments
        .filter(p => p.status === 'paid')
        .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
        .slice(0, 5);

    const recentPaymentsHTML = recentPayments.length > 0
        ? recentPayments.map(p => `
            <div class="list-item">
                <div class="list-item-header">
                    <span class="list-item-title">Flat ${p.flatNumber} - ${p.residentName}</span>
                    <span class="list-item-meta">₹${p.amount}</span>
                </div>
                <div class="list-item-meta">${formatDate(p.paymentDate)}</div>
            </div>
        `).join('')
        : '<p class="text-center text-secondary">No recent payments</p>';

    document.getElementById('recentPayments').innerHTML = recentPaymentsHTML;

    // Recent issues
    const recentIssues = state.issues
        .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))
        .slice(0, 5);

    const recentIssuesHTML = recentIssues.length > 0
        ? recentIssues.map(i => `
            <div class="list-item">
                <div class="list-item-header">
                    <span class="list-item-title">Flat ${i.flatNumber} - ${i.issueType}</span>
                    <span class="status-badge ${i.status}">${i.status}</span>
                </div>
                <div class="list-item-meta">${i.description.substring(0, 50)}...</div>
            </div>
        `).join('')
        : '<p class="text-center text-secondary">No recent issues</p>';

    document.getElementById('recentIssues').innerHTML = recentIssuesHTML;
}

function updateResidentOverview() {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const myPayment = state.payments.find(p =>
        p.flatNumber === state.currentUser.flatNumber &&
        p.month === currentMonth
    );

    const paymentCard = document.getElementById('residentPaymentCard');
    const paymentStatus = document.getElementById('residentPaymentStatus');

    if (myPayment && myPayment.status === 'paid') {
        paymentStatus.textContent = 'Paid';
        paymentCard.classList.add('success');
    } else {
        paymentStatus.textContent = 'Pending';
        paymentCard.classList.add('warning');
    }

    const myIssues = state.issues.filter(i =>
        i.flatNumber === state.currentUser.flatNumber &&
        i.status !== 'resolved'
    );
    document.getElementById('residentIssueCount').textContent = myIssues.length;

    const unreadNotifications = state.notifications.filter(n =>
        (n.recipients === 'all' || n.recipients.includes(state.currentUser.flatNumber)) &&
        !n.isRead
    );
    document.getElementById('residentNotificationCount').textContent = unreadNotifications.length;
}

// ===================================
// Payment Management
// ===================================

function filterPayments() {
    const search = document.getElementById('paymentSearch')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('paymentStatusFilter')?.value || 'all';

    state.filteredPayments = state.payments.filter(p => {
        const matchesSearch = p.flatNumber.toLowerCase().includes(search) ||
            p.residentName.toLowerCase().includes(search);
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    renderPayments();
}

function renderPayments() {
    const tbody = document.getElementById('paymentsTableBody');
    if (!tbody) return;

    if (state.filteredPayments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No payments found</td></tr>';
        return;
    }

    tbody.innerHTML = state.filteredPayments.map(p => `
        <tr>
            <td>${p.flatNumber}</td>
            <td>${p.residentName}</td>
            <td>₹${p.amount}</td>
            <td>${formatDate(p.dueDate)}</td>
            <td>${p.paymentDate ? formatDate(p.paymentDate) : '-'}</td>
            <td><span class="status-badge ${p.status}">${p.status}</span></td>
            <td>
                ${p.status === 'pending' ? `
                    <button class="btn-primary" onclick="markAsPaid('${p.id}')">Mark Paid</button>
                ` : '-'}
            </td>
        </tr>
    `).join('');
}

function openPaymentModal(paymentId = null) {
    const modal = document.getElementById('paymentModal');
    const form = document.getElementById('paymentForm');

    // Populate flat dropdown
    const flatSelect = document.getElementById('paymentFlat');
    const residents = state.users.filter(u => u.role === 'resident');
    flatSelect.innerHTML = residents.map(r =>
        `<option value="${r.flatNumber}">${r.flatNumber} - ${r.name}</option>`
    ).join('');

    // Set current month
    const currentMonth = new Date().toISOString().slice(0, 7);
    document.getElementById('paymentMonth').value = currentMonth;
    document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('paymentAmount').value = '5000'; // Default amount

    modal.classList.add('active');
}

async function handlePaymentSubmit(e) {
    e.preventDefault();

    const flatNumber = document.getElementById('paymentFlat').value;
    const amount = document.getElementById('paymentAmount').value;
    const month = document.getElementById('paymentMonth').value;
    const paymentDate = document.getElementById('paymentDate').value;

    const resident = state.users.find(u => u.flatNumber === flatNumber);

    const payment = {
        id: `PAY-${Date.now()}`,
        flatNumber,
        residentName: resident.name,
        amount: parseFloat(amount),
        dueDate: `${month}-05`, // 5th of the month
        paymentDate,
        status: 'paid',
        month,
        year: month.split('-')[0]
    };

    state.payments.push(payment);
    saveToLocalStorage();

    closeModal('paymentModal');
    filterPayments();
    updateAdminOverview();

    alert('Payment recorded successfully!');
}

function markAsPaid(paymentId) {
    const payment = state.payments.find(p => p.id === paymentId);
    if (payment) {
        payment.status = 'paid';
        payment.paymentDate = new Date().toISOString().split('T')[0];
        saveToLocalStorage();
        filterPayments();
        updateAdminOverview();
    }
}

// Make markAsPaid available globally
window.markAsPaid = markAsPaid;

function renderResidentPayments() {
    const tbody = document.getElementById('residentPaymentsTableBody');
    if (!tbody) return;

    const myPayments = state.payments.filter(p => p.flatNumber === state.currentUser.flatNumber);

    if (myPayments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No payment history</td></tr>';
        return;
    }

    tbody.innerHTML = myPayments.map(p => `
        <tr>
            <td>${p.month}</td>
            <td>₹${p.amount}</td>
            <td>${formatDate(p.dueDate)}</td>
            <td>${p.paymentDate ? formatDate(p.paymentDate) : '-'}</td>
            <td><span class="status-badge ${p.status}">${p.status}</span></td>
        </tr>
    `).join('');
}

// ===================================
// Issue Management
// ===================================

function filterIssues() {
    const search = document.getElementById('issueSearch')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('issueStatusFilter')?.value || 'all';
    const typeFilter = document.getElementById('issueTypeFilter')?.value || 'all';

    state.filteredIssues = state.issues.filter(i => {
        const matchesSearch = i.description.toLowerCase().includes(search) ||
            i.flatNumber.toLowerCase().includes(search);
        const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
        const matchesType = typeFilter === 'all' || i.issueType === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
    });

    renderIssues();
}

function renderIssues() {
    const tbody = document.getElementById('issuesTableBody');
    if (!tbody) return;

    if (state.filteredIssues.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No issues found</td></tr>';
        return;
    }

    tbody.innerHTML = state.filteredIssues.map(i => `
        <tr>
            <td>${i.id}</td>
            <td>${i.flatNumber}</td>
            <td>${i.issueType}</td>
            <td>${i.description.substring(0, 50)}...</td>
            <td><span class="status-badge ${i.status}">${i.status}</span></td>
            <td><span class="priority-badge ${i.priority}">${i.priority}</span></td>
            <td>${formatDate(i.createdDate)}</td>
            <td>
                <button class="btn-primary" onclick="viewIssue('${i.id}')">View</button>
            </td>
        </tr>
    `).join('');
}

function openIssueModal(issueId = null) {
    const modal = document.getElementById('issueModal');
    const form = document.getElementById('issueForm');
    const title = document.getElementById('issueModalTitle');

    if (issueId) {
        // Edit mode (admin)
        const issue = state.issues.find(i => i.id === issueId);
        title.textContent = 'Update Issue';
        document.getElementById('issueId').value = issue.id;
        document.getElementById('issueType').value = issue.issueType;
        document.getElementById('issueDescription').value = issue.description;
        document.getElementById('issueStatus').value = issue.status;
        document.getElementById('issuePriority').value = issue.priority;
        document.getElementById('issueNotes').value = issue.adminNotes || '';

        // Show admin fields
        document.getElementById('issueStatusGroup').style.display = 'block';
        document.getElementById('issuePriorityGroup').style.display = 'block';
        document.getElementById('issueNotesGroup').style.display = 'block';
    } else {
        // New issue mode (resident)
        title.textContent = 'Raise New Issue';
        form.reset();
        document.getElementById('issueId').value = '';

        // Hide admin fields for residents
        if (state.currentUser.role === 'resident') {
            document.getElementById('issueStatusGroup').style.display = 'none';
            document.getElementById('issuePriorityGroup').style.display = 'none';
            document.getElementById('issueNotesGroup').style.display = 'none';
        }
    }

    modal.classList.add('active');
}

function viewIssue(issueId) {
    openIssueModal(issueId);
}

// Make viewIssue available globally
window.viewIssue = viewIssue;

async function handleIssueSubmit(e) {
    e.preventDefault();

    const issueId = document.getElementById('issueId').value;
    const issueType = document.getElementById('issueType').value;
    const description = document.getElementById('issueDescription').value;

    if (issueId) {
        // Update existing issue
        const issue = state.issues.find(i => i.id === issueId);
        issue.issueType = issueType;
        issue.description = description;
        issue.status = document.getElementById('issueStatus').value;
        issue.priority = document.getElementById('issuePriority').value;
        issue.adminNotes = document.getElementById('issueNotes').value;
        issue.updatedDate = new Date().toISOString().split('T')[0];
    } else {
        // Create new issue
        const newIssue = {
            id: `ISS-${Date.now()}`,
            flatNumber: state.currentUser.flatNumber,
            residentName: state.currentUser.name,
            issueType,
            description,
            status: 'open',
            priority: 'medium',
            createdDate: new Date().toISOString().split('T')[0],
            updatedDate: new Date().toISOString().split('T')[0],
            adminNotes: ''
        };
        state.issues.push(newIssue);
    }

    saveToLocalStorage();
    closeModal('issueModal');

    if (state.currentUser.role === 'admin') {
        filterIssues();
        updateAdminOverview();
    } else {
        renderResidentIssues();
        updateResidentOverview();
    }

    alert(issueId ? 'Issue updated successfully!' : 'Issue raised successfully!');
}

function renderResidentIssues() {
    const tbody = document.getElementById('residentIssuesTableBody');
    if (!tbody) return;

    const myIssues = state.issues.filter(i => i.flatNumber === state.currentUser.flatNumber);

    if (myIssues.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No issues raised</td></tr>';
        return;
    }

    tbody.innerHTML = myIssues.map(i => `
        <tr>
            <td>${i.id}</td>
            <td>${i.issueType}</td>
            <td>${i.description}</td>
            <td><span class="status-badge ${i.status}">${i.status}</span></td>
            <td><span class="priority-badge ${i.priority}">${i.priority}</span></td>
            <td>${formatDate(i.createdDate)}</td>
        </tr>
    `).join('');
}

// ===================================
// Notification Management
// ===================================

function openNotificationModal() {
    const modal = document.getElementById('notificationModal');
    const form = document.getElementById('notificationForm');

    // Populate recipients dropdown
    const recipientsSelect = document.getElementById('notificationRecipients');
    const residents = state.users.filter(u => u.role === 'resident');
    recipientsSelect.innerHTML = `
        <option value="all">All Residents</option>
        ${residents.map(r => `<option value="${r.flatNumber}">${r.flatNumber} - ${r.name}</option>`).join('')}
    `;

    form.reset();
    modal.classList.add('active');
}

async function handleNotificationSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('notificationTitle').value;
    const message = document.getElementById('notificationMessage').value;
    const type = document.getElementById('notificationType').value;
    const recipients = document.getElementById('notificationRecipients').value;

    const notification = {
        id: `NOT-${Date.now()}`,
        title,
        message,
        type,
        sentBy: state.currentUser.name,
        sentDate: new Date().toISOString().split('T')[0],
        recipients,
        isRead: false
    };

    state.notifications.push(notification);
    saveToLocalStorage();

    closeModal('notificationModal');
    renderNotifications();

    alert('Notification sent successfully!');
}

function renderNotifications() {
    const tbody = document.getElementById('notificationsTableBody');
    if (!tbody) return;

    if (state.notifications.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No notifications sent</td></tr>';
        return;
    }

    tbody.innerHTML = state.notifications.map(n => `
        <tr>
            <td>${n.title}</td>
            <td><span class="status-badge ${n.type}">${n.type}</span></td>
            <td>${n.recipients === 'all' ? 'All Residents' : `Flat ${n.recipients}`}</td>
            <td>${formatDate(n.sentDate)}</td>
            <td>
                <button class="btn-primary" onclick="viewNotification('${n.id}')">View</button>
            </td>
        </tr>
    `).join('');
}

function viewNotification(notificationId) {
    const notification = state.notifications.find(n => n.id === notificationId);
    if (notification) {
        alert(`${notification.title}\n\n${notification.message}\n\nSent by: ${notification.sentBy}\nDate: ${formatDate(notification.sentDate)}`);
    }
}

// Make viewNotification available globally
window.viewNotification = viewNotification;

function renderResidentNotifications() {
    const container = document.getElementById('residentNotificationsList');
    if (!container) return;

    const myNotifications = state.notifications.filter(n =>
        n.recipients === 'all' || n.recipients === state.currentUser.flatNumber
    );

    if (myNotifications.length === 0) {
        container.innerHTML = '<p class="text-center text-secondary">No notifications</p>';
        return;
    }

    container.innerHTML = myNotifications.map(n => `
        <div class="notification-card ${n.type}">
            <div class="notification-header">
                <h3 class="notification-title">${n.title}</h3>
                <span class="notification-date">${formatDate(n.sentDate)}</span>
            </div>
            <p class="notification-message">${n.message}</p>
        </div>
    `).join('');
}

// ===================================
// User Management
// ===================================

function openUserModal(userId = null) {
    const modal = document.getElementById('userModal');
    const form = document.getElementById('userForm');
    const title = document.getElementById('userModalTitle');

    if (userId) {
        // Edit mode
        const user = state.users.find(u => u.username === userId);
        title.textContent = 'Edit User';
        document.getElementById('userId').value = user.username;
        document.getElementById('userUsername').value = user.username;
        document.getElementById('userUsername').disabled = true;
        document.getElementById('userPassword').value = user.password;
        document.getElementById('userRole').value = user.role;
        document.getElementById('userFlat').value = user.flatNumber || '';
        document.getElementById('userName').value = user.name;
        document.getElementById('userEmail').value = user.email;
        document.getElementById('userPhone').value = user.phone;

        // Show/hide flat field based on role
        document.getElementById('userFlatGroup').style.display = user.role === 'resident' ? 'block' : 'none';
    } else {
        // Add mode
        title.textContent = 'Add New User';
        form.reset();
        document.getElementById('userId').value = '';
        document.getElementById('userUsername').disabled = false;
        document.getElementById('userRole').value = 'resident';
        document.getElementById('userFlatGroup').style.display = 'block';
    }

    modal.classList.add('active');
}

function handleUserRoleChange(e) {
    const role = e.target.value;
    const flatGroup = document.getElementById('userFlatGroup');
    const flatInput = document.getElementById('userFlat');

    if (role === 'resident') {
        flatGroup.style.display = 'block';
        flatInput.required = true;
    } else {
        flatGroup.style.display = 'none';
        flatInput.required = false;
    }
}

async function handleUserSubmit(e) {
    e.preventDefault();

    const userId = document.getElementById('userId').value;
    const username = document.getElementById('userUsername').value;
    const password = document.getElementById('userPassword').value;
    const role = document.getElementById('userRole').value;
    const flatNumber = document.getElementById('userFlat').value;
    const name = document.getElementById('userName').value;
    const email = document.getElementById('userEmail').value;
    const phone = document.getElementById('userPhone').value;

    // Check if username already exists (only for new users)
    if (!userId && state.users.find(u => u.username === username)) {
        alert('Username already exists! Please choose a different username.');
        return;
    }

    // Check if flat number already exists (only for residents)
    if (role === 'resident' && !userId && state.users.find(u => u.flatNumber === flatNumber)) {
        alert('Flat number already assigned! Please choose a different flat number.');
        return;
    }

    const userData = {
        username,
        password,
        role,
        name,
        email,
        phone
    };

    if (role === 'resident') {
        userData.flatNumber = flatNumber;
    }

    if (userId) {
        // Update existing user
        const index = state.users.findIndex(u => u.username === userId);
        state.users[index] = userData;
    } else {
        // Add new user
        state.users.push(userData);

        // If resident, create initial payment record for current month
        if (role === 'resident') {
            const currentMonth = new Date().toISOString().slice(0, 7);
            const newPayment = {
                id: `PAY-${Date.now()}`,
                flatNumber,
                residentName: name,
                amount: 5000,
                dueDate: `${currentMonth}-05`,
                paymentDate: null,
                status: 'pending',
                month: currentMonth,
                year: currentMonth.split('-')[0]
            };
            state.payments.push(newPayment);
        }
    }

    saveToLocalStorage();
    closeModal('userModal');
    renderUsers();
    updateAdminOverview();

    alert(userId ? 'User updated successfully!' : 'User added successfully!');
}

function renderUsers() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (state.users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No users found</td></tr>';
        return;
    }

    tbody.innerHTML = state.users.map(u => `
        <tr>
            <td>${u.username}</td>
            <td><span class="status-badge ${u.role === 'admin' ? 'info' : ''}">${u.role}</span></td>
            <td>${u.flatNumber || '-'}</td>
            <td>${u.name}</td>
            <td>${u.email}</td>
            <td>${u.phone}</td>
            <td>
                <button class="btn-primary" onclick="editUser('${u.username}')">Edit</button>
                ${u.username !== 'admin' ? `<button class="btn-danger" onclick="deleteUser('${u.username}')">Delete</button>` : ''}
            </td>
        </tr>
    `).join('');
}

function editUser(username) {
    openUserModal(username);
}

function deleteUser(username) {
    if (confirm(`Are you sure you want to delete user "${username}"? This will also delete all associated payments and issues.`)) {
        const user = state.users.find(u => u.username === username);

        // Remove user
        state.users = state.users.filter(u => u.username !== username);

        // Remove associated payments if resident
        if (user.flatNumber) {
            state.payments = state.payments.filter(p => p.flatNumber !== user.flatNumber);
            state.issues = state.issues.filter(i => i.flatNumber !== user.flatNumber);
        }

        saveToLocalStorage();
        renderUsers();
        updateAdminOverview();

        alert('User deleted successfully!');
    }
}

// Make functions available globally
window.editUser = editUser;
window.deleteUser = deleteUser;

// ===================================
// Residents Management
// ===================================

function renderResidents() {
    const tbody = document.getElementById('residentsTableBody');
    if (!tbody) return;

    const residents = state.users.filter(u => u.role === 'resident');
    const currentMonth = new Date().toISOString().slice(0, 7);

    tbody.innerHTML = residents.map(r => {
        const payment = state.payments.find(p =>
            p.flatNumber === r.flatNumber && p.month === currentMonth
        );
        const paymentStatus = payment && payment.status === 'paid' ? 'paid' : 'pending';

        return `
            <tr>
                <td>${r.flatNumber}</td>
                <td>${r.name}</td>
                <td>${r.email}</td>
                <td>${r.phone}</td>
                <td><span class="status-badge ${paymentStatus}">${paymentStatus}</span></td>
            </tr>
        `;
    }).join('');
}

// ===================================
// Sample Data
// ===================================

function getSampleUsers() {
    return [
        {
            username: 'admin',
            password: 'admin123',
            role: 'admin',
            name: 'Admin User',
            email: 'admin@township.com',
            phone: '9876543210'
        },
        {
            username: 'resident1',
            password: 'pass123',
            role: 'resident',
            flatNumber: 'A101',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '9876543211'
        },
        {
            username: 'resident2',
            password: 'pass123',
            role: 'resident',
            flatNumber: 'A102',
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '9876543212'
        },
        {
            username: 'resident3',
            password: 'pass123',
            role: 'resident',
            flatNumber: 'B201',
            name: 'Bob Johnson',
            email: 'bob@example.com',
            phone: '9876543213'
        }
    ];
}

function getSamplePayments() {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);

    return [
        {
            id: 'PAY-1',
            flatNumber: 'A101',
            residentName: 'John Doe',
            amount: 5000,
            dueDate: `${currentMonth}-05`,
            paymentDate: `${currentMonth}-03`,
            status: 'paid',
            month: currentMonth,
            year: currentMonth.split('-')[0]
        },
        {
            id: 'PAY-2',
            flatNumber: 'A102',
            residentName: 'Jane Smith',
            amount: 5000,
            dueDate: `${currentMonth}-05`,
            paymentDate: null,
            status: 'pending',
            month: currentMonth,
            year: currentMonth.split('-')[0]
        },
        {
            id: 'PAY-3',
            flatNumber: 'B201',
            residentName: 'Bob Johnson',
            amount: 5000,
            dueDate: `${currentMonth}-05`,
            paymentDate: null,
            status: 'pending',
            month: currentMonth,
            year: currentMonth.split('-')[0]
        },
        {
            id: 'PAY-4',
            flatNumber: 'A101',
            residentName: 'John Doe',
            amount: 5000,
            dueDate: `${lastMonth}-05`,
            paymentDate: `${lastMonth}-04`,
            status: 'paid',
            month: lastMonth,
            year: lastMonth.split('-')[0]
        }
    ];
}

function getSampleIssues() {
    return [
        {
            id: 'ISS-1',
            flatNumber: 'A101',
            residentName: 'John Doe',
            issueType: 'maintenance',
            description: 'Water leakage in bathroom',
            status: 'in-progress',
            priority: 'high',
            createdDate: '2026-01-20',
            updatedDate: '2026-01-22',
            adminNotes: 'Plumber assigned'
        },
        {
            id: 'ISS-2',
            flatNumber: 'A102',
            residentName: 'Jane Smith',
            issueType: 'complaint',
            description: 'Noise from neighboring flat',
            status: 'open',
            priority: 'medium',
            createdDate: '2026-01-24',
            updatedDate: '2026-01-24',
            adminNotes: ''
        },
        {
            id: 'ISS-3',
            flatNumber: 'B201',
            residentName: 'Bob Johnson',
            issueType: 'request',
            description: 'Request for parking space',
            status: 'resolved',
            priority: 'low',
            createdDate: '2026-01-15',
            updatedDate: '2026-01-18',
            adminNotes: 'Parking space allocated'
        }
    ];
}

function getSampleNotifications() {
    return [
        {
            id: 'NOT-1',
            title: 'Monthly Maintenance Due',
            message: 'Please pay your monthly maintenance fee by 5th of this month.',
            type: 'payment',
            sentBy: 'Admin User',
            sentDate: '2026-01-01',
            recipients: 'all',
            isRead: false
        },
        {
            id: 'NOT-2',
            title: 'Water Supply Interruption',
            message: 'Water supply will be interrupted tomorrow from 10 AM to 2 PM for maintenance work.',
            type: 'urgent',
            sentBy: 'Admin User',
            sentDate: '2026-01-20',
            recipients: 'all',
            isRead: false
        }
    ];
}

// ===================================
// Utility Functions
// ===================================

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Make closeModal available globally
window.closeModal = closeModal;
