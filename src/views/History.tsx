import React, { useState } from 'react';
import { useFinance } from '../lib/store.tsx';
import { Search, Filter, Trash2, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Category, TransactionType } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export default function HistoryView() {
  const { transactions, deleteTransaction, userProfile } = useFinance();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    return matchesSearch && matchesType && matchesCategory;
  });

  const categories: Category[] = [
    'Gasolina/Combustible', 'Agua', 'Luz', 'Internet', 'Supermercado', 
    'Transporte', 'Alquiler', 'Ocio', 'Sueldo', 'Ventas', 'Otros'
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Historial de Operaciones</h2>
          <p className="text-sm text-slate-400 mt-1">Explora y gestiona todos tus movimientos financieros</p>
        </div>
        <div className="flex items-center gap-2.5 text-slate-300 text-xs font-bold leading-none bg-slate-900 px-4 py-3 rounded-2xl border border-slate-800 shadow-xl">
          <Calendar className="w-4 h-4 text-emerald-500" />
          <span>{transactions.length} registros totales</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-slate-900/50 p-6 rounded-3xl border border-slate-800 shadow-lg backdrop-blur-sm">
        <div className="lg:col-span-6 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
          <input
            type="text"
            placeholder="Buscar por descripción o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-emerald-500/30 outline-none text-sm font-medium transition-all shadow-inner placeholder:text-slate-600"
          />
        </div>
        <div className="lg:col-span-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-emerald-500/30 outline-none appearance-none cursor-pointer text-xs font-bold uppercase tracking-widest text-slate-400 shadow-inner"
          >
            <option value="all">Filtro: Todos los tipos</option>
            <option value="income">Solo Ingresos</option>
            <option value="expense">Solo Egresos</option>
          </select>
        </div>
        <div className="lg:col-span-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-emerald-500/30 outline-none appearance-none cursor-pointer text-xs font-bold uppercase tracking-widest text-slate-400 shadow-inner"
          >
            <option value="all">Categorías: Todas</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/5">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40">
                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Fecha</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Concepto</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Categoría</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Monto</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              <AnimatePresence mode="popLayout">
                {filteredTransactions.map((t, idx) => (
                  <motion.tr
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: idx * 0.05 }}
                    className="hover:bg-slate-800/30 transition-all group"
                  >
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-300">
                        {format(new Date(t.date), 'dd MMM, yyyy', { locale: es })}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-sm font-semibold text-white tracking-tight group-hover:text-emerald-400 transition-colors">{t.description || 'Sin concepto'}</div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-slate-950 text-slate-500 text-[10px] font-bold rounded-lg border border-slate-800 uppercase tracking-widest group-hover:border-slate-700 transition-colors">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className={`flex items-center gap-2 font-bold text-base tabular-nums ${t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {t.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        {t.type === 'income' ? '+' : '-'}{userProfile?.currency}{t.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <button
                        onClick={async () => await deleteTransaction(t.id)}
                        className="p-2.5 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all shadow-sm active:scale-90"
                        title="Eliminar Registro"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filteredTransactions.length === 0 && (
            <div className="py-24 text-center bg-slate-950/20">
               <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800 opacity-50">
                 <Search className="text-slate-500 w-8 h-8" />
               </div>
               <p className="text-slate-400 font-bold text-base">No se encontraron resultados</p>
               <p className="text-slate-600 text-sm mt-1">Prueba ajustando los filtros de búsqueda</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
