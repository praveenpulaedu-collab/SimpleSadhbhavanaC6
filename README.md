# Township Management System

A complete web-based management system for townships with user authentication, payment tracking, issue management, and notifications.

## 🌟 Features

### For Admins
- **Dashboard Overview**: View statistics on residents, payments, and issues
- **Payment Management**: Track payments, record new payments, mark as paid
- **Issue Management**: View all issues, update status and priority, add notes
- **Notification System**: Send notifications to all or specific residents
- **Resident Management**: View all residents and their payment status
- **User Management**: Add new users, edit user details, delete users

### For Residents
- **Personal Dashboard**: View payment status and open issues
- **Payment History**: Track all past payments
- **Issue Raising**: Report maintenance issues, complaints, or requests
- **Notifications**: Receive important updates from admin

## 🚀 Quick Start

1. **Open the Application**
   ```
   Open: c:\Praveen\AntiGravity\Projects\Sadhbhavana\index.html
   ```

2. **Login Credentials**
   
   **Admin:**
   - Username: `admin`
   - Password: `admin123`
   - Role: Admin
   
   **Resident:**
   - Username: `resident1`
   - Password: `pass123`
   - Role: Resident

3. **Explore Features**
   - Admin can manage payments, issues, and send notifications
   - Residents can view their data and raise issues

## 📊 Data Structure

The system uses 4 data sheets:

### 1. Users Sheet
```
Username | Password | Role | FlatNumber | Name | Email | Phone
```

### 2. Payments Sheet
```
ID | FlatNumber | ResidentName | Amount | DueDate | PaymentDate | Status | Month | Year
```

### 3. Issues Sheet
```
ID | FlatNumber | ResidentName | IssueType | Description | Status | Priority | CreatedDate | UpdatedDate | AdminNotes
```

### 4. Notifications Sheet
```
ID | Title | Message | Type | SentBy | SentDate | Recipients | IsRead
```

## 💾 Data Storage

Currently, the application uses **LocalStorage** for data persistence. All data is stored in your browser.

### Google Sheets Integration (Optional)

To sync data with Google Sheets, follow the setup guide in `GOOGLE_SHEETS_SETUP.md`.

## 🎯 User Workflows

### Admin Workflow

1. **Login** as admin
2. **View Dashboard** - See overview of all activities
3. **Manage Payments**:
   - Click "Payments" in sidebar
   - Click "Record Payment" to add new payment
   - Click "Mark Paid" for pending payments
4. **Manage Issues**:
   - Click "Issues" in sidebar
   - Click "View" to update issue status
   - Add admin notes
5. **Send Notifications**:
   - Click "Notifications" in sidebar
   - Click "Send Notification"
   - Choose recipients and type

### Resident Workflow

1. **Login** as resident
2. **View Dashboard** - See payment status and issue count
3. **Check Payments**:
   - Click "My Payments" in sidebar
   - View payment history
4. **Raise Issue**:
   - Click "My Issues" in sidebar
   - Click "Raise Issue"
   - Fill form and submit
5. **View Notifications**:
   - Click "Notifications" in sidebar
   - Read important updates

## 🛠️ Customization

### Adding New Residents

Edit `script.js` and add to `getSampleUsers()`:

```javascript
{
    username: 'resident4',
    password: 'pass123',
    role: 'resident',
    flatNumber: 'C301',
    name: 'New Resident',
    email: 'new@example.com',
    phone: '9876543214'
}
```

### Changing Default Payment Amount

Edit `script.js` in `openPaymentModal()`:

```javascript
document.getElementById('paymentAmount').value = '6000'; // Change amount
```

### Adding Issue Types

Edit `index.html` in the issue form:

```html
<option value="newtype">New Type</option>
```

## 🎨 Styling

The application uses a green township theme. To customize colors, edit `style.css`:

```css
:root {
    --primary-color: #2d5016;      /* Main theme color */
    --success-color: #10b981;      /* Success/paid status */
    --warning-color: #f59e0b;      /* Warning/pending status */
    --danger-color: #ef4444;       /* Danger/high priority */
}
```

## 📱 Responsive Design

The application is fully responsive and works on:
- ✅ Desktop (1024px+)
- ✅ Tablet (768px - 1024px)
- ✅ Mobile (< 768px)

## 🔐 Security Notes

> [!WARNING]
> **This is a client-side only application**. The authentication is NOT secure for production use.

For production deployment:
- Implement proper backend authentication
- Use secure password hashing
- Add HTTPS
- Implement role-based access control on server
- Use environment variables for sensitive data

## 📝 Sample Data

The application comes with sample data:
- 1 Admin user
- 3 Resident users
- 4 Payment records
- 3 Issues
- 2 Notifications

This data is automatically loaded on first use and stored in LocalStorage.

## 🔄 Data Management

### Resetting Data

To reset to sample data:
1. Open browser DevTools (F12)
2. Go to Application → Local Storage
3. Delete all `township_*` keys
4. Refresh the page

### Exporting Data

Currently, data is stored in LocalStorage. To export:
1. Open DevTools (F12)
2. Console tab
3. Run: `console.log(JSON.stringify(localStorage))`
4. Copy the output

## 🐛 Troubleshooting

### Login Not Working
- Check username, password, and role are correct
- Clear browser cache and LocalStorage
- Use demo credentials provided

### Data Not Saving
- Check browser allows LocalStorage
- Try different browser
- Check browser console for errors

### UI Not Displaying Correctly
- Clear browser cache
- Try hard refresh (Ctrl+F5)
- Check browser compatibility

## 📦 Files

- `index.html` - Main application structure
- `style.css` - Complete styling
- `script.js` - All functionality and logic
- `README.md` - This file
- `GOOGLE_SHEETS_SETUP.md` - Google Sheets integration guide

## 🎉 Features Implemented

✅ Login page with role-based authentication  
✅ Admin dashboard with statistics  
✅ Resident dashboard with personal info  
✅ Payment tracking and management  
✅ Issue raising and management  
✅ Notification system  
✅ Responsive design  
✅ LocalStorage persistence  
✅ Sample data for testing  

## 📞 Support

For issues or questions:
1. Check this README
2. Review browser console for errors
3. Try resetting data to defaults

---

**Version**: 2.0.0  
**Last Updated**: January 26, 2026  
**Location**: `c:\Praveen\AntiGravity\Projects\Sadhbhavana`
