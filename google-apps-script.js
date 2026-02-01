// Google Apps Script for Township Management System
// This script enables read/write access to your Google Sheets

// Instructions:
// 1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1lT0hQ-vdYMnYKiTQ_EeaUkZwLJaL87niz6qbos75nuU/edit
// 2. Create 4 sheets named: Users, Payments, Issues, Notifications
// 3. Go to Extensions → Apps Script
// 4. Delete any existing code and paste this entire script
// 5. Click "Deploy" → "New deployment"
// 6. Select type: "Web app"
// 7. Execute as: "Me"
// 8. Who has access: "Anyone"
// 9. Click "Deploy" and copy the web app URL
// 10. The URL is already in script.js as CONFIG.APPS_SCRIPT_URL

// Handle GET requests (read all data)
function doGet(e) {
    try {
        const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

        const data = {
            users: readSheet(spreadsheet, 'Users'),
            payments: readSheet(spreadsheet, 'Payments'),
            issues: readSheet(spreadsheet, 'Issues'),
            notifications: readSheet(spreadsheet, 'Notifications')
        };

        return ContentService.createTextOutput(JSON.stringify(data))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            error: error.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

// Handle POST requests (write all data)
function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);
        const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

        // Write to each sheet
        if (data.users) writeSheet(spreadsheet, 'Users', data.users, getUsersHeaders());
        if (data.payments) writeSheet(spreadsheet, 'Payments', data.payments, getPaymentsHeaders());
        if (data.issues) writeSheet(spreadsheet, 'Issues', data.issues, getIssuesHeaders());
        if (data.notifications) writeSheet(spreadsheet, 'Notifications', data.notifications, getNotificationsHeaders());

        return ContentService.createTextOutput(JSON.stringify({
            success: true,
            message: 'Data synced successfully'
        })).setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            success: false,
            error: error.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

// Read data from a sheet
function readSheet(spreadsheet, sheetName) {
    let sheet = spreadsheet.getSheetByName(sheetName);

    // Create sheet if it doesn't exist
    if (!sheet) {
        sheet = spreadsheet.insertSheet(sheetName);
        initializeSheet(sheet, sheetName);
        return [];
    }

    const data = sheet.getDataRange().getValues();

    // Return empty if only header or no data
    if (data.length <= 1) {
        return [];
    }

    const headers = data[0];
    const rows = [];

    // Convert rows to objects
    for (let i = 1; i < data.length; i++) {
        const row = data[i];

        // Skip empty rows
        if (!row[0]) continue;

        const obj = {};
        for (let j = 0; j < headers.length; j++) {
            obj[headers[j]] = row[j] || '';
        }
        rows.push(obj);
    }

    return rows;
}

// Write data to a sheet
function writeSheet(spreadsheet, sheetName, data, headers) {
    let sheet = spreadsheet.getSheetByName(sheetName);

    // Create sheet if it doesn't exist
    if (!sheet) {
        sheet = spreadsheet.insertSheet(sheetName);
    }

    // Clear existing data
    sheet.clear();

    // Write headers
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Format header row
    sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#2d5016')
        .setFontColor('#ffffff');

    // Write data
    if (data.length > 0) {
        const rows = data.map(item => headers.map(header => item[header] || ''));
        sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);

        // Apply formatting based on sheet type
        applySheetFormatting(sheet, sheetName, rows.length);
    }

    // Auto-resize columns
    sheet.autoResizeColumns(1, headers.length);
}

// Initialize a new sheet with headers
function initializeSheet(sheet, sheetName) {
    let headers;

    switch (sheetName) {
        case 'Users':
            headers = getUsersHeaders();
            break;
        case 'Payments':
            headers = getPaymentsHeaders();
            break;
        case 'Issues':
            headers = getIssuesHeaders();
            break;
        case 'Notifications':
            headers = getNotificationsHeaders();
            break;
        default:
            return;
    }

    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#2d5016')
        .setFontColor('#ffffff');

    sheet.autoResizeColumns(1, headers.length);
}

// Apply conditional formatting based on sheet type
function applySheetFormatting(sheet, sheetName, rowCount) {
    if (sheetName === 'Payments') {
        // Status column (column 8)
        const statusRange = sheet.getRange(2, 8, rowCount, 1);
        applyStatusFormatting(sheet, statusRange);
    } else if (sheetName === 'Issues') {
        // Status column (column 5)
        const statusRange = sheet.getRange(2, 5, rowCount, 1);
        applyIssueStatusFormatting(sheet, statusRange);

        // Priority column (column 6)
        const priorityRange = sheet.getRange(2, 6, rowCount, 1);
        applyPriorityFormatting(sheet, priorityRange);
    }
}

// Apply status formatting for payments
function applyStatusFormatting(sheet, range) {
    const rules = sheet.getConditionalFormatRules();

    const paidRule = SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('paid')
        .setBackground('#d1fae5')
        .setFontColor('#10b981')
        .setRanges([range])
        .build();

    const pendingRule = SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('pending')
        .setBackground('#fed7aa')
        .setFontColor('#f59e0b')
        .setRanges([range])
        .build();

    const newRules = rules.concat([paidRule, pendingRule]);
    sheet.setConditionalFormatRules(newRules);
}

// Apply status formatting for issues
function applyIssueStatusFormatting(sheet, range) {
    const rules = sheet.getConditionalFormatRules();

    const openRule = SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('open')
        .setBackground('#fed7aa')
        .setFontColor('#f59e0b')
        .setRanges([range])
        .build();

    const inProgressRule = SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('in-progress')
        .setBackground('#dbeafe')
        .setFontColor('#3b82f6')
        .setRanges([range])
        .build();

    const resolvedRule = SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('resolved')
        .setBackground('#d1fae5')
        .setFontColor('#10b981')
        .setRanges([range])
        .build();

    const newRules = rules.concat([openRule, inProgressRule, resolvedRule]);
    sheet.setConditionalFormatRules(newRules);
}

// Apply priority formatting
function applyPriorityFormatting(sheet, range) {
    const rules = sheet.getConditionalFormatRules();

    const lowRule = SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('low')
        .setBackground('#d1fae5')
        .setFontColor('#10b981')
        .setRanges([range])
        .build();

    const mediumRule = SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('medium')
        .setBackground('#fed7aa')
        .setFontColor('#f59e0b')
        .setRanges([range])
        .build();

    const highRule = SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('high')
        .setBackground('#fecaca')
        .setFontColor('#dc2626')
        .setRanges([range])
        .build();

    const newRules = rules.concat([lowRule, mediumRule, highRule]);
    sheet.setConditionalFormatRules(newRules);
}

// Define headers for each sheet
function getUsersHeaders() {
    return ['username', 'password', 'role', 'flatNumber', 'name', 'email', 'phone'];
}

function getPaymentsHeaders() {
    return ['id', 'flatNumber', 'residentName', 'amount', 'dueDate', 'paymentDate', 'status', 'month', 'year'];
}

function getIssuesHeaders() {
    return ['id', 'flatNumber', 'residentName', 'issueType', 'description', 'status', 'priority', 'createdDate', 'updatedDate', 'adminNotes'];
}

function getNotificationsHeaders() {
    return ['id', 'title', 'message', 'type', 'sentBy', 'sentDate', 'recipients', 'isRead'];
}

// Initialize all sheets with sample data
function initializeAllSheets() {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    // Initialize Users sheet
    const usersSheet = spreadsheet.getSheetByName('Users') || spreadsheet.insertSheet('Users');
    writeSheet(spreadsheet, 'Users', [
        { username: 'admin', password: 'admin123', role: 'admin', flatNumber: '', name: 'Admin User', email: 'admin@township.com', phone: '9876543210' },
        { username: 'resident1', password: 'pass123', role: 'resident', flatNumber: 'A101', name: 'John Doe', email: 'john@example.com', phone: '9876543211' }
    ], getUsersHeaders());

    // Initialize Payments sheet
    const currentMonth = new Date().toISOString().slice(0, 7);
    writeSheet(spreadsheet, 'Payments', [
        { id: 'PAY-1', flatNumber: 'A101', residentName: 'John Doe', amount: 5000, dueDate: currentMonth + '-05', paymentDate: currentMonth + '-03', status: 'paid', month: currentMonth, year: currentMonth.split('-')[0] }
    ], getPaymentsHeaders());

    // Initialize Issues sheet
    writeSheet(spreadsheet, 'Issues', [
        { id: 'ISS-1', flatNumber: 'A101', residentName: 'John Doe', issueType: 'maintenance', description: 'Water leakage', status: 'open', priority: 'high', createdDate: '2026-01-26', updatedDate: '2026-01-26', adminNotes: '' }
    ], getIssuesHeaders());

    // Initialize Notifications sheet
    writeSheet(spreadsheet, 'Notifications', [
        { id: 'NOT-1', title: 'Welcome', message: 'Welcome to Township Management System', type: 'general', sentBy: 'Admin', sentDate: '2026-01-26', recipients: 'all', isRead: 'false' }
    ], getNotificationsHeaders());
}
