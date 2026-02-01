# Google Sheets Setup Guide

## Quick Setup Instructions

Your Google Sheet: [Township Maintenance Data](https://docs.google.com/spreadsheets/d/1lT0hQ-vdYMnYKiTQ_EeaUkZwLJaL87niz6qbos75nuU/edit?usp=sharing)

### Step 1: Prepare Your Google Sheet

1. **Open your Google Sheet** using the link above
2. **Set up the header row** (Row 1) with these exact column names:
   ```
   ID | Location | Issue | Status | Priority | Last Updated | Type
   ```

3. **Add sample data** (optional) - here's an example:
   ```
   light-1 | Street Light 1 | Not working | pending | high | 2026-01-26 | streetlight
   water-1 | North Water Line | Leakage | in-progress | high | 2026-01-26 | water
   ```

### Step 2: Publish Sheet as CSV (For Read Access)

1. In your Google Sheet, click **File → Share → Publish to web**
2. In the dialog:
   - **Link**: Select the specific sheet (usually "Sheet1")
   - **Published content and settings**: Choose "Comma-separated values (.csv)"
3. Click **Publish**
4. **Copy the published URL** (it should look like: `https://docs.google.com/spreadsheets/d/e/...../pub?output=csv`)

✅ **The CSV URL is already configured in `script.js`** - the app will automatically fetch data from your sheet!

### Step 3: Set Up Apps Script (For Write Access - Admin Features)

This enables the app to save changes back to Google Sheets.

1. **Open your Google Sheet**
2. Click **Extensions → Apps Script**
3. **Delete any existing code** in the editor
4. **Copy and paste** the entire contents of `google-apps-script.js` file
5. Click the **💾 Save** icon (or Ctrl+S)
6. Click **Deploy → New deployment**
7. Click the **⚙️ gear icon** next to "Select type"
8. Choose **Web app**
9. Configure the deployment:
   - **Description**: Township Maintenance API
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
10. Click **Deploy**
11. **Authorize the script**:
    - Click "Authorize access"
    - Choose your Google account
    - Click "Advanced" → "Go to [Project Name] (unsafe)"
    - Click "Allow"
12. **Copy the Web app URL** (looks like: `https://script.google.com/macros/s/...../exec`)

### Step 4: Update the Application

1. **Open** `script.js` in the Sadhbhavana folder
2. **Find** the line with `APPS_SCRIPT_URL`
3. **Replace** `'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE'` with your copied URL:
   ```javascript
   APPS_SCRIPT_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
   ```
4. **Save** the file

### Step 5: Test the Integration

1. **Open** `index.html` in your browser
2. The app should load data from your Google Sheet
3. **Login as admin** (password: `admin123`)
4. **Add or edit an issue**
5. **Check your Google Sheet** - the changes should appear!

## Data Format Reference

### Column Details

| Column | Description | Valid Values | Example |
|--------|-------------|--------------|---------|
| ID | Unique identifier matching map element | Any unique string | `light-1`, `plot-A1` |
| Location | Display name of location | Any text | `Street Light 1` |
| Issue | Description of the problem | Any text | `Not working` |
| Status | Current status | `pending`, `in-progress`, `resolved` | `pending` |
| Priority | Issue priority | `low`, `medium`, `high` | `high` |
| Last Updated | Date of last update | YYYY-MM-DD format | `2026-01-26` |
| Type | Category of issue | `water`, `electricity`, `road`, `garbage`, `security`, `drainage`, `streetlight`, `park` | `streetlight` |

### Map Element IDs

Make sure the **ID** column matches these map element IDs:

**Roads:**
- `road-1` (Main Road)
- `road-2` (Central Avenue)
- `road-3` (West Lane)
- `road-4` (East Lane)

**Plots:**
- `plot-A1`, `plot-A2`, `plot-A3`, `plot-A4`
- `plot-B1`, `plot-B2`, `plot-B3`, `plot-B4`
- `plot-C1`, `plot-C2`, `plot-C3`, `plot-C4`
- `plot-D1`, `plot-D2`, `plot-D3`, `plot-D4`

**Parks:**
- `park-1` (Central Park)
- `park-2` (Community Garden)

**Street Lights:**
- `light-1` through `light-6`

**Water Lines:**
- `water-1` (North Water Line)
- `water-2` (South Water Line)
- `water-3` (West Water Line)
- `water-4` (East Water Line)

**Drainage:**
- `drain-1`, `drain-2`, `drain-3`

## Troubleshooting

### Data not loading from Google Sheets

1. **Check sheet is published**: File → Share → Publish to web
2. **Verify CSV URL** in `script.js` matches your published URL
3. **Check browser console** (F12) for error messages
4. **Make sure sheet has data** with proper headers

### Changes not saving to Google Sheets

1. **Verify Apps Script is deployed** as a web app
2. **Check APPS_SCRIPT_URL** in `script.js` is correct
3. **Re-authorize the script** if needed (Deploy → Manage deployments → Edit → Re-authorize)
4. **Check Apps Script logs**: Extensions → Apps Script → Executions

### Permission errors

1. **Make sure sheet is shared** with appropriate permissions
2. **Re-deploy the Apps Script** with "Anyone" access
3. **Clear browser cache** and try again

## Advanced: Using Google Sheets API

If you prefer using the Google Sheets API instead of CSV:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable **Google Sheets API**
4. Create credentials (API Key)
5. Update `script.js`:
   ```javascript
   API_KEY: 'your-api-key-here'
   ```

Note: The sheet ID is already configured: `1lT0hQ-vdYMnYKiTQ_EeaUkZwLJaL87niz6qbos75nuU`

---

**Need Help?** Check the main README.md for more detailed troubleshooting steps.
