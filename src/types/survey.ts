export interface SurveyResponse {
  id: string;
  timestamp: string; // Formatted e.g. "27/10/2026 20:22:51"
  q1_relationship: string;
  q2_frequency: string;
  q3_facilities: number;
  q4_cleanliness: number;
  q5_equipment: number;
  q6_comfort: number;
  q7_availability: number;
  q8_overall: number;
  q9_aspectsToImprove: string[];
  q9_otherText?: string;
  q10_suggestions: string;
  syncedToGoogleSheets?: boolean;
}

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  sheetName: string;
  webhookUrl?: string;
}

export interface SheetHeaderStatus {
  sheetFound: boolean;
  hasHeaders: boolean;
  rowCount?: number;
}
