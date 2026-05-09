import React, { useState } from 'react';
import { useFinance } from '../lib/store.tsx';
import { Target, Copy, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { Category } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CATEGORIES: Category[] = [
  'Gasolina/Combustible', 'Agua', 'Luz', 'Internet', 'Supermercado', 
  'Transporte', 'Alquiler', 'Ocio', 'Otros'
];

export default function Budgets() {
  const { budgets, transactions, setBudget, userProfile } = useFinance();
  const [selectedCategory, setSelectedCategory] = useState<Category>('Otros');
  const [amount, setAmount] = useState('');
  const [showForm, setShowForm] = useState(false);

  const currentMonth = format(new Date(), 'yyyy-MM');

  const currentMonthBudgets = budgets.filter(b => b.month === currentMonth);
  const currentMonthTransactions = transactions.filter(t => 
    t.type === 'expense' && format(new Date(t.date), 'yyyy-MM') === currentMonth
  );

  const stats = currentMonthBudgets.map(b => {
    const spent = currentMonthTransactions
      .filter(t => t.category === b.category)
      .reduce((acc, t) => acc + t.amount, 0);
    const progress = (spent / b.amount) * 100;
    return { ...b, spent, progress };
  });

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    setBudget({
      category: selectedCategory,
      amount: parseFloat(amount),
      month: currentMonth
    });
    setAmount('');
    setShowForm(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Metas y Presupuestos</h2>
          <p className="text-sm text-slate-400 mt-1">Controla tus límites de gasto para {format(new Date(), 'MMMM', { locale: es })}</p>
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
          {showForm ? 'Cerrar' : 'Nuevo Límite'}
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
            <form onSubmit={handleSaveBudget} className="bg-slate-900 p-8 rounded-3xl border border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-6 items-end shadow-2xl relative overflow-hidden ring-1 ring-white/5">
              <div className="md:col-span-12 mb-2">
                 <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Configurar Presupuesto</h3>
              </div>
              <div className="md:col-span-5 space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Categoría de Gasto</label>
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as Category)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-emerald-500/30 outline-none appearance-none font-bold text-sm shadow-inner"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="md:col-span-5 space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Presupuesto Sugerido</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold text-sm">{userProfile?.currency}</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3.5 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500/30 outline-none tabular-nums font-bold text-sm shadow-inner"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all text-sm shadow-lg active:scale-95"
                >
                  Establecer
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {stats.map((s, idx) => {
          const isWarning = s.progress >= 85 && s.progress < 100;
          const isOver = s.progress >= 100;

          return (
            <motion.div 
              key={s.category}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-slate-900/50 rounded-3xl p-6 border border-slate-800 hover:bg-slate-900 transition-all group relative overflow-hidden shadow-sm backdrop-blur-sm ring-1 ring-white/5"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="space-y-1">
                  <h4 className="font-bold text-xl text-white group-hover:text-emerald-400 transition-colors">{s.category}</h4>
                  <div className="flex items-center gap-1.5">
                    {isOver ? (
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest",
                      isOver ? "text-rose-500" : isWarning ? "text-amber-500" : "text-emerald-500"
                    )}>
                      {isOver ? 'Excedido' : isWarning ? 'Alerta Crítica' : 'Saludable'}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner">
                  <Target size={20} className="text-slate-500 group-hover:text-emerald-500 transition-colors" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                   <div>
                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Utilizado</p>
                     <p className="text-2xl font-bold text-white tabular-nums">{userProfile?.currency}{s.spent.toLocaleString()}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Límite</p>
                     <p className="text-sm font-bold text-slate-400 tabular-nums">{userProfile?.currency}{s.amount.toLocaleString()}</p>
                   </div>
                </div>

                <div className="space-y-2">
                  <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5 relative">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(s.progress, 100)}%` }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                      className={cn(
                        "h-full rounded-full transition-all duration-700 relative z-10",
                        isOver ? "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.3)]" : isWarning ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]" : "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                      )}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <span>Progreso Total</span>
                    <span className={cn(isOver ? "text-rose-500" : isWarning ? "text-amber-500" : "text-emerald-400")}>
                      {s.progress.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {stats.length === 0 && (
          <div className="col-span-full py-32 bg-slate-900/30 rounded-[3rem] border border-dashed border-slate-800 flex flex-col items-center justify-center text-center px-4 backdrop-blur-[2px]">
             <div className="w-20 h-20 bg-slate-900/50 rounded-full flex items-center justify-center mb-6 text-slate-700 border border-slate-800 shadow-inner">
               <Target size={40} className="opacity-20" />
             </div>
             <h3 className="text-lg font-bold text-slate-300">Sin Presupuestos Activos</h3>
             <p className="text-sm text-slate-500 max-w-xs mt-2 font-medium leading-relaxed">Configura límites mensuales por categoría para optimizar tus finanzas y alcanzar tus metas de ahorro.</p>
             <button 
               onClick={() => setShowForm(true)}
               className="mt-8 px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-all text-sm border border-slate-700 shadow-xl"
             >
               Comenzar ahora
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
