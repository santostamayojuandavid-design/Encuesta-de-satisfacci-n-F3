import { useState } from 'react';
import {
  BarChart3,
  Download,
  Star,
  Users,
  CheckCircle,
  FileSpreadsheet,
  AlertTriangle,
  ExternalLink,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { SurveyResponse } from '../types/survey.ts';

interface AnalyticsViewProps {
  responses: SurveyResponse[];
  spreadsheetId: string;
}

export function AnalyticsView({ responses, spreadsheetId }: AnalyticsViewProps) {
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null);

  // Compute metrics
  const total = responses.length;

  const avgOverall = total > 0
    ? (responses.reduce((acc, r) => acc + (Number(r.q8_overall) || 0), 0) / total).toFixed(1)
    : '0.0';

  const avgEquipment = total > 0
    ? (responses.reduce((acc, r) => acc + (Number(r.q5_equipment) || 0), 0) / total).toFixed(1)
    : '0.0';

  const avgFacilities = total > 0
    ? (responses.reduce((acc, r) => acc + (Number(r.q3_facilities) || 0), 0) / total).toFixed(1)
    : '0.0';

  const avgCleanliness = total > 0
    ? (responses.reduce((acc, r) => acc + (Number(r.q4_cleanliness) || 0), 0) / total).toFixed(1)
    : '0.0';

  const avgComfort = total > 0
    ? (responses.reduce((acc, r) => acc + (Number(r.q6_comfort) || 0), 0) / total).toFixed(1)
    : '0.0';

  // Count aspects to improve
  const aspectCounts: Record<string, number> = {};
  responses.forEach((r) => {
    if (Array.isArray(r.q9_aspectsToImprove)) {
      r.q9_aspectsToImprove.forEach((aspect) => {
        aspectCounts[aspect] = (aspectCounts[aspect] || 0) + 1;
      });
    }
  });

  const sortedAspects = Object.entries(aspectCounts).sort((a, b) => b[1] - a[1]);

  // Export to CSV
  const handleExportCsv = () => {
    if (responses.length === 0) return;

    const headers = [
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

    const rows = responses.map((r) => [
      `"${r.timestamp || ''}"`,
      `"${r.q1_relationship || ''}"`,
      `"${r.q2_frequency || ''}"`,
      r.q3_facilities || '',
      r.q4_cleanliness || '',
      r.q5_equipment || '',
      r.q6_comfort || '',
      r.q7_availability || '',
      r.q8_overall || '',
      `"${(r.q9_aspectsToImprove || []).join(', ') + (r.q9_otherText ? ` (Otro: ${r.q9_otherText})` : '')}"`,
      `"${(r.q10_suggestions || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Encuesta_IA_Sala_F3_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-[#39A900]/15 text-[#2e8300]">
              Métricas en Tiempo Real
            </span>
            <span className="text-xs text-slate-500">Hoja "Encuesta IA"</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Respuestas y Análisis del Ambiente F3
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Resumen consolidado de las respuestas de aprendices, instructores y funcionarios del CAB.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {spreadsheetId && (
            <a
              href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl border border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Ver en Google Sheets</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          )}

          <button
            onClick={handleExportCsv}
            disabled={total === 0}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            <span>Descargar CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Encuestas</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {total}
          </div>
          <p className="text-[11px] text-slate-500">Respuestas registradas</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Satisfacción General</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 flex items-baseline gap-1">
            <span>{avgOverall}</span>
            <span className="text-xs text-slate-600 font-semibold">/ 5.0</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#39A900] h-full"
              style={{ width: `${(Number(avgOverall) / 5) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Equipos y Recursos</span>
            <span className="text-xs font-bold text-emerald-600">PCs & Red</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 flex items-baseline gap-1">
            <span>{avgEquipment}</span>
            <span className="text-xs text-slate-600 font-semibold">/ 5.0</span>
          </div>
          <p className="text-[11px] text-slate-500">Funcionamiento técnico</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Instalaciones & Aseo</span>
            <span className="text-xs font-bold text-[#2e8300]">Ambiente</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 flex items-baseline gap-1">
            <span>{avgCleanliness}</span>
            <span className="text-xs text-slate-600 font-semibold">/ 5.0</span>
          </div>
          <p className="text-[11px] text-slate-500">Limpieza y comodidad</p>
        </div>
      </div>

      {/* Two columns: Aspects to improve + Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Aspects to improve breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#39A900]" />
              <span>Aspectos Señalados para Mejorar (Pregunta 9)</span>
            </h3>
            <span className="text-xs text-slate-600 font-mono">Frecuencia</span>
          </div>

          {sortedAspects.length === 0 ? (
            <p className="text-xs text-slate-600 py-6 text-center italic">
              Aún no hay aspectos marcados para mejorar.
            </p>
          ) : (
            <div className="space-y-3">
              {sortedAspects.map(([aspect, count]) => {
                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={aspect} className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-700 font-medium">
                      <span className="truncate pr-2">{aspect}</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#39A900] h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Suggestions preview */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#39A900]" />
              <span>Sugerencias de los Usuarios (Pregunta 10)</span>
            </h3>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {responses.filter((r) => r.q10_suggestions?.trim()).length === 0 ? (
              <p className="text-xs text-slate-600 py-6 text-center italic">
                No se han registrado sugerencias abiertas todavía.
              </p>
            ) : (
              responses
                .filter((r) => r.q10_suggestions?.trim())
                .map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-600">
                      <span className="font-semibold text-slate-700">
                        {r.q1_relationship} &bull; {r.q2_frequency}
                      </span>
                      <span className="font-mono text-[10px] text-slate-600">{r.timestamp}</span>
                    </div>
                    <p className="text-slate-800 italic leading-relaxed">
                      "{r.q10_suggestions}"
                    </p>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Response Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-3 p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Registro Histórico de Respuestas ({total})
          </h3>
          <span className="text-xs text-slate-600">Pestaña "Encuesta IA"</span>
        </div>

        {total === 0 ? (
          <div className="py-12 text-center text-slate-600 text-xs">
            No hay respuestas registradas aún. Diligencia el formulario para comenzar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Fecha y Hora</th>
                  <th className="py-2.5 px-3">Rol</th>
                  <th className="py-2.5 px-3">Frecuencia</th>
                  <th className="py-2.5 px-3 text-center">Instalaciones</th>
                  <th className="py-2.5 px-3 text-center">Equipos</th>
                  <th className="py-2.5 px-3 text-center">General</th>
                  <th className="py-2.5 px-3">Estado Sheets</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {responses.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {r.timestamp}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {r.q1_relationship}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {r.q2_frequency}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                      {r.q3_facilities} / 5
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                      {r.q5_equipment} / 5
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-700 bg-emerald-50/50">
                      {r.q8_overall} / 5
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        Encuesta IA
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
