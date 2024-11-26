# AliExporter Extension for Google Chrome

AliExporter is a Chrome extension designed to help streamline the process of syncing your AliExpress orders with a Google Sheet. This tool is especially useful for managing and tracking orders efficiently.

---

## How to Use

### 1. Install the Extension
1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer Mode** (toggle in the top-right corner).
3. Click **Load Unpacked** and select the `src` directory of this project.

---

### 2. Set Up Google Sheet
1. Create a Google Sheet with the following headers:

Order ID | Status | Name | Tracking Numbers | Order Date | Unit Price | Quantity | Total Price | Email | Date Added | Date Updated

---

### 3. Configure Google Apps Script
1. Go to your Google Sheets:
- Click on **Extensions** > **Apps Script**.
2. Copy the code from `app_script.gs` (included in this repository) into the Apps Script editor.
3. Deploy the script:
- Press **Deploy** > **New Deployment** > **Web App**.
- Set:
  - **Execute as**: Me
  - **Who has access**: Anyone with a Google account
- Copy the **Deployment ID** (this will be used as the Token in the extension).

---

### 4. Use the Extension
1. Open the extension popup.
2. Paste the **Deployment ID** (Token) into the input field.
3. Navigate to the AliExpress order page: [AliExpress Orders](https://www.aliexpress.com/p/order/index.html).
4. Click the **Sync Orders** button.

---

### 5. Results
Your AliExpress orders will now be synced to the Google Sheet you created.

---

## Features
- Automatically fetches and updates order details, including:
- Order ID, Status, Product Name, Tracking Numbers, Prices, Quantities, Dates, and Email.
- Ensures data integrity by preserving tracking numbers if they are unavailable in the latest sync.

---

## Notes
- Ensure that you have enabled permissions for the extension in your browser.
- The extension and Google Apps Script are designed to work seamlessly together.

Enjoy easier order management with **AliDrones**!