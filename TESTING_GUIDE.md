# Google Sheets Sync Testing Guide

## Setup Steps

### 1. Prepare Your Google Sheet

1. **Open your Google Sheet**: https://docs.google.com/spreadsheets/d/1lT0hQ-vdYMnYKiTQ_EeaUkZwLJaL87niz6qbos75nuU/edit

2. **Create 4 sheets** (tabs at the bottom):
   - Click the ➕ button to add new sheets
   - Rename them to:
     - `Users`
     - `Payments`
     - `Issues`
     - `Notifications`

### 2. Deploy Google Apps Script

1. **Open Apps Script**:
   - In your Google Sheet, go to **Extensions → Apps Script**

2. **Replace the code**:
   - Delete any existing code
   - Copy the entire contents of `google-apps-script.js`
   - Paste it into the Apps Script editor

3. **Save the script**:
   - Click the 💾 Save icon (or Ctrl+S)
   - Name it: "Township Management API"

4. **Deploy as Web App**:
   - Click **Deploy → New deployment**
   - Click the ⚙️ gear icon next to "Select type"
   - Choose **Web app**
   - Configure:
     - **Description**: Township Management System
     - **Execute as**: Me (your email)
     - **Who has access**: Anyone
   - Click **Deploy**

5. **Authorize**:
   - Click "Authorize access"
   - Choose your Google account
   - Click "Advanced" → "Go to [Project Name] (unsafe)"
   - Click "Allow"

6. **Copy the URL**:
   - Copy the **Web app URL** (looks like: `https://script.google.com/macros/s/...../exec`)
   - ✅ You've already added this to `script.js`!

### 3. Initialize the Sheets (Optional)

You can run the initialization function to populate sample data:

1. In Apps Script editor, select the function dropdown (top toolbar)
2. Choose `initializeAllSheets`
3. Click the ▶️ Run button
4. This will create headers and sample data in all 4 sheets

## Testing the Sync

### Test 1: Load Data from Google Sheets

1. **Open the application**:
   ```
   c:\Praveen\AntiGravity\Projects\Sadhbhavana\index.html
   ```

2. **Open Browser Console** (F12)

3. **Login as admin**:
   - Username: `admin`
   - Password: `admin123`
   - Role: Admin

4. **Check Console**:
   - Look for: `"Loading from Google Sheets..."`
   - Look for: `"Data loaded from Google Sheets:"`
   - You should see the data object

5. **Verify Data Loaded**:
   - Dashboard should show statistics
   - Click "User Management" - should show users
   - Click "Payments" - should show payments
   - Click "Issues" - should show issues

### Test 2: Write Data to Google Sheets

1. **Add a New User**:
   - Click "User Management"
   - Click "Add New User"
   - Fill in:
     - Username: `testuser`
     - Password: `test123`
     - Role: Resident
     - Flat Number: `C301`
     - Name: `Test User`
     - Email: `test@example.com`
     - Phone: `9999999999`
   - Click "Save User"

2. **Check Console**:
   - Look for: `"Syncing to Google Sheets..."`
   - Look for: `"Data synced to Google Sheets"`

3. **Verify in Google Sheet**:
   - Go to your Google Sheet
   - Open the **Users** tab
   - You should see the new user added!

### Test 3: Record a Payment

1. **Record Payment**:
   - Click "Payments"
   - Click "Record Payment"
   - Select a flat
   - Enter amount: `5000`
   - Select current month
   - Select today's date
   - Click "Save Payment"

2. **Check Console**:
   - Look for sync messages

3. **Verify in Google Sheet**:
   - Open the **Payments** tab
   - New payment should appear!

### Test 4: Raise an Issue

1. **Logout and Login as Resident**:
   - Username: `resident1`
   - Password: `pass123`
   - Role: Resident

2. **Raise Issue**:
   - Click "My Issues"
   - Click "Raise Issue"
   - Select type: Maintenance
   - Description: "Test issue from app"
   - Click "Save"

3. **Verify in Google Sheet**:
   - Open the **Issues** tab
   - New issue should appear!

### Test 5: Send Notification

1. **Login as Admin**

2. **Send Notification**:
   - Click "Notifications"
   - Click "Send Notification"
   - Title: "Test Notification"
   - Message: "This is a test"
   - Type: General
   - Recipients: All Residents
   - Click "Send Notification"

3. **Verify in Google Sheet**:
   - Open the **Notifications** tab
   - New notification should appear!

## Troubleshooting

### Issue: "Google Sheets not configured" in console

**Solution**: The Apps Script URL is not set or incorrect. Check `script.js` line 19.

### Issue: CORS errors in console

**Solution**: This is normal with `mode: 'no-cors'`. The data is still being sent. Check your Google Sheet to verify.

### Issue: Data not appearing in Google Sheets

**Solutions**:
1. Make sure you deployed the Apps Script as "Anyone" access
2. Check Apps Script logs: Extensions → Apps Script → Executions (left sidebar)
3. Try re-deploying the script
4. Make sure sheet names are exactly: `Users`, `Payments`, `Issues`, `Notifications`

### Issue: "Authorization required" error

**Solution**: 
1. Go to Apps Script
2. Click Deploy → Manage deployments
3. Click Edit (pencil icon)
4. Click "Re-authorize"
5. Follow authorization steps again

## Expected Console Output

When everything is working, you should see:

```
Loading from Google Sheets...
Data loaded from Google Sheets: {users: Array(4), payments: Array(4), issues: Array(3), notifications: Array(2)}
Syncing to Google Sheets...
Data synced to Google Sheets
```

## Verification Checklist

- [ ] Apps Script deployed successfully
- [ ] Web app URL copied to script.js
- [ ] 4 sheets created in Google Sheet
- [ ] Console shows "Loading from Google Sheets"
- [ ] Console shows "Data loaded from Google Sheets"
- [ ] Dashboard displays data correctly
- [ ] Adding user syncs to Google Sheet
- [ ] Recording payment syncs to Google Sheet
- [ ] Raising issue syncs to Google Sheet
- [ ] Sending notification syncs to Google Sheet

## Success!

If all tests pass, your Google Sheets sync is working perfectly! All data changes in the app will automatically sync to your Google Sheet, and you can view/edit data directly in the sheet as well.

---

**Note**: With `mode: 'no-cors'`, you won't see response data in the console, but the sync is still working. Always verify by checking the Google Sheet directly.
