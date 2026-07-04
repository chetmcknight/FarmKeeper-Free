const SHEET_ID = '1aBaMvRAzlAmhbjNHNq6lQsNtKSKHV3KFvVrtmyz8188';

function handleRequest(e) {
  try {
    const data = e.postData ? JSON.parse(e.postData.contents) : e.parameter;
    const { action, entity, ...payload } = data;

    const ss = SpreadsheetApp.openById(SHEET_ID);

    // Actions that don't need an entity/sheet lookup
    if (action === 'ensureSheet') {
      const tabName = payload.tabName || 'KnowledgeBase';
      const existing = ss.getSheetByName(tabName);
      if (!existing) {
        const ns = ss.insertSheet(tabName);
        const headers = ['Topic', 'Content', 'Tags'];
        ns.getRange(1, 1, 1, headers.length).setValues([headers]);
        ns.setFrozenRows(1);
      }
      return json({ success: true });
    }

    const sheetName = entity === 'user' ? 'Users'
      : entity === 'crop' ? 'Crops'
      : entity === 'animal' ? 'Animals'
      : entity === 'farmhand' ? 'Farmhands'
      : entity === 'scout' ? 'ScoutHistory'
      : null;

    if (!sheetName) throw new Error('Unknown entity: ' + entity);

    const sheet = ss.getSheetByName(sheetName);
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

      default:
        throw new Error('Unknown action: ' + action);
    }

    return json(result);

  } catch (err) {
    return json({ success: false, error: err.message });
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  return handleRequest(e);
}

function doGet(e) {
  return handleRequest(e);
}
