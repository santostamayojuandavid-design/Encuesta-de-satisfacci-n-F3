import { SurveyResponse } from '../types/survey.ts';

export const DEFAULT_SPREADSHEET_ID = '1c6oQABMrZ0mqYwZ9_yjXm0KDXChpjMw4BloY6KVoudo';
export const DEFAULT_SHEET_NAME = 'Encuesta F3';

export const SURVEY_HEADERS = [
  'Marca temporal',
  '1. ¿Cuál es tu relación con el Centro Agropecuario de Buga?',
  '2. ¿Con qué frecuencia utilizas el ambiente F3?',
  '3. ¿Qué tan satisfecho(a) estás con el estado general de las instalaciones del ambiente F3?',
  '4. ¿Qué tan satisfecho(a) estás con la limpieza y el orden del ambiente F3?',
  '5. ¿Qué tan satisfecho(a) estás con el estado y funcionamiento de los equipos y recursos disponibles?',
  '6. ¿Qué tan satisfecho(a) estás con la comodidad, iluminación y ventilación del ambiente?',
  '7. ¿Qué tan satisfecho(a) estás con la disponibilidad del ambiente para desarrollar tus actividades?',
  '8. En general, ¿qué tan satisfecho(a) estás con el uso del ambiente F3?',
  '9. ¿Qué aspectos del ambiente F3 consideras que se deben mejorar?',
  '10. ¿Qué sugerencias tienes para mejorar el ambiente F3?',
];

export function extractSpreadsheetId(input: string): string {
  if (!input) return DEFAULT_SPREADSHEET_ID;
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

export interface SpreadsheetVerification {
  title: string;
  sheetExists: boolean;
  sheetsList: string[];
  headersConfigured: boolean;
}

export async function verifyAndPrepareSpreadsheet(
  spreadsheetId: string = DEFAULT_SPREADSHEET_ID,
  accessToken: string,
  targetSheetName = DEFAULT_SHEET_NAME
): Promise<SpreadsheetVerification> {
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!metaRes.ok) {
    const errorData = await metaRes.json().catch(() => null);
    const msg = errorData?.error?.message || `Error HTTP ${metaRes.status}`;
    throw new Error(`No se pudo acceder a la hoja de cálculo: ${msg}`);
  }

  const metaData = await metaRes.json();
  const sheets: Array<{ properties: { title: string; sheetId: number } }> =
    metaData.sheets || [];
  const sheetsList = sheets.map((s) => s.properties.title);
  let sheetExists = sheetsList.includes(targetSheetName);

  // If "Encuesta IA" doesn't exist, create it via batchUpdate
  if (!sheetExists) {
    const addSheetRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: {
                  title: targetSheetName,
                  gridProperties: {
                    frozenRowCount: 1,
                  },
                },
              },
            },
          ],
        }),
      }
    );

    if (addSheetRes.ok) {
      sheetExists = true;
      sheetsList.push(targetSheetName);
    }
  }

  // Check if header row exists
  let headersConfigured = false;
  try {
    const checkHeaderRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(
        targetSheetName
      )}'!A1:K1`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (checkHeaderRes.ok) {
      const headerData = await checkHeaderRes.json();
      if (headerData.values && headerData.values.length > 0 && headerData.values[0].length >= 5) {
        headersConfigured = true;
      }
    }
  } catch (e) {
    console.warn('No se pudo verificar el encabezado existente:', e);
  }

  // If headers not configured, insert them
  if (!headersConfigured) {
    await ensureHeaders(spreadsheetId, accessToken, targetSheetName);
    headersConfigured = true;
  }

  return {
    title: metaData.properties?.title || 'Hoja de Cálculo',
    sheetExists,
    sheetsList,
    headersConfigured,
  };
}

export async function ensureHeaders(
  spreadsheetId: string = DEFAULT_SPREADSHEET_ID,
  accessToken: string,
  targetSheetName = DEFAULT_SHEET_NAME
): Promise<void> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(
      targetSheetName
    )}'!A1:K1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [SURVEY_HEADERS],
      }),
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(
      `Error al escribir encabezados en '${targetSheetName}': ${
        errorData?.error?.message || res.statusText
      }`
    );
  }
}

export function formatResponseRow(response: SurveyResponse): (string | number)[] {
  let aspects = response.q9_aspectsToImprove.join(', ');
  if (response.q9_otherText && response.q9_otherText.trim()) {
    aspects = aspects
      ? `${aspects}, Otro: ${response.q9_otherText.trim()}`
      : `Otro: ${response.q9_otherText.trim()}`;
  }

  return [
    response.timestamp,
    response.q1_relationship,
    response.q2_frequency,
    response.q3_facilities,
    response.q4_cleanliness,
    response.q5_equipment,
    response.q6_comfort,
    response.q7_availability,
    response.q8_overall,
    aspects,
    response.q10_suggestions || '',
  ];
}

export async function appendToGoogleSheet(
  spreadsheetId: string = DEFAULT_SPREADSHEET_ID,
  accessToken: string,
  response: SurveyResponse,
  targetSheetName = DEFAULT_SHEET_NAME
): Promise<{ updatedRows: number; updatedRange: string }> {
  const rowValues = formatResponseRow(response);

  const range = `'${encodeURIComponent(targetSheetName)}'!A:K`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [rowValues],
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(
      errorData?.error?.message ||
        `Error ${res.status}: No se pudo agregar la fila a la hoja ${targetSheetName}`
    );
  }

  const data = await res.json();
  return {
    updatedRows: data.updates?.updatedRows || 1,
    updatedRange: data.updates?.updatedRange || `${targetSheetName}!A...`,
  };
}

export async function sendViaAppsScriptWebhook(
  webhookUrl: string,
  response: SurveyResponse,
  targetSheetName = DEFAULT_SHEET_NAME
): Promise<{ success: boolean; message: string }> {
  const row = formatResponseRow(response);
  const payload = {
    action: 'submitSurvey',
    sheetName: targetSheetName,
    spreadsheetId: DEFAULT_SPREADSHEET_ID,
    timestamp: response.timestamp,
    q1: response.q1_relationship,
    q2: response.q2_frequency,
    q3: response.q3_facilities,
    q4: response.q4_cleanliness,
    q5: response.q5_equipment,
    q6: response.q6_comfort,
    q7: response.q7_availability,
    q8: response.q8_overall,
    q9: row[9],
    q10: response.q10_suggestions,
    rowData: row,
  };

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
    mode: 'no-cors', // Standard Google Apps Script Web App redirect
  });

  return {
    success: true,
    message: 'Respuesta transmitida mediante Google Apps Script Webhook',
  };
}
