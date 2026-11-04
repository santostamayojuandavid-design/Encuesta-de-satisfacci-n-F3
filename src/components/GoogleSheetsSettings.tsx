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
  Zap,
  Copy,
  Check,
  Send,
} from 'lucide-react';
import {
  extractSpreadsheetId,
  verifyAndPrepareSpreadsheet,
  SpreadsheetVerification,
  SURVEY_HEADERS,
  DEFAULT_SPREADSHEET_ID,
  DEFAULT_SHEET_NAME,
} from '../services/sheetsService.ts';
import { GOOGLE_APPS_SCRIPT_CODE } from '../services/htmlGenerator.ts';

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
  onSavePermanentWebhook: (url: string) => Promise<boolean>;
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
  onSavePermanentWebhook,
  onGoToSurvey,
}: GoogleSheetsSettingsProps) {
  const [verifying, setVerifying] = useState(false);
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [verifyResult, setVerifyResult] = useState<SpreadsheetVerification | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyScript = async () => {
    await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2200);
  };

  const handleSaveWebhook = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!webhookUrl || !webhookUrl.trim()) {
      setErrorMessage('Por favor ingresa la URL de la aplicación web de Google Apps Script.');
      return;
    }

    if (!webhookUrl.startsWith('https://script.google.com/')) {
      setErrorMessage('La URL debe comenzar por "https://script.google.com/macros/s/..."');
      return;
    }

    setSavingWebhook(true);
    try {
      const ok = await onSavePermanentWebhook(webhookUrl.trim());
      if (ok) {
        setSuccessMessage('¡Conexión permanente guardada! Ahora todos los equipos de la sala F3 enviarán respuestas directamente a la hoja "Encuesta F3" sin requerir ningún inicio de sesión.');
        setSheetVerified(true);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al guardar la conexión');
    } finally {
      setSavingWebhook(false);
    }
  };

  const handleTestWebhook = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!webhookUrl || !webhookUrl.trim()) {
      setErrorMessage('Ingresa primero la URL de la aplicación web.');
      return;
    }

    setTestingWebhook(true);
    try {
      const res = await fetch('/api/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(data.message || '¡Conexión exitosa con Google Apps Script!');
      } else {
        setErrorMessage(data.message || 'No se pudo contactar el script.');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error de prueba de conexión');
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleVerify = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setVerifyResult(null);

    const extracted = extractSpreadsheetId(spreadsheetInput || DEFAULT_SPREADSHEET_ID);

    if (!token) {
      setErrorMessage('Inicia sesión con tu cuenta de Google en la sección inferior para verificar mediante la API directa.');
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

  const isPermanentActive = Boolean(webhookUrl && webhookUrl.startsWith('https://script.google.com/'));

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8 animate-in fade-in duration-200">
      
      {/* Title Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Conexión Permanente con Google Sheets
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Hoja oficial: <code className="text-xs bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-slate-800">{DEFAULT_SPREADSHEET_ID}</code> &bull; Pestaña: <strong className="text-emerald-700">"{DEFAULT_SHEET_NAME}"</strong>
              </p>
            </div>
          </div>

          <a
            href={`https://docs.google.com/spreadsheets/d/${DEFAULT_SPREADSHEET_ID}/edit`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <span>Abrir Hoja de Cálculo</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* MÉTODO RECOMENDADO: Conexión Permanente sin Iniciar Sesión */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-emerald-500/40 shadow-md space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-[#39A900] text-white text-[11px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider">
          Recomendado para la Sala F3
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#39A900] text-white text-xs font-bold flex items-center justify-center">
              <Zap className="w-4 h-4 fill-white" />
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              Conexión Permanente para Todos los Equipos (Sin Iniciar Sesión)
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 pl-9 leading-relaxed">
            Con este método, <strong>ningún aprendiz, instructor ni usuario tendrá que iniciar sesión en Google</strong>. La encuesta envía las respuestas directamente a la pestaña <strong>"{DEFAULT_SHEET_NAME}"</strong> de tu hoja desde cualquier computador o dispositivo.
          </p>
        </div>

        {/* Status Banner */}
        <div className="pl-0 sm:pl-9">
          {isPermanentActive ? (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-start gap-3 text-emerald-950 text-xs sm:text-sm">
              <CheckCircle className="w-5 h-5 text-[#39A900] flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block text-[#2e8300]">
                  ¡Conexión Permanente Activa y Lista para la Sala F3!
                </span>
                <span className="text-slate-600 block text-xs">
                  Cualquier persona en cualquier computador puede diligenciar la encuesta y las respuestas se guardarán de inmediato en tu hoja de cálculo.
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3 text-amber-950 text-xs sm:text-sm">
              <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block text-amber-900">
                  Vincular Webhook para Conexión Permanente
                </span>
                <span className="text-slate-600 block text-xs">
                  Sigue los 3 sencillos pasos a continuación para obtener la URL de conexión y activarla en un minuto.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Input box */}
        <div className="pl-0 sm:pl-9 space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            URL de la Aplicación Web (Apps Script Webhook):
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#39A900] text-xs sm:text-sm font-mono bg-slate-50/50"
            />
            <button
              type="button"
              onClick={handleSaveWebhook}
              disabled={savingWebhook || !webhookUrl}
              className="px-5 py-2.5 bg-[#39A900] hover:bg-[#2e8300] text-white font-bold rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {savingWebhook ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Guardar para Todos los Equipos</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleTestWebhook}
              disabled={testingWebhook || !webhookUrl}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {testingWebhook ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Probando...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Probar Conexión</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Step by step guide */}
        <div className="pl-0 sm:pl-9 pt-2 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              ¿Cómo obtener la URL en 60 segundos?
            </span>
            <button
              type="button"
              onClick={handleCopyScript}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-300"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>¡Código Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Código del Script</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block">1. Abrir Apps Script</span>
              <p className="text-slate-600">
                En tu Google Sheet (ID: <code>1c6oQAB...</code>), haz clic en el menú superior en <strong>Extensiones &gt; Apps Script</strong>.
              </p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block">2. Pegar e Implementar</span>
              <p className="text-slate-600">
                Borra el código anterior, pega el código copiado y haz clic en <strong>Implementar &gt; Nueva implementación</strong> (Tipo: <em>Aplicación web</em>).
              </p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block">3. Configurar Acceso</span>
              <p className="text-slate-600">
                En <em>Quién tiene acceso</em> elige <strong>Cualquier persona</strong>. Copia la URL generada y pégala aquí arriba.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Messages */}
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
          <div className="space-y-2">
            <strong className="block font-bold">{successMessage}</strong>
            <button
              type="button"
              onClick={onGoToSurvey}
              className="px-4 py-1.5 bg-[#39A900] hover:bg-[#2e8300] text-white rounded-lg font-bold text-xs inline-flex items-center gap-1.5 shadow-xs"
            >
              <span>Ir al Formulario de Encuesta</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ACCESO OPCIONAL CON CUENTA GOOGLE (OAUTH) */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-slate-500" />
              <span>Acceso con Cuenta Google (Opcional - Para administradores)</span>
            </h3>
            <p className="text-xs text-slate-600">
              Si deseas sincronizar o modificar encabezados directamente con tu cuenta autenticada.
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

        {!user ? (
          <div className="pt-2">
            <button
              type="button"
              onClick={onLogin}
              disabled={isLoggingIn}
              className="inline-flex items-center gap-3 px-5 py-2.5 border border-slate-300 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs hover:shadow transition-all disabled:opacity-60"
            >
              {isLoggingIn ? (
                <div className="w-4 h-4 border-2 border-slate-400 border-t-emerald-600 rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 48 48">
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
          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800">
            {user.photoURL && (
              <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border object-cover" />
            )}
            <div>
              <span className="font-bold">{user.displayName || user.email}</span>
              <span className="text-slate-500 block font-mono text-[11px]">{user.email}</span>
            </div>
            <button
              type="button"
              onClick={handleVerify}
              disabled={verifying}
              className="ml-auto px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              {verifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
              <span>Verificar Encabezados</span>
            </button>
          </div>
        )}
      </div>

      {/* Column Headers Reference */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-3">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Columnas oficiales en la pestaña "{DEFAULT_SHEET_NAME}":
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
