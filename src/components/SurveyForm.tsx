import { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Send,
  Star,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Computer,
} from 'lucide-react';
import { SurveyResponse } from '../types/survey.ts';
import { ConfirmModal } from './ConfirmModal.tsx';

interface SurveyFormProps {
  onSubmit: (response: Omit<SurveyResponse, 'id' | 'timestamp' | 'syncedToGoogleSheets'>) => Promise<boolean>;
  isSubmitting: boolean;
  sheetVerified: boolean;
  spreadsheetId: string;
  hasWebhook: boolean;
  userEmail: string | null;
  onOpenSettings: () => void;
}

const RELATION_OPTIONS = [
  'Aprendiz',
  'Instructor(a)',
  'Administrativo(a) / Funcionario',
  'Egresado(a)',
  'Visitante / Externo',
];

const FREQUENCY_OPTIONS = [
  'Diariamente',
  'Varias veces a la semana',
  'Una vez a la semana',
  'Quincenalmente',
  'Ocasionalmente / Primera vez',
];

const SCALE_DESCRIPTIONS: Record<number, string> = {
  1: '1 - Muy Insatisfecho',
  2: '2 - Insatisfecho',
  3: '3 - Neutral / Aceptable',
  4: '4 - Satisfecho',
  5: '5 - Muy Satisfecho',
};

const IMPROVEMENT_ASPECTS = [
  'Infraestructura e instalaciones',
  'Equipos y recursos disponibles (PCs, monitores, teclados)',
  'Conectividad a Internet / Velocidad de red',
  'Comodidad, iluminación y ventilación (aire acondicionado)',
  'Limpieza y orden constante',
  'Disponibilidad y horarios de uso',
  'Software y programas de formación requeridos',
  'Soporte técnico y mantenimiento preventivo',
  'Ninguno / Todo se encuentra en excelente estado',
];

export function SurveyForm({
  onSubmit,
  isSubmitting,
  sheetVerified,
  spreadsheetId,
  hasWebhook,
  userEmail,
  onOpenSettings,
}: SurveyFormProps) {
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState<number>(0);
  const [q4, setQ4] = useState<number>(0);
  const [q5, setQ5] = useState<number>(0);
  const [q6, setQ6] = useState<number>(0);
  const [q7, setQ7] = useState<number>(0);
  const [q8, setQ8] = useState<number>(0);
  const [q9Aspects, setQ9Aspects] = useState<string[]>([]);
  const [q9Other, setQ9Other] = useState('');
  const [q10Suggestions, setQ10Suggestions] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submittedSuccessfully, setSubmittedSuccessfully] = useState(false);

  // Calculate completion percentage
  let answeredCount = 0;
  if (q1) answeredCount++;
  if (q2) answeredCount++;
  if (q3 > 0) answeredCount++;
  if (q4 > 0) answeredCount++;
  if (q5 > 0) answeredCount++;
  if (q6 > 0) answeredCount++;
  if (q7 > 0) answeredCount++;
  if (q8 > 0) answeredCount++;
  if (q9Aspects.length > 0 || q9Other.trim()) answeredCount++;
  if (q10Suggestions.trim()) answeredCount++;
  const progressPercent = Math.round((answeredCount / 10) * 100);

  const toggleAspect = (aspect: string) => {
    if (aspect === 'Ninguno / Todo se encuentra en excelente estado') {
      if (q9Aspects.includes(aspect)) {
        setQ9Aspects([]);
      } else {
        setQ9Aspects([aspect]);
      }
      return;
    }

    const withoutNone = q9Aspects.filter((a) => a !== 'Ninguno / Todo se encuentra en excelente estado');
    if (withoutNone.includes(aspect)) {
      setQ9Aspects(withoutNone.filter((a) => a !== aspect));
    } else {
      setQ9Aspects([...withoutNone, aspect]);
    }
  };

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate required questions (1 to 8)
    if (!q1) {
      setFormError('Por favor responde la pregunta 1 (¿Cuál es tu relación con el Centro?)');
      return;
    }
    if (!q2) {
      setFormError('Por favor responde la pregunta 2 (Frecuencia de uso del ambiente F3)');
      return;
    }
    if (q3 === 0) {
      setFormError('Por favor califica la pregunta 3 (Instalaciones del ambiente F3)');
      return;
    }
    if (q4 === 0) {
      setFormError('Por favor califica la pregunta 4 (Limpieza y orden)');
      return;
    }
    if (q5 === 0) {
      setFormError('Por favor califica la pregunta 5 (Equipos y recursos)');
      return;
    }
    if (q6 === 0) {
      setFormError('Por favor califica la pregunta 6 (Comodidad, iluminación y ventilación)');
      return;
    }
    if (q7 === 0) {
      setFormError('Por favor califica la pregunta 7 (Disponibilidad del ambiente)');
      return;
    }
    if (q8 === 0) {
      setFormError('Por favor califica la pregunta 8 (Satisfacción general)');
      return;
    }

    // Open confirmation modal before writing to user's Google Sheet
    setShowConfirmModal(true);
  };

  const handleConfirmSubmission = async () => {
    const success = await onSubmit({
      q1_relationship: q1,
      q2_frequency: q2,
      q3_facilities: q3,
      q4_cleanliness: q4,
      q5_equipment: q5,
      q6_comfort: q6,
      q7_availability: q7,
      q8_overall: q8,
      q9_aspectsToImprove: q9Aspects,
      q9_otherText: q9Other,
      q10_suggestions: q10Suggestions,
    });

    if (success) {
      setShowConfirmModal(false);
      setSubmittedSuccessfully(true);

      // Trigger Confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#39A900', '#10b981', '#047857', '#fbbf24'],
        });
      } catch (err) {
        console.warn('Confetti error:', err);
      }
    }
  };

  const handleReset = () => {
    setQ1('');
    setQ2('');
    setQ3(0);
    setQ4(0);
    setQ5(0);
    setQ6(0);
    setQ7(0);
    setQ8(0);
    setQ9Aspects([]);
    setQ9Other('');
    setQ10Suggestions('');
    setFormError(null);
    setSubmittedSuccessfully(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderScaleQuestion = (
    num: number,
    title: string,
    value: number,
    setValue: (val: number) => void
  ) => {
    return (
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all space-y-4">
        <div className="flex items-start gap-3">
          <span className="w-7 h-7 rounded-lg bg-[#39A900]/15 text-[#2e8300] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
            {num}
          </span>
          <div className="space-y-0.5">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
              {title}
              <span className="text-rose-500 ml-1 font-bold">*</span>
            </h3>
            {value > 0 && (
              <p className="text-xs font-semibold text-[#2e8300]">
                Seleccionado: {SCALE_DESCRIPTIONS[value]}
              </p>
            )}
          </div>
        </div>

        <div className="pt-2">
          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {[1, 2, 3, 4, 5].map((scaleVal) => {
              const isSelected = value === scaleVal;
              return (
                <button
                  type="button"
                  key={scaleVal}
                  onClick={() => setValue(scaleVal)}
                  className={`flex flex-col items-center justify-center py-3.5 px-2 rounded-xl border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#39A900] bg-[#39A900]/10 text-[#2e8300] shadow-sm ring-1 ring-[#39A900]'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 hover:border-slate-300 text-slate-800'
                  }`}
                >
                  <span className="text-base sm:text-lg font-black">{scaleVal}</span>
                  <div className="flex gap-0.5 mt-1">
                    {Array.from({ length: scaleVal }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-2.5 h-2.5 ${
                          isSelected ? 'fill-[#39A900] text-[#39A900]' : 'fill-slate-300 text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mt-2 px-1">
            <span>1 = Muy Insatisfecho</span>
            <span className="hidden sm:inline">3 = Neutral</span>
            <span>5 = Muy Satisfecho</span>
          </div>
        </div>
      </div>
    );
  };

  if (submittedSuccessfully) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-emerald-200 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#39A900] flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10 text-[#39A900]" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              ¡Muchas Gracias por tu Respuesta!
            </h2>
            <p className="text-sm sm:text-base text-slate-600 max-h-40 max-w-lg mx-auto">
              Tu valoración sobre el ambiente de cómputo F3 del Centro Agropecuario de Buga ha sido registrada en la hoja de cálculo <strong>"Encuesta IA"</strong>.
            </p>
          </div>

          {/* Connection status badge */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 inline-flex flex-col items-center gap-1.5 text-xs text-emerald-900 font-medium">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Destino: Hoja "Encuesta IA"</span>
            </div>
            {spreadsheetId && (
              <a
                href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#2e8300] hover:underline flex items-center gap-1 text-[11px] font-mono mt-0.5"
              >
                <span>Ver fila en Google Sheets</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#39A900] hover:bg-[#2e8300] text-white font-bold text-sm shadow-md shadow-[#39A900]/25 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Diligenciar otra respuesta</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      
      {/* Banner de Presentación */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border-t-6 border-[#39A900] space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider bg-[#39A900]/20 text-emerald-300 border border-[#39A900]/40">
            SENA &bull; CAB
          </span>
          <span className="text-xs text-slate-300 font-medium">
            Centro Agropecuario de Buga
          </span>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Encuesta de Satisfacción — Ambiente F3
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Tu opinión permite identificar fortalezas y necesidades de mejora en los equipos, conectividad, orden y condiciones de la sala de cómputo F3. Las respuestas se registran de manera organizada en la hoja <strong>"Encuesta IA"</strong>.
          </p>
        </div>

        {/* Progress bar */}
        <div className="pt-2 border-t border-slate-700/60 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
            <span>Progreso de diligenciamiento</span>
            <span className="font-bold text-emerald-300">{answeredCount} de 10 respondidas ({progressPercent}%)</span>
          </div>
          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#39A900] transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Sync destination pill */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Computer className="w-3.5 h-3.5 text-[#39A900]" />
            <span>Destino: Hoja <strong>"Encuesta IA"</strong></span>
          </div>
          {!sheetVerified && !hasWebhook && (
            <button
              onClick={onOpenSettings}
              className="text-amber-300 hover:text-amber-200 underline text-xs flex items-center gap-1"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Vincular tu hoja de Google Sheets</span>
            </button>
          )}
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleInitialSubmit} className="space-y-5">
        
        {/* PREGUNTA 1: Relación con el Centro */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all space-y-4">
          <div className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-lg bg-[#39A900]/15 text-[#2e8300] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
              1
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                ¿Cuál es tu relación con el Centro Agropecuario de Buga?
                <span className="text-rose-500 ml-1 font-bold">*</span>
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">Selecciona tu rol en la institución.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {RELATION_OPTIONS.map((option) => (
              <label
                key={option}
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  q1 === option
                    ? 'border-[#39A900] bg-[#39A900]/10 text-slate-900 font-semibold shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="q1_relationship"
                  value={option}
                  checked={q1 === option}
                  onChange={(e) => setQ1(e.target.value)}
                  className="w-4 h-4 accent-[#39A900] cursor-pointer"
                />
                <span className="text-xs sm:text-sm">{option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* PREGUNTA 2: Frecuencia de uso */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all space-y-4">
          <div className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-lg bg-[#39A900]/15 text-[#2e8300] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
              2
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                ¿Con qué frecuencia utilizas el ambiente F3?
                <span className="text-rose-500 ml-1 font-bold">*</span>
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">Frecuencia habitual de acceso a la sala.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {FREQUENCY_OPTIONS.map((option) => (
              <label
                key={option}
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  q2 === option
                    ? 'border-[#39A900] bg-[#39A900]/10 text-slate-900 font-semibold shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="q2_frequency"
                  value={option}
                  checked={q2 === option}
                  onChange={(e) => setQ2(e.target.value)}
                  className="w-4 h-4 accent-[#39A900] cursor-pointer"
                />
                <span className="text-xs sm:text-sm">{option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* PREGUNTA 3: Estado general de las instalaciones */}
        {renderScaleQuestion(
          3,
          '¿Qué tan satisfecho(a) estás con el estado general de las instalaciones del ambiente F3?',
          q3,
          setQ3
        )}

        {/* PREGUNTA 4: Limpieza y orden */}
        {renderScaleQuestion(
          4,
          '¿Qué tan satisfecho(a) estás con la limpieza y el orden del ambiente F3?',
          q4,
          setQ4
        )}

        {/* PREGUNTA 5: Estado y funcionamiento de equipos */}
        {renderScaleQuestion(
          5,
          '¿Qué tan satisfecho(a) estás con el estado y funcionamiento de los equipos y recursos disponibles?',
          q5,
          setQ5
        )}

        {/* PREGUNTA 6: Comodidad, iluminación y ventilación */}
        {renderScaleQuestion(
          6,
          '¿Qué tan satisfecho(a) estás con la comodidad, iluminación y ventilación del ambiente?',
          q6,
          setQ6
        )}

        {/* PREGUNTA 7: Disponibilidad del ambiente */}
        {renderScaleQuestion(
          7,
          '¿Qué tan satisfecho(a) estás con la disponibilidad del ambiente para desarrollar tus actividades?',
          q7,
          setQ7
        )}

        {/* PREGUNTA 8: Satisfacción general */}
        {renderScaleQuestion(
          8,
          'En general, ¿qué tan satisfecho(a) estás con el uso del ambiente F3?',
          q8,
          setQ8
        )}

        {/* PREGUNTA 9: Aspectos que se deben mejorar */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all space-y-4">
          <div className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-lg bg-[#39A900]/15 text-[#2e8300] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
              9
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                ¿Qué aspectos del ambiente F3 consideras que se deben mejorar?
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">Puedes marcar una o varias opciones.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {IMPROVEMENT_ASPECTS.map((aspect) => {
              const checked = q9Aspects.includes(aspect);
              return (
                <label
                  key={aspect}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    checked
                      ? 'border-[#39A900] bg-[#39A900]/10 text-slate-900 font-semibold shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAspect(aspect)}
                    className="w-4 h-4 mt-0.5 accent-[#39A900] cursor-pointer rounded-xs"
                  />
                  <span className="text-xs sm:text-sm leading-snug">{aspect}</span>
                </label>
              );
            })}
          </div>

          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Otro aspecto específico (opcional):
            </label>
            <input
              type="text"
              value={q9Other}
              onChange={(e) => setQ9Other(e.target.value)}
              placeholder="Especifica otro detalle que desees mencionar..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#39A900] bg-slate-50/50"
            />
          </div>
        </div>

        {/* PREGUNTA 10: Sugerencias constructivas */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all space-y-4">
          <div className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-lg bg-[#39A900]/15 text-[#2e8300] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
              10
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                ¿Qué sugerencias tienes para mejorar el ambiente F3?
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">Tus aportes nos ayudan a optimizar las condiciones del ambiente.</p>
            </div>
          </div>

          <div className="pt-1">
            <textarea
              rows={4}
              value={q10Suggestions}
              onChange={(e) => setQ10Suggestions(e.target.value)}
              placeholder="Escribe tus ideas, propuestas o comentarios constructivos..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#39A900] bg-slate-50/50 placeholder:text-slate-400 resize-y"
            ></textarea>
            <div className="text-right text-[11px] text-slate-600 mt-1">
              {q10Suggestions.length} caracteres
            </div>
          </div>
        </div>

        {/* Error message */}
        {formError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs sm:text-sm flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto flex-1 py-4 px-8 rounded-2xl bg-[#39A900] hover:bg-[#2e8300] text-white font-extrabold text-base shadow-lg shadow-[#39A900]/30 transition-all active:scale-[0.99] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
            <span>Enviar Respuestas a Google Sheets</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="w-full sm:w-auto px-5 py-4 rounded-2xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold text-xs sm:text-sm transition-all"
          >
            Limpiar Formulario
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSubmission}
        isLoading={isSubmitting}
        spreadsheetId={spreadsheetId}
        sheetName="Encuesta IA"
        response={{
          q1_relationship: q1,
          q2_frequency: q2,
          q3_facilities: q3,
          q4_cleanliness: q4,
          q5_equipment: q5,
          q6_comfort: q6,
          q7_availability: q7,
          q8_overall: q8,
          q9_aspectsToImprove: q9Aspects,
          q10_suggestions: q10Suggestions,
        }}
      />
    </div>
  );
}
