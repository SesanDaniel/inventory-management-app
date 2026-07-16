export interface SheetInfo {
  name: string;
  index: number;
  sheetId: number;
}

export interface SpreadsheetMetadata {
  id: string;
  title: string;
  sheets: SheetInfo[];
}

export interface SheetRow {
  rowIndex: number; // 0-based index of the row in the sheet (excluding header, so row 2 in Sheets is index 0)
  values: Record<string, string>;
  rawValues: string[];
}

export interface SheetColumn {
  name: string;
  type: 'text' | 'number' | 'date' | 'email' | 'url' | 'select';
  options?: string[]; // Auto-detected options for select dropdown
}

export type AppTab = 'data' | 'charts' | 'settings';

export type ViewMode = 'list' | 'detail' | 'add' | 'addMovement' | 'edit';
