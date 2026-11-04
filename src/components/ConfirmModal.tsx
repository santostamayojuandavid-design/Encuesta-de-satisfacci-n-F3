import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import { SurveyResponse } from '../types/survey.ts';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  response: Partial<SurveyResponse>;
  spreadsheetId: string;
  sheetName: string;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  response,
  spreadsheetId,
  sheetName,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Confirmar Envío de Respuestas</h3>
              <p className="text-xs text-slate-300">Guardar en Google Sheets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
            <div className="font-semibold flex items-center gap-1.5 text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Destino en Google Sheets:
            </div>
            <div className="pl-3.5">
              Pestaña: <span className="font-bold text-emerald-950">"{sheetName}"</span>
            </div>
            {spreadsheetId ? (
              <div className="pl-3.5 text-slate-600 font-mono text-[11px] truncate">
                ID de hoja: {spreadsheetId}
              </div>
            ) : (
              <div className="pl-3.5 text-amber-700 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 inline" />
                Almacenamiento local + Webhook
              </div>
            )}
          </div>

          <div className="space-y-2 text-sm text-slate-700 max-h-56 overflow-y-auto pr-1">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Resumen de respuestas a registrar:
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 text-xs">
              <div>
                <span className="font-semibold text-slate-900">Relación:</span> {response.q1_relationship}
              </div>
              <div>
                <span className="font-semibold text-slate-900">Frecuencia:</span> {response.q2_frequency}
              </div>
              <div>
                <span className="font-semibold text-slate-900">Satisfacción General:</span> {response.q8_overall} / 5
              </div>
              <div>
                <span className="font-semibold text-slate-900">Equipos y Recursos:</span> {response.q5_equipment} / 5
              </div>
              <div>
                <span className="font-semibold text-slate-900">Instalaciones:</span> {response.q3_facilities} / 5
              </div>
              {response.q9_aspectsToImprove && response.q9_aspectsToImprove.length > 0 && (
                <div>
                  <span className="font-semibold text-slate-900">Aspectos a mejorar:</span>{' '}
                  {response.q9_aspectsToImprove.join(', ')}
                </div>
              )}
              {response.q10_suggestions && (
                <div className="italic text-slate-600 truncate">
                  "{response.q10_suggestions}"
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Al hacer clic en "Confirmar y Enviar", esta información se añadirá como una nueva fila en la pestaña "{sheetName}".
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Registrando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Confirmar y Registrar Fila
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
