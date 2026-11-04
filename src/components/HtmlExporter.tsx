import { useState } from 'react';
import {
  Code2,
  Download,
  Copy,
  Check,
  FileCode2,
  ExternalLink,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import {
  generateStandaloneHtml,
  GOOGLE_APPS_SCRIPT_CODE,
} from '../services/htmlGenerator.ts';

interface HtmlExporterProps {
  webhookUrl: string;
}

export function HtmlExporter({ webhookUrl }: HtmlExporterProps) {
  const [activeSubTab, setActiveSubTab] = useState<'html' | 'appsscript'>('html');
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  const htmlContent = generateStandaloneHtml(webhookUrl);

  const handleCopyHtml = async () => {
    await navigator.clipboard.writeText(htmlContent);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2200);
  };

  const handleCopyScript = async () => {
    await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2200);
  };

  const handleDownloadHtml = () => {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'formulario_encuesta_f3_buga.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6 animate-in fade-in duration-200">
      
      {/* Header Info */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#39A900]/15 text-[#2e8300] flex items-center justify-center flex-shrink-0">
              <FileCode2 className="w-6 h-6 text-[#2e8300]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Generador de Código HTML y Google Apps Script
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Obtén el archivo HTML independiente listo para alojar o enviar respuestas a la hoja <strong>"Encuesta F3"</strong> (ID: <code>1c6oQABMrZ0mqYwZ9_yjXm0KDXChpjMw4BloY6KVoudo</code>).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadHtml}
              className="px-4 py-2.5 rounded-xl bg-[#39A900] hover:bg-[#2e8300] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#39A900]/25 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Descargar .html</span>
            </button>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
          <button
            onClick={() => setActiveSubTab('html')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'html'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Code2 className="w-4 h-4 text-emerald-400" />
            <span>Código HTML Completo (formulario_encuesta_f3.html)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('appsscript')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'appsscript'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Código Apps Script (doPost para "Encuesta IA")</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: HTML */}
      {activeSubTab === 'html' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="font-mono text-slate-400 ml-2">formulario_encuesta_f3.html</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyHtml}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copiedHtml ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar HTML</span>
                  </>
                )}
              </button>
              <button
                onClick={handleDownloadHtml}
                className="px-3 py-1.5 rounded-lg bg-[#39A900] hover:bg-[#2e8300] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar</span>
              </button>
            </div>
          </div>

          <pre className="p-5 text-xs text-emerald-300 font-mono overflow-x-auto max-h-[500px] leading-relaxed selection:bg-emerald-900">
            <code>{htmlContent}</code>
          </pre>
        </div>
      )}

      {/* SUBTAB 2: Apps Script */}
      {activeSubTab === 'appsscript' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#39A900]" />
              <span>Instrucciones para conectar con tu Hoja de Google Sheets:</span>
            </h3>
            <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <li>
                Abre tu hoja de Google Sheets en tu navegador (ID: <code>1c6oQABMrZ0mqYwZ9_yjXm0KDXChpjMw4BloY6KVoudo</code>).
              </li>
              <li>
                En el menú superior haz clic en <strong>Extensiones &gt; Apps Script</strong>.
              </li>
              <li>
                Borra el código existente y pega el bloque que encuentras a continuación.
              </li>
              <li>
                Haz clic en el botón azul superior <strong>Implementar &gt; Nueva implementación</strong>.
              </li>
              <li>
                Haz clic en el ícono de engranaje (seleccionar tipo) y elige <strong>Aplicación web</strong>.
              </li>
              <li>
                Configura:
                <ul className="list-disc pl-5 mt-1 space-y-0.5 text-slate-600 font-medium">
                  <li><strong>Ejecutar como:</strong> Yo (tu cuenta de Google)</li>
                  <li><strong>Quién tiene acceso:</strong> Cualquier persona (Anyone)</li>
                </ul>
              </li>
              <li>
                Haz clic en <strong>Implementar</strong>, autoriza los permisos y copia la <strong>URL de la aplicación web</strong>.
              </li>
              <li>
                Esa URL es la que recibe los datos y los escribe automáticamente en la pestaña <strong>"Encuesta F3"</strong>, creando los encabezados y filas al instante desde cualquier equipo sin requerir inicio de sesión individual.
              </li>
            </ol>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
            <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <span className="font-mono text-slate-400">Google Apps Script (Código.gs)</span>
              <button
                onClick={handleCopyScript}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copiedScript ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Código Apps Script</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-5 text-xs text-amber-200 font-mono overflow-x-auto max-h-[460px] leading-relaxed selection:bg-amber-900">
              <code>{GOOGLE_APPS_SCRIPT_CODE}</code>
            </pre>
          </div>
        </div>
      )}

    </div>
  );
}
