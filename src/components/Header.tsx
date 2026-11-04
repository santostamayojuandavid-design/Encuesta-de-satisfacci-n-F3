import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Code2,
  BarChart3,
  ClipboardList,
  Sparkles,
} from 'lucide-react';
import { User } from 'firebase/auth';

interface HeaderProps {
  activeTab: 'survey' | 'sheets' | 'html' | 'analytics';
  setActiveTab: (tab: 'survey' | 'sheets' | 'html' | 'analytics') => void;
  user: User | null;
  spreadsheetId: string;
  sheetVerified: boolean;
  onOpenSheetsTab: () => void;
}

export function Header({
  activeTab,
  setActiveTab,
  user,
  spreadsheetId,
  sheetVerified,
  onOpenSheetsTab,
}: HeaderProps) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-lg">
      {/* Top Banner */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          
          {/* Logo & Entity branding */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#39A900] flex items-center justify-center text-white font-black text-xl shadow-md shadow-[#39A900]/30 border border-emerald-400/30 flex-shrink-0">
              CAB
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#39A900] bg-[#39A900]/10 px-2 py-0.5 rounded-md border border-[#39A900]/30">
                  SENA CAB
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Centro Agropecuario de Buga
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                Ambiente de Cómputo F3
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-emerald-300 border border-slate-700">
                  Encuesta de Satisfacción
                </span>
              </h1>
            </div>
          </div>

          {/* Connection Status Pill */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={onOpenSheetsTab}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                sheetVerified && user
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
                  : user
                  ? 'bg-amber-950/60 border-amber-500/40 text-amber-300 hover:bg-amber-900/60'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
              title="Configuración de Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {sheetVerified
                  ? 'Hoja Vinculada: "Encuesta F3"'
                  : user
                  ? 'Configurar Hoja destino'
                  : 'Hoja por defecto: "Encuesta F3"'}
              </span>
              {sheetVerified ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              )}
            </button>

            {user?.photoURL && (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Usuario'}
                className="w-7 h-7 rounded-full border border-slate-700 object-cover"
                title={`Conectado como: ${user.email}`}
              />
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2 mt-4 overflow-x-auto pb-1 text-xs sm:text-sm font-medium scrollbar-none">
          <button
            onClick={() => setActiveTab('survey')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'survey'
                ? 'bg-[#39A900] text-white font-bold shadow-md shadow-[#39A900]/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Formulario Encuesta</span>
          </button>

          <button
            onClick={() => setActiveTab('sheets')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'sheets'
                ? 'bg-[#39A900] text-white font-bold shadow-md shadow-[#39A900]/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Conexión Google Sheets</span>
            {sheetVerified && (
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('html')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'html'
                ? 'bg-[#39A900] text-white font-bold shadow-md shadow-[#39A900]/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Código HTML & Script</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full font-mono">
              Descargar
            </span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-[#39A900] text-white font-bold shadow-md shadow-[#39A900]/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Respuestas y Métricas</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
