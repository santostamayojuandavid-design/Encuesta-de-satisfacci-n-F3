import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'sheet-config.json');
const RESPONSES_FILE = path.join(DATA_DIR, 'responses.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default configuration
const DEFAULT_CONFIG = {
  spreadsheetId: '1c6oQABMrZ0mqYwZ9_yjXm0KDXChpjMw4BloY6KVoudo',
  sheetName: 'Encuesta F3',
  webhookUrl: '',
};

function readConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('Error reading config file:', err);
  }
  return DEFAULT_CONFIG;
}

function saveConfig(config: typeof DEFAULT_CONFIG) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving config file:', err);
  }
}

const INITIAL_RESPONSES = [
  {
    id: 'sample-1',
    timestamp: '27/10/2026 20:22:51',
    q1_relationship: 'Instructor(a)',
    q2_frequency: 'Varias veces a la semana',
    q3_facilities: 4,
    q4_cleanliness: 4,
    q5_equipment: 4,
    q6_comfort: 4,
    q7_availability: 4,
    q8_overall: 4,
    q9_aspectsToImprove: [
      'Infraestructura e instalaciones',
      'Equipos y recursos disponibles (PCs, monitores, teclados)',
      'Disponibilidad y horarios de uso',
    ],
    q10_suggestions: 'Ampliar la disponibilidad en jornada nocturna.',
    syncedToGoogleSheets: true,
  },
  {
    id: 'sample-2',
    timestamp: '27/10/2026 21:04:19',
    q1_relationship: 'Aprendiz',
    q2_frequency: 'Diariamente',
    q3_facilities: 5,
    q4_cleanliness: 5,
    q5_equipment: 4,
    q6_comfort: 5,
    q7_availability: 5,
    q8_overall: 5,
    q9_aspectsToImprove: ['Conectividad a Internet / Velocidad de red'],
    q10_suggestions: 'Excelente ambiente de aprendizaje, mantener el aire acondicionado a temperatura constante.',
    syncedToGoogleSheets: true,
  },
];

function readResponses() {
  try {
    if (fs.existsSync(RESPONSES_FILE)) {
      const data = fs.readFileSync(RESPONSES_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading responses file:', err);
  }
  return INITIAL_RESPONSES;
}

function saveResponses(responses: unknown[]) {
  try {
    fs.writeFileSync(RESPONSES_FILE, JSON.stringify(responses, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving responses file:', err);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // 1. Get current configuration
  app.get('/api/config', (_req: Request, res: Response) => {
    const config = readConfig();
    res.json({
      ...config,
      isConnected: Boolean(config.webhookUrl),
    });
  });

  // 2. Save configuration (Shared across all devices)
  app.post('/api/config', (req: Request, res: Response) => {
    const current = readConfig();
    const updated = {
      spreadsheetId: req.body.spreadsheetId || current.spreadsheetId,
      sheetName: req.body.sheetName || current.sheetName,
      webhookUrl: typeof req.body.webhookUrl === 'string' ? req.body.webhookUrl.trim() : current.webhookUrl,
    };
    saveConfig(updated);
    res.json({
      success: true,
      message: 'Configuración guardada permanentemente para todos los equipos',
      config: {
        ...updated,
        isConnected: Boolean(updated.webhookUrl),
      },
    });
  });

  // 3. Get all responses
  app.get('/api/responses', (_req: Request, res: Response) => {
    const responses = readResponses();
    res.json(responses);
  });

  // 4. Submit survey response without requiring any login
  app.post('/api/submit', async (req: Request, res: Response) => {
    try {
      const config = readConfig();
      const body = req.body;

      // Format timestamp in Colombia timezone (UTC-5)
      const now = new Date();
      const rawTimestamp = new Intl.DateTimeFormat('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'America/Bogota',
      }).format(now);
      const timestamp = rawTimestamp.replace(',', '');

      const aspectsArray = Array.isArray(body.q9_aspectsToImprove) ? body.q9_aspectsToImprove : [];
      let aspectsText = aspectsArray.join(', ');
      if (body.q9_otherText && body.q9_otherText.trim()) {
        aspectsText = aspectsText
          ? `${aspectsText}, Otro: ${body.q9_otherText.trim()}`
          : `Otro: ${body.q9_otherText.trim()}`;
      }

      const responseObj = {
        id: `resp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp,
        q1_relationship: body.q1_relationship || '',
        q2_frequency: body.q2_frequency || '',
        q3_facilities: Number(body.q3_facilities) || 0,
        q4_cleanliness: Number(body.q4_cleanliness) || 0,
        q5_equipment: Number(body.q5_equipment) || 0,
        q6_comfort: Number(body.q6_comfort) || 0,
        q7_availability: Number(body.q7_availability) || 0,
        q8_overall: Number(body.q8_overall) || 0,
        q9_aspectsToImprove: aspectsArray,
        q9_otherText: body.q9_otherText || '',
        q10_suggestions: body.q10_suggestions || '',
        syncedToGoogleSheets: false,
      };

      let forwardSuccess = false;
      let forwardError = '';

      // If Webhook URL is set, transmit directly to Google Sheets Apps Script
      if (config.webhookUrl && config.webhookUrl.startsWith('https://script.google.com/')) {
        try {
          const payload = {
            action: 'submitSurvey',
            sheetName: config.sheetName || 'Encuesta F3',
            spreadsheetId: config.spreadsheetId,
            timestamp,
            q1: responseObj.q1_relationship,
            q2: responseObj.q2_frequency,
            q3: responseObj.q3_facilities,
            q4: responseObj.q4_cleanliness,
            q5: responseObj.q5_equipment,
            q6: responseObj.q6_comfort,
            q7: responseObj.q7_availability,
            q8: responseObj.q8_overall,
            q9: aspectsText,
            q10: responseObj.q10_suggestions,
          };

          const gsRes = await fetch(config.webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          if (gsRes.ok) {
            forwardSuccess = true;
          } else {
            console.warn('Google Apps Script response status:', gsRes.status);
            // Even if response has redirect or opaque, mark success if status < 400
            if (gsRes.status < 400) {
              forwardSuccess = true;
            }
          }
        } catch (fetchErr: unknown) {
          console.error('Error forwarding to Google Apps Script:', fetchErr);
          forwardError = fetchErr instanceof Error ? fetchErr.message : 'Error al contactar Apps Script';
        }
      }

      responseObj.syncedToGoogleSheets = forwardSuccess;

      // Save locally on server
      const currentResponses = readResponses();
      const updatedResponses = [responseObj, ...currentResponses];
      saveResponses(updatedResponses);

      res.json({
        success: true,
        response: responseObj,
        syncedToGoogleSheets: forwardSuccess,
        message: forwardSuccess
          ? `Respuesta registrada exitosamente en Google Sheets ("${config.sheetName}") y guardada en el servidor.`
          : config.webhookUrl
          ? `Guardada en el servidor. Advertencia al enviar a Google Sheets: ${forwardError}`
          : `Respuesta guardada localmente en el servidor para la hoja "${config.sheetName}". Configura la URL del Webhook para sincronizar en tiempo real con Google Sheets.`,
      });
    } catch (err: unknown) {
      console.error('Error in /api/submit:', err);
      res.status(500).json({
        success: false,
        message: err instanceof Error ? err.message : 'Error interno al procesar respuesta',
      });
    }
  });

  // 5. Test Webhook Connection
  app.post('/api/test-webhook', async (req: Request, res: Response) => {
    const url = req.body.url;
    if (!url || !url.startsWith('https://script.google.com/')) {
      return res.status(400).json({
        success: false,
        message: 'Por favor ingresa una URL válida que empiece por https://script.google.com/',
      });
    }

    try {
      const pingRes = await fetch(url, {
        method: 'GET',
      });
      const text = await pingRes.text().catch(() => '');
      return res.json({
        success: pingRes.status < 400,
        status: pingRes.status,
        message: pingRes.status < 400
          ? '¡Conexión verificada con Google Apps Script! El servicio responde correctamente.'
          : `Respuesta del script: Código ${pingRes.status}`,
        details: text.slice(0, 150),
      });
    } catch (err: unknown) {
      return res.status(500).json({
        success: false,
        message: err instanceof Error ? err.message : 'No se pudo conectar a la URL del Webhook',
      });
    }
  });

  // Mount Vite middleware in development
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
