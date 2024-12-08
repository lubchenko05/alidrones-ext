function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    const sheetData = sheet.getDataRange().getValues();
    const headerRow = sheetData.shift();

    const columnIndexes = {
      id: headerRow.indexOf("Order ID"),
      name: headerRow.indexOf("Name"),
      status: headerRow.indexOf("Status"),
      store: headerRow.indexOf("Store"),
      dateAdded: headerRow.indexOf("Date Added"),
      dateUpdated: headerRow.indexOf("Date Updated"),
      trackingNumbers: headerRow.indexOf("Tracking Numbers"),
      quantity: headerRow.indexOf("Quantity"),
      unitPrice: headerRow.indexOf("Unit Price"),
      totalPrice: headerRow.indexOf("Total Price"),
      email: headerRow.indexOf("Email"),
      orderDate: headerRow.indexOf("Order Date"),
    };

    const currentDate = new Date();

    data.forEach(order => {
      const uniqueKey = `${order.id}_${order.name}`;
      let rowToUpdate = null;

      for (let i = 0; i < sheetData.length; i++) {
        const existingId = sheetData[i][columnIndexes.id];
        const existingName = sheetData[i][columnIndexes.name];
        const existingKey = `${existingId}_${existingName}`;

        if (existingKey === uniqueKey) {
          rowToUpdate = i + 2;
          break;
        }
      }

      if (rowToUpdate) {
        sheet.getRange(rowToUpdate, columnIndexes.status + 1).setValue(order.status);
        sheet.getRange(rowToUpdate, columnIndexes.dateUpdated + 1).setValue(currentDate);

        const existingTrackingNumbers = sheet.getRange(rowToUpdate, columnIndexes.trackingNumbers + 1).getValue();
        const newTrackingNumbers = order.trackingNumbers || "N/A";
        if (newTrackingNumbers !== "N/A") {
          sheet.getRange(rowToUpdate, columnIndexes.trackingNumbers + 1).setValue(newTrackingNumbers);
        } else {
          sheet.getRange(rowToUpdate, columnIndexes.trackingNumbers + 1).setValue(existingTrackingNumbers);
        }

        sheet.getRange(rowToUpdate, columnIndexes.quantity + 1).setValue(order.quantity);
        sheet.getRange(rowToUpdate, columnIndexes.unitPrice + 1).setValue(order.pricePerUnit);
        sheet.getRange(rowToUpdate, columnIndexes.totalPrice + 1).setValue(order.total);
        sheet.getRange(rowToUpdate, columnIndexes.store + 1).setValue(order.store);
      } else {
        const newRow = [];
        newRow[columnIndexes.id] = order.id;
        newRow[columnIndexes.orderDate] = order.date;
        newRow[columnIndexes.status] = order.status;
        newRow[columnIndexes.name] = order.name;
        newRow[columnIndexes.email] = order.email;
        newRow[columnIndexes.dateAdded] = currentDate;
        newRow[columnIndexes.dateUpdated] = currentDate;
        newRow[columnIndexes.trackingNumbers] = order.trackingNumbers || "N/A";
        newRow[columnIndexes.quantity] = order.quantity;
        newRow[columnIndexes.unitPrice] = order.pricePerUnit;
        newRow[columnIndexes.totalPrice] = order.total;
        newRow[columnIndexes.store] = order.store;
        sheet.appendRow(newRow);
      }
    });

    const response = {
      success: true,
      message: "Data processed."
    };

    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON)
      .getContent();

  } catch (error) {
    const errorResponse = {
      success: false,
      error: error.message
    };
    
     return ContentService.createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON)
      .getContent();
  }
}