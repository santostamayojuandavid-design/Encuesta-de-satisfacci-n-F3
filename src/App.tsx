import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
} from './firebase.ts';
import {
  appendToGoogleSheet,
  sendViaAppsScriptWebhook,
  DEFAULT_SPREADSHEET_ID,
  DEFAULT_SHEET_NAME,
} from './services/sheetsService.ts';
import { SurveyResponse } from './types/survey.ts';
import { Header } from './components/Header.tsx';
import { SurveyForm } from './components/SurveyForm.tsx';
import { GoogleSheetsSettings } from './components/GoogleSheetsSettings.tsx';
import { HtmlExporter } from './components/HtmlExporter.tsx';
import { AnalyticsView } from './components/AnalyticsView.tsx';

const INITIAL_RESPONSES: SurveyResponse[] = [
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

export default function App() {
  const [activeTab, setActiveTab] = useState<'survey' | 'sheets' | 'html' | 'analytics'>('survey');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Configuration state with fixed default ID and sheet name
  const [spreadsheetInput, setSpreadsheetInput] = useState<string>(() => {
    return localStorage.getItem('cab_f3_spreadsheet_input') || DEFAULT_SPREADSHEET_ID;
  });
  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    return localStorage.getItem('cab_f3_spreadsheet_id') || DEFAULT_SPREADSHEET_ID;
  });
  const [sheetVerified, setSheetVerified] = useState<boolean>(() => {
    return true; // Default sheet is verified by definition
  });
  const [webhookUrl, setWebhookUrl] = useState<string>(() => {
    return localStorage.getItem('cab_f3_webhook_url') || '';
  });

  // Responses state
  const [responses, setResponses] = useState<SurveyResponse[]>(() => {
    const saved = localStorage.getItem('cab_f3_responses');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Error parsing cached responses:', e);
      }
    }
    return INITIAL_RESPONSES;
  });

  // Global notification banner
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Load shared server configuration and responses on mount
  useEffect(() => {
    async function fetchServerData() {
      try {
        const configRes = await fetch('/api/config');
        if (configRes.ok) {
          const cfg = await configRes.json();
          if (cfg.spreadsheetId) setSpreadsheetId(cfg.spreadsheetId);
          if (cfg.spreadsheetId) setSpreadsheetInput(cfg.spreadsheetId);
          if (cfg.webhookUrl) {
            setWebhookUrl(cfg.webhookUrl);
            setSheetVerified(true);
          }
        }

        const respRes = await fetch('/api/responses');
        if (respRes.ok) {
          const list = await respRes.json();
          if (Array.isArray(list) && list.length > 0) {
            setResponses(list);
          }
        }
      } catch (err) {
        console.warn('Could not sync with server endpoint on mount:', err);
      }
    }
    fetchServerData();
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('cab_f3_responses', JSON.stringify(responses));
  }, [responses]);

  useEffect(() => {
    if (spreadsheetInput) localStorage.setItem('cab_f3_spreadsheet_input', spreadsheetInput);
    if (spreadsheetId) localStorage.setItem('cab_f3_spreadsheet_id', spreadsheetId);
    localStorage.setItem('cab_f3_sheet_verified', String(sheetVerified));
    if (webhookUrl) localStorage.setItem('cab_f3_webhook_url', webhookUrl);
  }, [spreadsheetInput, spreadsheetId, sheetVerified, webhookUrl]);

  // Firebase auth initialization
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setNotification(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setNotification({
          type: 'success',
          message: `Conectado como ${result.user.displayName || result.user.email} con permisos para Google Sheets.`,
        });
      }
    } catch (err: unknown) {
      console.error('Login error:', err);
      const msg = err instanceof Error ? err.message : 'Error al conectar con Google';
      setNotification({
        type: 'error',
        message: `No se pudo iniciar sesión con Google: ${msg}`,
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setNotification({
      type: 'info',
      message: 'Sesión de Google cerrada.',
    });
  };

  const handleSavePermanentWebhook = async (url: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId: DEFAULT_SPREADSHEET_ID,
          sheetName: DEFAULT_SHEET_NAME,
          webhookUrl: url,
        }),
      });
      if (res.ok) {
        setWebhookUrl(url);
        setSheetVerified(true);
        setNotification({
          type: 'success',
          message: '¡Conexión permanente guardada! Ahora todos los equipos de la sala F3 enviarán respuestas a la hoja "Encuesta F3" sin requerir inicio de sesión.',
        });
        return true;
      }
    } catch (err) {
      console.error('Error saving permanent webhook:', err);
    }
    return false;
  };

  const handleSubmitSurvey = async (
    data: Omit<SurveyResponse, 'id' | 'timestamp' | 'syncedToGoogleSheets'>
  ): Promise<boolean> => {
    setIsSubmitting(true);
    setNotification(null);

    // Primary: Submit to server route (zero-login on any computer)
    try {
      const serverRes = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (serverRes.ok) {
        const result = await serverRes.json();
        if (result.success && result.response) {
          // If admin token is also active in this browser, ensure direct append as backup
          if (token && spreadsheetId) {
            appendToGoogleSheet(spreadsheetId, token, result.response, DEFAULT_SHEET_NAME).catch(() => {});
          }

          setResponses((prev) => [result.response, ...prev.filter((r) => r.id !== result.response.id)]);
          setIsSubmitting(false);
          setNotification({
            type: 'success',
            message: result.message || `¡Respuesta registrada exitosamente en la pestaña "${DEFAULT_SHEET_NAME}"!`,
          });
          return true;
        }
      }
    } catch (serverErr) {
      console.warn('Server submit attempt had an issue, fallback to client:', serverErr);
    }

    // Fallback client append if server route was offline
    const now = new Date();
    const dateFormatted = new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'America/Bogota',
    }).format(now);

    const newResponse: SurveyResponse = {
      ...data,
      id: `resp-${Date.now()}`,
      timestamp: dateFormatted,
      syncedToGoogleSheets: false,
    };

    let sheetsSuccess = false;
    const targetId = spreadsheetId || DEFAULT_SPREADSHEET_ID;

    if (token) {
      try {
        await appendToGoogleSheet(targetId, token, newResponse, DEFAULT_SHEET_NAME);
        sheetsSuccess = true;
      } catch (err: unknown) {
        console.error('Error al guardar en Google Sheets:', err);
      }
    }

    if (webhookUrl) {
      try {
        await sendViaAppsScriptWebhook(webhookUrl, newResponse, DEFAULT_SHEET_NAME);
        sheetsSuccess = true;
      } catch (whErr) {
        console.warn('Webhook error:', whErr);
      }
    }

    newResponse.syncedToGoogleSheets = sheetsSuccess;
    setResponses((prev) => [newResponse, ...prev]);
    setIsSubmitting(false);

    setNotification({
      type: sheetsSuccess ? 'success' : 'info',
      message: sheetsSuccess
        ? `¡Respuesta registrada en la pestaña "${DEFAULT_SHEET_NAME}" de Google Sheets!`
        : `Respuesta guardada para la hoja "${DEFAULT_SHEET_NAME}".`,
    });
    return true;
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      
      {/* Navigation & Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        spreadsheetId={spreadsheetId}
        sheetVerified={sheetVerified}
        onOpenSheetsTab={() => setActiveTab('sheets')}
      />

      {/* Global Notification Banner */}
      {notification && (
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 pt-4">
          <div
            className={`p-3.5 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between shadow-xs ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-950 border border-emerald-300'
                : notification.type === 'error'
                ? 'bg-rose-50 text-rose-950 border border-rose-300'
                : 'bg-sky-50 text-sky-950 border border-sky-300'
            }`}
          >
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-500 hover:text-slate-800 text-xs font-bold ml-3 px-2 py-0.5 rounded-md hover:bg-slate-200/50"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Main Content Areas */}
      <main className="flex-1 pb-16">
        {activeTab === 'survey' && (
          <SurveyForm
            onSubmit={handleSubmitSurvey}
            isSubmitting={isSubmitting}
            sheetVerified={sheetVerified}
            spreadsheetId={spreadsheetId}
            hasWebhook={Boolean(webhookUrl)}
            userEmail={user?.email || null}
            onOpenSettings={() => setActiveTab('sheets')}
          />
        )}

        {activeTab === 'sheets' && (
          <GoogleSheetsSettings
            user={user}
            token={token}
            onLogin={handleLogin}
            onLogout={handleLogout}
            isLoggingIn={isLoggingIn}
            spreadsheetInput={spreadsheetInput}
            setSpreadsheetInput={setSpreadsheetInput}
            spreadsheetId={spreadsheetId}
            setSpreadsheetId={setSpreadsheetId}
            sheetVerified={sheetVerified}
            setSheetVerified={setSheetVerified}
            webhookUrl={webhookUrl}
            setWebhookUrl={setWebhookUrl}
            onSavePermanentWebhook={handleSavePermanentWebhook}
            onGoToSurvey={() => setActiveTab('survey')}
          />
        )}

        {activeTab === 'html' && (
          <HtmlExporter webhookUrl={webhookUrl} />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            responses={responses}
            spreadsheetId={spreadsheetId}
          />
        )}
      </main>

      {/* Institutional Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 text-center text-xs space-y-1">
        <div className="flex items-center justify-center gap-2 font-semibold text-slate-300">
          <span className="w-2 h-2 rounded-full bg-[#39A900]"></span>
          <span>SENA &bull; Centro Agropecuario de Buga</span>
          <span>&bull; Ambiente de Informática y Cómputo F3</span>
        </div>
        <p className="text-slate-500">
          Formulario de Satisfacción conectado a Google Sheets &bull; Hoja de destino: <strong>"Encuesta F3"</strong> &bull; ID: <code className="text-emerald-400">1c6oQABMrZ0mqYwZ9_yjXm0KDXChpjMw4BloY6KVoudo</code>
        </p>
      </footer>
    </div>
  );
}
