const SHEET_ID = '1aBaMvRAzlAmhbjNHNq6lQsNtKSKHV3KFvVrtmyz8188';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const { action, entity, ...payload } = data;

    const sheetName = entity === 'user' ? 'Users'
      : entity === 'crop' ? 'Crops'
      : entity === 'animal' ? 'Animals'
      : entity === 'farmhand' ? 'Farmhands'
      : entity === 'scout' ? 'ScoutHistory'
      : null;

    if (!sheetName) throw new Error('Unknown entity: ' + entity);

    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(sheetName);
    const rows = sheet.getDataRange().getValues();
    const header = rows[0] || [];
    const isRowMatch = (row, id) => row[0] && row[0].toString() === id;

    let result;
    switch (action) {
      case 'append': {
        const newRow = header.map(col => {
          const val = payload[col];
          return val !== undefined && val !== null ? (typeof val === 'object' ? JSON.stringify(val) : String(val)) : '';
        });
        sheet.appendRow(newRow);
        result = { success: true };
        break;
      }

      case 'update': {
        const id = payload.id;
        if (!id) throw new Error('Missing id for update');
        for (let i = 1; i < rows.length; i++) {
          if (isRowMatch(rows[i], id)) {
            header.forEach((col, j) => {
              if (col && payload[col] !== undefined) {
                const val = payload[col];
                sheet.getRange(i + 1, j + 1).setValue(
                  typeof val === 'object' ? JSON.stringify(val) : String(val)
                );
              }
            });
            break;
          }
        }
        result = { success: true };
        break;
      }

      case 'delete': {
        const id = payload.id;
        if (!id) throw new Error('Missing id for delete');
        for (let i = rows.length - 1; i >= 1; i--) {
          if (isRowMatch(rows[i], id)) {
            sheet.deleteRow(i + 1);
          }
        }
        result = { success: true };
        break;
      }

      case 'register': {
        const existing = rows.slice(1).map(r => r[1] || '');
        if (existing.some(e => e === payload.email)) {
          throw new Error('Account already exists');
        }
        const newRow = header.map(col => payload[col] || '');
        sheet.appendRow(newRow);
        result = { success: true, user: payload };
        break;
      }

      case 'findUser': {
        const users = rows.slice(1).map(r => ({
          id: r[0] || '', email: r[1] || '', name: r[2] || '', imageUrl: r[3] || undefined
        })).filter(u => u.id);
        const found = users.find(u => u.email === payload.email);
        result = found ? { success: true, user: found } : { success: false, error: 'User not found' };
        break;
      }

      case 'clearAndWrite': {
        const dataRows = payload.rows || [];
        sheet.clearContents();
        if (dataRows.length > 0) {
          sheet.getRange(1, 1, dataRows.length, dataRows[0].length).setValues(dataRows);
        }
        result = { success: true };
        break;
      }

      default:
        throw new Error('Unknown action: ' + action);
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ error: 'Use POST' }))
    .setMimeType(ContentService.MimeType.JSON);
}
