import { SpreadsheetMetadata, SheetRow, SheetColumn } from '../types';

/**
 * Fetch spreadsheet metadata (title and sheet names with ids)
 */
export async function fetchSpreadsheetMetadata(
  spreadsheetId: string,
  accessToken: string
): Promise<SpreadsheetMetadata> {
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to fetch spreadsheet metadata');
  }

  const sheets = (data.sheets || []).map((s: any) => ({
    name: s.properties.title,
    index: s.properties.index,
    sheetId: s.properties.sheetId,
  }));

  return {
    id: spreadsheetId,
    title: data.properties.title,
    sheets,
  };
}

/**
 * Fetch all rows and columns for a given sheet
 */
export async function fetchSheetRows(
  spreadsheetId: string,
  sheetName: string,
  accessToken: string
): Promise<{ columns: SheetColumn[]; rows: SheetRow[] }> {
  // Read first 2000 rows, up to columns Z
  const range = `${encodeURIComponent(sheetName)}!A1:Z2000`;
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to fetch sheet rows');
  }

  const values: any[][] = data.values || [];
  if (values.length === 0) {
    return { columns: [], rows: [] };
  }

  const headers: string[] = values[0].map(h => String(h).trim()).filter(h => h !== '');
  const dataRows = values.slice(1);

  // Auto-detect column types to build custom dynamic UI inputs
  const columns: SheetColumn[] = headers.map((header, colIdx) => {
    const sampleValues = dataRows
      .map(row => row[colIdx])
      .filter(val => val !== undefined && val !== null && String(val).trim() !== '');

    let type: SheetColumn['type'] = 'text';
    let options: string[] | undefined;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = sampleValues.length > 0 && sampleValues.every(val => emailRegex.test(String(val)));

    // Check if the values look purely numeric
    const isNumber =
      sampleValues.length > 0 &&
      sampleValues.every(val => {
        const cleaned = String(val).replace(/[$,%\s]/g, '');
        return !isNaN(Number(cleaned)) && cleaned !== '';
      });

    // Check if date
    const isDate =
      sampleValues.length > 0 &&
      sampleValues.every(val => {
        const cleaned = String(val).trim();
        return (
          !isNaN(Date.parse(cleaned)) &&
          (cleaned.includes('-') || cleaned.includes('/') || cleaned.includes(','))
        );
      });

    // Check if URL
    const isUrl =
      sampleValues.length > 0 &&
      sampleValues.every(val => {
        const str = String(val).trim().toLowerCase();
        return str.startsWith('http://') || str.startsWith('https://');
      });

    // Check if we should render a dropdown list (few unique options)
    const uniqueVals = Array.from(new Set(sampleValues.map(v => String(v).trim())));
    const isSelect =
      uniqueVals.length > 0 && uniqueVals.length <= 10 && sampleValues.length >= 2;

    const lowerHeader = header.toLowerCase();
    const matchesSelectHeader =
      lowerHeader.includes('status') ||
      lowerHeader.includes('category') ||
      lowerHeader.includes('type') ||
      lowerHeader.includes('role') ||
      lowerHeader.includes('priority') ||
      lowerHeader.includes('gender') ||
      lowerHeader.includes('department');

    if (isEmail) {
      type = 'email';
    } else if (isNumber) {
      type = 'number';
    } else if (isDate) {
      type = 'date';
    } else if (isUrl) {
      type = 'url';
    } else if (isSelect || (matchesSelectHeader && uniqueVals.length > 0)) {
      type = 'select';
      options = uniqueVals;
    }

    return {
      name: header,
      type,
      options,
    };
  });

  const rows: SheetRow[] = dataRows.map((row, rIdx) => {
    const valuesMap: Record<string, string> = {};
    headers.forEach((header, colIdx) => {
      const val = row[colIdx];
      valuesMap[header] = val !== undefined && val !== null ? String(val) : '';
    });

    return {
      rowIndex: rIdx,
      values: valuesMap,
      rawValues: row.map(v => String(v)),
    };
  });

  return { columns, rows };
}

/**
 * Append a row of values to the spreadsheet
 */
export async function appendSheetRow(
  spreadsheetId: string,
  sheetName: string,
  columns: string[],
  values: Record<string, string>,
  accessToken: string
): Promise<void> {
  const range = `${encodeURIComponent(sheetName)}!A1`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;

  // Align values with columns
  const rowData = columns.map(colName => values[colName] || '');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [rowData],
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to add row to spreadsheet');
  }
}

/**
 * Update an existing row in the spreadsheet
 * rowIndex is 0-based index (of data rows, so rowIndex 0 is sheet row 2)
 */
export async function updateSheetRow(
  spreadsheetId: string,
  sheetName: string,
  rowIndex: number,
  columns: string[],
  values: Record<string, string>,
  accessToken: string
): Promise<void> {
  const rowNumber = rowIndex + 2; // Row index is 0-based data. Header is Row 1. Row index 0 is Row 2.
  const range = `${encodeURIComponent(sheetName)}!A${rowNumber}:Z${rowNumber}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;

  const rowData = columns.map(colName => values[colName] || '');

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [rowData],
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to update row in spreadsheet');
  }
}

/**
 * Delete a row in the spreadsheet using batchUpdate (deleteDimension request)
 */
export async function deleteSheetRow(
  spreadsheetId: string,
  sheetId: number,
  rowIndex: number,
  accessToken: string
): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;

  // StartIndex is inclusive, endIndex is exclusive.
  // Data rowIndex 0 corresponds to sheet row index 1 (which is sheet row 2).
  const sheetRowIndex = rowIndex + 1;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: sheetRowIndex,
              endIndex: sheetRowIndex + 1,
            },
          },
        },
      ],
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to delete row from spreadsheet');
  }
}

export async function insertRowBeforeTotal(
  spreadsheetId: string,
  sheetId: number,
  sheetName: string,
  totalSheetRowNumber: number, // 1-based sheet row number where "TOTAL" currently sits
  columns: string[],
  values: Record<string, string>,
  accessToken: string
): Promise<void> {
  const insertIndex = totalSheetRowNumber - 1; // 0-based row index to insert AT, pushing TOTAL down

  const insertResp = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          insertDimension: {
            range: { sheetId, dimension: 'ROWS', startIndex: insertIndex, endIndex: insertIndex + 1 },
            inheritFromBefore: true, // copies formatting from the row above (your last real data row)
          },
        }],
      }),
    }
  );
  const insertData = await insertResp.json();
  if (!insertResp.ok) throw new Error(insertData.error?.message || 'Failed to insert row before TOTAL');

  const rowNumber = insertIndex + 1; // back to 1-based
  const range = `${encodeURIComponent(sheetName)}!A${rowNumber}:Z${rowNumber}`;
  const rowData = columns.map(colName => values[colName] || '');

  const writeResp = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [rowData] }),
    }
  );
  const writeData = await writeResp.json();
  if (!writeResp.ok) throw new Error(writeData.error?.message || 'Failed to write values into new row');
}
