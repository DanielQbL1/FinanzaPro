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
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CURRENCIES } from '../constants';
import { 
  isNotificationSupported, 
  requestNotificationPermission, 
  triggerBrowserNotification, 
  loadNotificationPrefs, 
  saveNotificationPrefs 
} from '../lib/notifications';

export default function Config() {
  const { 
    userProfile, 
    updateProfile, 
    currentUser,
    exportData = () => JSON.stringify({}),
    importData = async () => {},
    resetData = async () => {},
    localModeActive
  } = useFinance() as any;

  const [activeTab, setActiveTab] = useState<'perfil' | 'datos' | 'notificaciones' | 'seguridad'>('perfil');
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Load browser notification states
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [prefs, setPrefs] = useState(() => loadNotificationPrefs(currentUser || ''));

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

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const json = ev.target?.result as string;
          await importData(json);
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

  const handleRequestPermission = async () => {
    const status = await requestNotificationPermission();
    setPermission(status);
  };

  const handleTogglePref = (key: keyof typeof prefs) => {
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    saveNotificationPrefs(currentUser || '', newPrefs);
  };

  const handleTestNotification = async () => {
    if (permission !== 'granted') {
      alert('Por favor, concede primero el permiso de notificaciones para probar.');
      return;
    }
    await triggerBrowserNotification(
      '🔔 Notificación de Prueba FinanzaPro',
      '¡Hola! El sistema de notificaciones push de FinanzaPro está funcionando correctamente a través de Service Workers.',
      'test-notification'
    );
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
          {[
            { id: 'perfil', label: 'Perfil de Usuario' },
            { id: 'datos', label: 'Respaldo y Datos' },
            { id: 'notificaciones', label: 'Notificaciones' },
            { id: 'seguridad', label: 'Seguridad' }
          ].map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`w-full text-left px-5 py-3 rounded font-black text-[10px] uppercase tracking-widest transition-all ${
                 activeTab === tab.id 
                   ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                   : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'
               }`}
             >
               {tab.label}
             </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-6">
          {/* Profile Section */}
          {activeTab === 'perfil' && (
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
                    onChange={async (e) => await updateProfile({ currency: e.target.value })}
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
          )}

          {/* Backup Section */}
          {activeTab === 'datos' && (
            <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-3 text-slate-400">
                <Database size={16} className="text-emerald-500" />
                Módulo de Almacenamiento
              </h3>

              <div className="bg-slate-950 border border-slate-850 rounded-xl p-5 mb-6 uppercase tracking-widest text-[9px] font-black">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-slate-500 mb-1 block">MÉTODO DE ALMACENAMIENTO DE DATOS ACTIVO</span>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${localModeActive ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`}></span>
                      <span className="text-white text-xs lowercase first-letter:uppercase">{localModeActive ? 'Modo local de navegador (offline fallback)' : 'Conectado a la base de datos Supabase'}</span>
                    </div>
                  </div>
                  {localStorage.getItem('is_local_mode_forced') === 'true' && (
                    <button 
                      onClick={() => {
                        localStorage.removeItem('is_local_mode_forced');
                        window.location.reload();
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-emerald-600 text-emerald-400 hover:text-slate-950 rounded text-[9px] font-black uppercase transition-all shadow shrink-0"
                    >
                      Reconectar a Supabase
                    </button>
                  )}
                </div>
              </div>

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
          )}

          {/* Notifications Section */}
          {activeTab === 'notificaciones' && (
            <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 text-slate-400">
                    <Bell size={16} className="text-emerald-500" />
                    Gestión de Alertas Push
                  </h3>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                    Control de notificaciones del navegador y Service Workers
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Permisos:</span>
                  {permission === 'granted' ? (
                    <span className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Concedido
                    </span>
                  ) : permission === 'denied' ? (
                    <span className="px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Bloqueado
                    </span>
                  ) : (
                    <button
                      onClick={handleRequestPermission}
                      className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[9px] font-black uppercase tracking-widest rounded transition-all shadow"
                    >
                      Solicitar
                    </button>
                  )}
                </div>
              </div>

              {/* Status Notice */}
              {permission === 'default' && (
                <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-lg flex gap-3 text-amber-500">
                  <AlertTriangle size={18} className="shrink-0 animate-bounce" />
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-black uppercase tracking-widest">Permiso Requerido</h4>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                      Para poder recibir avisos en tiempo real, el navegador necesita tu autorización. Haz clic en el botón superior para habilitar los permisos.
                    </p>
                  </div>
                </div>
              )}

              {permission === 'denied' && (
                <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-lg flex gap-3 text-rose-500">
                  <AlertTriangle size={18} className="shrink-0" />
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-black uppercase tracking-widest">Notificaciones Bloqueadas</h4>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                      Has denegado los permisos de notificación. Para revertir esta acción, haz clic en el icono del candado o configuración de la barra de direcciones de tu navegador y concede los permisos.
                    </p>
                  </div>
                </div>
              )}

              {/* Configuration Toggles */}
              <div className="space-y-4">
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between gap-6 hover:border-slate-700/50 transition-all">
                  <div className="space-y-1">
                    <h4 className="font-black text-white text-[11px] uppercase tracking-tight flex items-center gap-2">
                      Recordatorios de Próximos Pagos (24h de aviso)
                    </h4>
                    <p className="text-[9px] text-slate-500 max-w-lg leading-relaxed">
                      Te buscaremos y enviaremos una alerta visual justo 24 horas antes del vencimiento de tus facturas o pagos programados que permanezcan en estado pendiente.
                    </p>
                  </div>
                  <button
                    onClick={() => handleTogglePref('upcomingPayments')}
                    disabled={permission !== 'granted'}
                    className={`shrink-0 w-11 h-6 rounded-full transition-colors relative cursor-pointer outline-none ${
                      permission !== 'granted' ? 'bg-slate-800 opacity-40 cursor-not-allowed' : prefs.upcomingPayments ? 'bg-emerald-500' : 'bg-slate-800'
                    }`}
                  >
                    <span 
                      className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                        prefs.upcomingPayments ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between gap-6 hover:border-slate-700/50 transition-all">
                  <div className="space-y-1">
                    <h4 className="font-black text-white text-[11px] uppercase tracking-tight flex items-center gap-2">
                      Límites de Presupuesto (80% de consumo)
                    </h4>
                    <p className="text-[9px] text-slate-500 max-w-lg leading-relaxed">
                      Alerta automática disparada en el instante en que los gastos totales de cualquier categoría del mes en curso alcancen o sobrepasen el 80% de su límite asignado.
                    </p>
                  </div>
                  <button
                    onClick={() => handleTogglePref('budgetAlerts')}
                    disabled={permission !== 'granted'}
                    className={`shrink-0 w-11 h-6 rounded-full transition-colors relative cursor-pointer outline-none ${
                      permission !== 'granted' ? 'bg-slate-800 opacity-40 cursor-not-allowed' : prefs.budgetAlerts ? 'bg-emerald-500' : 'bg-slate-800'
                    }`}
                  >
                    <span 
                      className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                        prefs.budgetAlerts ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Developer Test Trigger Section */}
              <div className="p-6 bg-slate-950 border border-slate-800/85 rounded-lg">
                <h4 className="font-black text-white text-[10px] uppercase tracking-widest mb-2 text-slate-400">Prueba de Integridad del Service Worker</h4>
                <p className="text-[9px] text-slate-600 font-bold uppercase mb-4 leading-relaxed">
                  Envía una señal al Service Worker local para forzar el despacho de una notificación push de inmediato. Útil para verificar la compatibilidad en tu estación de trabajo.
                </p>
                <button
                  type="button"
                  onClick={handleTestNotification}
                  disabled={permission !== 'granted'}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-emerald-500 font-black text-[9px] uppercase tracking-widest rounded transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-800 disabled:hover:text-slate-300 shadow"
                >
                  Probar Notificación Ahora
                </button>
                <p className="text-[8px] text-slate-600 mt-2 font-medium">
                  * Si la aplicación se ejecuta dentro de un iframe de AI Studio, te recomendamos abrirla en una <a href={window.location.href} target="_blank" rel="noreferrer" className="text-emerald-500 underline hover:text-emerald-400 font-bold">Nueva Pestaña</a> para que la API de notificaciones funcione sin restricciones de protección del navegador.
                </p>
              </div>
            </section>
          )}

          {/* Reset / Clean Section */}
          {activeTab === 'seguridad' && (
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
          )}
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
                  onClick={async () => { await resetData(); setShowConfirmReset(false); }}
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
