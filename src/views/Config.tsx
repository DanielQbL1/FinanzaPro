import React, { useState } from 'react';
import { useFinance } from '../lib/store.tsx';
import { 
  Settings, 
  Download, 
  Upload, 
  Trash2, 
  User as UserIcon, 
  Database, 
  Bell, 
  Shield, 
  Moon,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CURRENCIES } from '../constants';

export default function Config() {
  const { userProfile, exportData, importData, resetData, updateProfile } = useFinance();
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finanzapro_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const json = ev.target?.result as string;
          importData(json);
          setImportStatus('success');
          setTimeout(() => setImportStatus('idle'), 3000);
        } catch (err) {
          setImportStatus('error');
          setTimeout(() => setImportStatus('idle'), 3000);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight uppercase text-white">Configuración del Sistema</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Preferencias y administración de datos</p>
        </div>
        <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded">
           <button className="px-4 py-1.5 bg-slate-800 text-white rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-inner">
             <Moon size={14} />
             Dark Ops Mode
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation / Sections */}
        <div className="space-y-1">
          {['Perfil de Usuario', 'Respaldo y Datos', 'Notificaciones', 'Seguridad'].map((item, i) => (
             <button
               key={item}
               className={`w-full text-left px-5 py-3 rounded font-black text-[10px] uppercase tracking-widest transition-all ${i === 0 ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'}`}
             >
               {item}
             </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-6">
          {/* Profile Section */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-3 text-slate-400">
              <UserIcon size={16} className="text-emerald-500" />
              Parámetros de Identidad
            </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Nombre Legal</label>
                  <p className="bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-lg font-bold text-sm text-white">{userProfile?.fullName}</p>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Identificador (UID)</label>
                  <p className="bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-lg font-bold text-sm text-slate-500">@{userProfile?.username}</p>
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Divisa de Muestra</label>
                <select 
                  value={userProfile?.currency}
                  onChange={(e) => updateProfile({ currency: e.target.value })}
                  className="bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-lg font-black text-sm text-emerald-500 w-fit min-w-[120px] text-center cursor-pointer outline-none focus:border-emerald-500/50 transition-all appearance-none"
                >
                  {CURRENCIES.map(curr => (
                    <option key={curr.code} value={curr.symbol}>
                      {curr.name} ({curr.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Backup Section */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-3 text-slate-400">
              <Database size={16} className="text-emerald-500" />
              Módulo de Almacenamiento
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="p-5 bg-slate-950 border border-slate-800 rounded-lg group hover:border-emerald-500/30 transition-all">
                  <h4 className="font-black text-white text-[11px] mb-1 uppercase tracking-tight">Exportar Backup</h4>
                  <p className="text-[9px] text-slate-600 font-bold uppercase mb-4">Descarga el estado actual (JSON)</p>
                  <button 
                    onClick={handleExport}
                    className="flex items-center justify-center gap-2 w-full py-2 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-300 rounded text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    <Download size={14} />
                    Ejecutar
                  </button>
               </div>

               <div className="p-5 bg-slate-950 border border-slate-800 rounded-lg group hover:border-amber-500/30 transition-all">
                  <h4 className="font-black text-white text-[11px] mb-1 uppercase tracking-tight">Restaurar Datos</h4>
                  <p className="text-[9px] text-amber-500/50 font-black uppercase mb-4">Cargar archivo de respaldo</p>
                  <div className="relative w-full">
                    <input 
                      type="file" 
                      accept=".json"
                      onChange={handleImport}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <button className="flex items-center justify-center gap-2 w-full py-2 bg-slate-800 text-slate-300 rounded text-[10px] font-black uppercase tracking-widest pointer-events-none group-hover:bg-amber-600 group-hover:text-white transition-all">
                      <Upload size={14} />
                      Importar
                    </button>
                  </div>
               </div>
            </div>
            {importStatus === 'success' && <p className="text-emerald-500 text-[10px] font-black uppercase mt-4 text-center tracking-widest">Sincronización completada</p>}
            {importStatus === 'error' && <p className="text-rose-500 text-[10px] font-black uppercase mt-4 text-center tracking-widest">Fallo en la verificación de integridad</p>}
          </section>

          {/* Reset Section */}
          <section className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-center sm:text-left">
                <h3 className="text-xs font-black text-rose-500 mb-2 flex items-center gap-3 justify-center sm:justify-start uppercase tracking-widest">
                   <AlertTriangle size={16} className="animate-pulse" />
                   Protocolo de Purga
                </h3>
                <p className="text-slate-600 text-[9px] font-black uppercase tracking-widest max-w-sm leading-relaxed">Eliminación irreversible de todos los registros financieros locales asociados a esta instancia.</p>
              </div>
              <button 
                onClick={() => setShowConfirmReset(true)}
                className="px-6 py-3 bg-rose-600 text-white font-black rounded hover:bg-rose-500 transition-all active:scale-95 shadow-xl shadow-rose-900/40 text-[10px] uppercase tracking-[0.2em] w-full sm:w-auto"
              >
                FORMATEAR DB
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showConfirmReset && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 max-w-sm w-full p-8 rounded-xl text-center shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            >
              <div className="w-16 h-16 bg-rose-500/10 rounded border border-rose-500/20 flex items-center justify-center mx-auto mb-6 text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.1)]">
                <Trash2 size={28} />
              </div>
              <h4 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Confirmar Purga Integral</h4>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-10 leading-relaxed italic opacity-70">Esta acción destruirá todos los datos de FinanzaPro de forma definitiva.</p>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => { resetData(); setShowConfirmReset(false); }}
                  className="w-full py-4 bg-rose-600 text-white font-black rounded hover:bg-rose-500 transition-all text-xs uppercase tracking-widest shadow-xl"
                >
                  EJECUTAR BORRADO
                </button>
                <button 
                  onClick={() => setShowConfirmReset(false)}
                  className="w-full py-3 bg-slate-800 text-slate-400 font-black rounded hover:bg-slate-700 transition-all text-[10px] uppercase tracking-widest mt-2"
                >
                  ABORTAR OPERACIÓN
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
