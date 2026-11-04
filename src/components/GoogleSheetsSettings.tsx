import { useState } from 'react';
import { User } from 'firebase/auth';
import {
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  LogOut,
  ShieldCheck,
  TableProperties,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  extractSpreadsheetId,
  verifyAndPrepareSpreadsheet,
  SpreadsheetVerification,
  SURVEY_HEADERS,
  DEFAULT_SPREADSHEET_ID,
  DEFAULT_SHEET_NAME,
} from '../services/sheetsService.ts';

interface GoogleSheetsSettingsProps {
  user: User | null;
  token: string | null;
  onLogin: () => Promise<void>;
  onLogout: () => Promise<void>;
  isLoggingIn: boolean;
  spreadsheetInput: string;
  setSpreadsheetInput: (val: string) => void;
  spreadsheetId: string;
  setSpreadsheetId: (id: string) => void;
  sheetVerified: boolean;
  setSheetVerified: (val: boolean) => void;
  webhookUrl: string;
  setWebhookUrl: (url: string) => void;
  onGoToSurvey: () => void;
}

export function GoogleSheetsSettings({
  user,
  token,
  onLogin,
  onLogout,
  isLoggingIn,
  spreadsheetInput,
  setSpreadsheetInput,
  spreadsheetId,
  setSpreadsheetId,
  sheetVerified,
  setSheetVerified,
  webhookUrl,
  setWebhookUrl,
  onGoToSurvey,
}: GoogleSheetsSettingsProps) {
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<SpreadsheetVerification | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleVerify = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setVerifyResult(null);

    const extracted = extractSpreadsheetId(spreadsheetInput);
    if (!extracted) {
      setErrorMessage('Por favor ingresa el enlace completo o el ID de tu hoja de Google Sheets.');
      return;
    }

    if (!token) {
      setErrorMessage('Debes iniciar sesión con tu cuenta de Google para verificar y vincular la hoja.');
      return;
    }

    setVerifying(true);
    try {
      const res = await verifyAndPrepareSpreadsheet(extracted, token, DEFAULT_SHEET_NAME);
      setSpreadsheetId(extracted);
      setVerifyResult(res);
      setSheetVerified(true);
      setSuccessMessage(
        `¡Conexión exitosa! La pestaña "${DEFAULT_SHEET_NAME}" está verificada con sus 11 columnas de encabezados oficiales.`
      );
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'No se pudo conectar a la hoja de Google Sheets.';
      setErrorMessage(
        `${msg}. Asegúrate de que la hoja exista y que tu cuenta (${user?.email}) tenga permisos de edición en ella.`
      );
      setSheetVerified(false);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8 animate-in fade-in duration-200">
      
      {/* Title Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <FileSpreadsheet className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Conexión con Google Sheets por Defecto
            </h2>
            <p className="text-sm text-slate-600">
              Hoja predeterminada vinculada: <code className="text-xs bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-slate-800">{DEFAULT_SPREADSHEET_ID}</code> &bull; Pestaña: <strong className="text-emerald-700">"{DEFAULT_SHEET_NAME}"</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Step 1: Authentication */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                1
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Autenticación con Cuenta Google (OAuth)
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 pl-8">
              Inicia sesión con tu cuenta de Google autorizada para leer y escribir en tu hoja de cálculo.
            </p>
          </div>

          {user && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors font-medium border border-rose-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              Cerrar sesión
            </button>
          )}
        </div>

        <div className="pl-8 pt-2">
          {!user ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Se solicitarán permisos con tu autorización para registrar las filas de la encuesta en la hoja que especifiques.
              </p>

              {/* Official Google Sign-in Button */}
              <button
                type="button"
                onClick={onLogin}
                disabled={isLoggingIn}
                className="inline-flex items-center gap-3 px-5 py-3 border border-slate-300 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm shadow-sm hover:shadow transition-all active:scale-[0.99] disabled:opacity-60"
              >
                {isLoggingIn ? (
                  <div className="w-5 h-5 border-2 border-slate-400 border-t-emerald-600 rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                )}
                <span>Iniciar sesión con Google</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-950">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Avatar'}
                  className="w-11 h-11 rounded-full border border-emerald-300 object-cover"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="space-y-0.5 text-xs sm:text-sm">
                <div className="font-bold flex items-center gap-1.5 text-slate-900">
                  <span>{user.displayName || 'Usuario Google'}</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-semibold border border-emerald-300">
                    <ShieldCheck className="w-3 h-3 text-emerald-700" />
                    Conectado
                  </span>
                </div>
                <div className="text-slate-600 font-mono">{user.email}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Spreadsheet Selection */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
              2
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Hoja de Cálculo y Pestaña "{DEFAULT_SHEET_NAME}"
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 pl-8">
            Esta aplicación está preconfigurada con tu hoja de cálculo oficial. La información se registrará por defecto en la pestaña <strong>"{DEFAULT_SHEET_NAME}"</strong>.
          </p>
        </div>

        <div className="pl-8 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                ID o URL de la Hoja de Google Sheets:
              </label>
              {spreadsheetInput !== DEFAULT_SPREADSHEET_ID && (
                <button
                  type="button"
                  onClick={() => {
                    setSpreadsheetInput(DEFAULT_SPREADSHEET_ID);
                    setSpreadsheetId(DEFAULT_SPREADSHEET_ID);
                  }}
                  className="text-[11px] text-[#2e8300] hover:underline font-semibold"
                >
                  Restablecer a ID por defecto
                </button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={spreadsheetInput}
                onChange={(e) => setSpreadsheetInput(e.target.value)}
                placeholder={DEFAULT_SPREADSHEET_ID}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-mono"
              />
              <button
                type="button"
                onClick={handleVerify}
                disabled={verifying || !spreadsheetInput}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {verifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verificando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Verificar y Preparar Hoja</span>
                  </>
                )}
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-slate-500 mt-1.5">
              <span>
                ID por defecto: <code className="text-[#2e8300] font-bold">{DEFAULT_SPREADSHEET_ID}</code>
              </span>
              <a
                href={`https://docs.google.com/spreadsheets/d/${spreadsheetId || DEFAULT_SPREADSHEET_ID}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1 font-semibold"
              >
                <span>Abrir en Google Sheets</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Feedback messages */}
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold mb-0.5">Atención:</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 text-xs sm:text-sm flex items-start gap-2.5">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="block font-bold">{successMessage}</strong>
                {spreadsheetId && (
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-900 font-semibold underline"
                    >
                      <span>Abrir hoja en Google Sheets</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Spreadsheet Verification Summary */}
          {verifyResult && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-sm">
                  {verifyResult.title}
                </span>
                <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                  Listo para recibir datos
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                <div className="flex items-center gap-1.5">
                  <TableProperties className="w-4 h-4 text-emerald-600" />
                  <span>Pestaña de destino: <strong>"{DEFAULT_SHEET_NAME}"</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>11 Columnas configuradas con formato SENA</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onGoToSurvey}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <span>Ir a diligenciar la encuesta</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alternative Method: Google Apps Script Webhook (Optional) */}
      <div className="bg-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-200 space-y-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-slate-500 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900">
              Método alternativo: Google Apps Script Webhook (Para respuestas anónimas públicas)
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Si vas a compartir el formulario con aprendices o visitantes y no deseas que ellos deban iniciar sesión con una cuenta autorizada, puedes desplegar el script en tu Google Sheet y colocar aquí la URL del Webhook.
            </p>
          </div>
        </div>

        <div className="pl-8">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            URL de Webhook (Apps Script Web App):
          </label>
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
            className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono bg-white"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Encuentra el código del script listo para copiar en la pestaña <strong>"Código HTML & Script"</strong>.
          </p>
        </div>
      </div>

      {/* Column Headers Reference */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-3">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Columnas oficiales de la hoja "{DEFAULT_SHEET_NAME}":
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 font-mono">
          {SURVEY_HEADERS.map((header, idx) => (
            <div key={idx} className="p-2 rounded bg-slate-50 border border-slate-200 truncate">
              <span className="font-bold text-emerald-700 mr-2">Col {String.fromCharCode(65 + idx)}:</span>
              <span title={header}>{header}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
