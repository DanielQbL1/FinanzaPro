import React, { useState } from 'react';
import { useFinance } from '../lib/store.tsx';
import { PiggyBank, Target, Plus, TrendingUp, ArrowRight, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Savings() {
  const { savings, addSaving, updateSaving, userProfile } = useFinance();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');

  const [contributeAmount, setContributeAmount] = useState<Record<string, string>>({});

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    addSaving({
      name,
      targetAmount: parseFloat(targetAmount),
      currentAmount: 0,
      deadline: deadline || undefined
    });
    setName('');
    setTargetAmount('');
    setDeadline('');
    setShowForm(false);
  };

  const handleContribute = (id: string) => {
    const amount = parseFloat(contributeAmount[id] || '0');
    if (amount > 0) {
      updateSaving(id, amount);
      setContributeAmount({ ...contributeAmount, [id]: '' });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Objetivos de Capital</h2>
          <p className="text-sm text-slate-400 mt-1">Estrategia y seguimiento de tus metas de ahorro</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className={cn(
            "flex items-center gap-2.5 px-6 py-3.5 font-bold rounded-2xl transition-all shadow-xl active:scale-95 text-sm",
            showForm 
              ? "bg-slate-800 text-white hover:bg-slate-700" 
              : "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white"
          )}
        >
          {showForm ? <Plus className="rotate-45 transition-transform" /> : <Plus />}
          {showForm ? 'Cerrar' : 'Nueva Meta'}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -20 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -20 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleCreate} className="bg-slate-900 p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl relative overflow-hidden ring-1 ring-white/5">
              <div className="md:col-span-12 mb-2">
                 <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Definir Nuevo Objetivo</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nombre del Proyecto</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-emerald-500/30 outline-none text-sm font-bold shadow-inner"
                    placeholder="Ej. Fondo de Emergencia..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Capital Objetivo</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold text-sm">{userProfile?.currency}</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3.5 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500/30 outline-none tabular-nums font-bold text-sm shadow-inner"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Fecha Límite</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-emerald-500/30 outline-none text-sm font-bold shadow-inner"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-500 transition-all shadow-xl active:scale-95 text-base"
              >
                Registrar Meta de Ahorro
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {savings.map((goal, idx) => {
          const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          
          return (
            <motion.div 
              key={goal.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 flex flex-col relative overflow-hidden group hover:bg-slate-900 transition-all shadow-xl backdrop-blur-sm ring-1 ring-white/5"
            >
               <div className="absolute -top-6 -right-6 p-10 text-emerald-500/5 group-hover:scale-110 group-hover:text-emerald-500/10 transition-all duration-700 -rotate-12">
                 <PiggyBank size={160} />
               </div>

               <div className="relative z-10 flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-white tracking-tight group-hover:text-emerald-400 transition-colors">{goal.name}</h3>
                    {goal.deadline && (
                      <div className="flex items-center gap-2 mt-2">
                        <TrendingUp size={12} className="text-emerald-500" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          Meta: {new Date(goal.deadline).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Presupuesto Target</p>
                    <p className="text-xl font-bold text-slate-300 tabular-nums">{userProfile?.currency}{goal.targetAmount.toLocaleString()}</p>
                  </div>
               </div>

               <div className="relative z-10 space-y-4 mb-10">
                  <div className="flex justify-between items-end">
                     <div>
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Capital Acumulado</p>
                       <p className="text-4xl font-bold text-emerald-500 tabular-nums leading-none tracking-tighter">{userProfile?.currency}{goal.currentAmount.toLocaleString()}</p>
                     </div>
                     <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-bold text-emerald-500/50 uppercase tracking-widest">Progreso</span>
                        <p className="text-sm font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">{progress.toFixed(1)}%</p>
                     </div>
                  </div>
                  <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5 relative">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)] relative z-10"
                    />
                  </div>
               </div>

               <div className="relative z-10 flex gap-3 pt-6 border-t border-slate-800/50 mt-auto">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold text-xs">{userProfile?.currency}</span>
                    <input
                      type="number"
                      placeholder="Cantidad a depositar..."
                      value={contributeAmount[goal.id] || ''}
                      onChange={(e) => setContributeAmount({ ...contributeAmount, [goal.id]: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3.5 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all placeholder:text-slate-700 font-bold text-sm tabular-nums shadow-inner"
                    />
                  </div>
                  <button 
                    onClick={() => handleContribute(goal.id)}
                    className="px-6 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-all active:scale-95 text-xs flex items-center gap-2 overflow-hidden group/btn shadow-lg"
                  >
                    Aportar
                    <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
               </div>
            </motion.div>
          );
        })}

        {savings.length === 0 && (
          <div className="col-span-full py-32 bg-slate-900/30 rounded-[3rem] border border-dashed border-slate-800 flex flex-col items-center justify-center text-center px-4 backdrop-blur-[2px]">
             <div className="w-20 h-20 bg-slate-900/50 rounded-full flex items-center justify-center mb-6 text-slate-700 border border-slate-800 shadow-inner">
               <PiggyBank size={40} className="text-slate-600 opacity-30" />
             </div>
             <h3 className="text-lg font-bold text-slate-300">Sin Metas de Ahorro</h3>
             <p className="text-sm text-slate-500 max-w-xs mt-2 font-medium leading-relaxed">Comienza a planificar tu futuro financiero creando tu primer objetivo de ahorro personalizado.</p>
             <button 
               onClick={() => setShowForm(true)}
               className="mt-8 px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-all text-sm border border-slate-700 shadow-xl"
             >
               Definir Objetivo
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
