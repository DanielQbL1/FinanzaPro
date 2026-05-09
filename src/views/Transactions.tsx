import React, { useState } from 'react';
import { useFinance } from '../lib/store.tsx';
import { PlusCircle, MinusCircle, Calendar, Tag, FileText, BadgeDollarSign } from 'lucide-react';
import { Category, TransactionType } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CATEGORIES: Category[] = [
  'Gasolina/Combustible', 'Agua', 'Luz', 'Internet', 'Supermercado', 
  'Transporte', 'Alquiler', 'Ocio', 'Sueldo', 'Ventas', 'Otros'
];

export default function Transactions() {
  const { addTransaction, transactions, userProfile } = useFinance();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('Otros');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTransaction({
      amount: parseFloat(amount),
      category,
      description,
      date: new Date(date).toISOString(),
      type
    });
    setSuccess(true);
    setAmount('');
    setDescription('');
    setTimeout(() => setSuccess(false), 3000);
  };

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
      <div className="lg:col-span-7 space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Nueva Transacción</h2>
          <p className="text-sm text-slate-400 mt-1">Registra tus movimientos financieros con precisión</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden ring-1 ring-white/5">
          <div className="flex gap-3 p-1.5 bg-slate-950 rounded-2xl mb-10 border border-slate-800 shadow-inner">
            <button
              onClick={() => setType('expense')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold transition-all text-sm",
                type === 'expense' ? "bg-rose-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
              )}
            >
              <MinusCircle className="w-5 h-5" />
              Egreso
            </button>
            <button
              onClick={() => setType('income')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold transition-all text-sm",
                type === 'income' ? "bg-emerald-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
              )}
            >
              <PlusCircle className="w-5 h-5" />
              Ingreso
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Monto del Movimiento</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-lg">{userProfile?.currency}</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all font-bold text-xl tabular-nums shadow-inner"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Categoría</label>
                <div className="relative cursor-pointer">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all appearance-none cursor-pointer font-bold text-base shadow-inner"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Fecha Contable</label>
                 <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-emerald-500/50 outline-none font-bold shadow-inner"
                    />
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Concepto</label>
                 <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all font-medium shadow-inner"
                      placeholder="Ej. Compra semanal..."
                    />
                 </div>
              </div>
            </div>

            <button
              type="submit"
              className={cn(
                "w-full font-bold py-4.5 rounded-2xl transition-all shadow-xl transform active:scale-[0.98] text-white text-lg mt-4",
                type === 'expense' 
                  ? "bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400" 
                  : "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400"
              )}
            >
              Registrar {type === 'expense' ? 'Egreso' : 'Ingreso'}
            </button>
          </form>

          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-10"
              >
                <div className="text-center p-8 bg-slate-950 border border-emerald-500/30 rounded-3xl shadow-2xl">
                   <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                     <PlusCircle className="text-emerald-500 w-8 h-8" />
                   </div>
                   <h4 className="text-xl font-bold text-white mb-1">¡Registro Exitoso!</h4>
                   <p className="text-slate-400 text-sm">El movimiento ha sido añadido a tu historial.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="lg:col-span-5 space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white/50">Actividad Reciente</h2>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Últimos 5 movimientos registrados</p>
        </div>

        <div className="space-y-4">
          {recentTransactions.length > 0 ? recentTransactions.map((t, idx) => (
            <motion.div 
              key={t.id || idx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center justify-between hover:bg-slate-900 transition-all group shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center border",
                  t.type === 'income' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-rose-500/10 border-rose-500/20 text-rose-500"
                )}>
                  {t.type === 'income' ? <PlusCircle size={20} /> : <MinusCircle size={20} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{t.description || t.category}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{t.category} • {new Date(t.date).toLocaleDateString()}</p>
                </div>
              </div>
              <p className={cn(
                "text-base font-bold tabular-nums",
                t.type === 'income' ? "text-emerald-500" : "text-rose-500"
              )}>
                {t.type === 'income' ? '+' : '-'}{userProfile?.currency}{t.amount.toLocaleString()}
              </p>
            </motion.div>
          )) : (
            <div className="py-20 text-center bg-slate-900/30 rounded-3xl border border-dashed border-slate-800">
               <p className="text-slate-600 text-sm italic font-medium">No hay registros recientes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
