import React, { useState } from 'react';
import { useFinance } from '../lib/store.tsx';
import { CreditCard, Calendar, Plus, Trash2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Frequency, Category } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

const FREQUENCIES: Frequency[] = ['único', 'diario', 'quincenal', 'mensual', 'trimestral', 'anual'];
const CATEGORIES: Category[] = [
  'Gasolina/Combustible', 'Agua', 'Luz', 'Internet', 'Supermercado', 
  'Transporte', 'Alquiler', 'Ocio', 'Otros'
];

export default function Payments() {
  const { payments, addPayment, markPaymentAsPaid, userProfile } = useFinance();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: 'Otros' as Category,
    frequency: 'mensual' as Frequency,
    nextDueDate: format(new Date(), 'yyyy-MM-dd')
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPayment({
      name: formData.name,
      amount: parseFloat(formData.amount),
      category: formData.category,
      frequency: formData.frequency,
      startDate: new Date().toISOString(),
      nextDueDate: new Date(formData.nextDueDate).toISOString()
    });
    setFormData({
      name: '',
      amount: '',
      category: 'Otros',
      frequency: 'mensual',
      nextDueDate: format(new Date(), 'yyyy-MM-dd')
    });
    setShowForm(false);
  };

  const pendingPayments = payments.filter(p => !p.isPaid);
  const paidPayments = payments.filter(p => p.isPaid);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight uppercase">Control de Pagos</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Obligaciones y compromisos financieros</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-slate-950 font-black rounded hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-95 text-xs uppercase tracking-widest"
        >
          {showForm ? <Plus className="rotate-45 transition-transform" /> : <Plus />}
          Registrar nuevo
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Nombre del Concepto</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg py-3 px-4 focus:ring-1 focus:ring-emerald-500 outline-none text-sm font-bold"
                    placeholder="Ej. Alquiler, Netflix..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Monto del Pago</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">{userProfile?.currency}</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg py-3 pl-10 pr-4 focus:ring-1 focus:ring-emerald-500 outline-none tabular-nums font-black"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Próximo Vencimiento</label>
                  <input
                    type="date"
                    required
                    value={formData.nextDueDate}
                    onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg py-3 px-4 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Periodicidad</label>
                    <select
                      value={formData.frequency}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value as Frequency })}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg py-3 px-4 focus:ring-1 focus:ring-emerald-500 outline-none appearance-none font-bold text-xs uppercase tracking-widest"
                    >
                      {FREQUENCIES.map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Categoría</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg py-3 px-4 focus:ring-1 focus:ring-emerald-500 outline-none appearance-none font-bold text-xs uppercase tracking-widest"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                    </select>
                 </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 text-white font-black py-4 rounded-lg hover:bg-emerald-500 transition-all shadow-xl active:scale-95 uppercase tracking-[0.2em] text-xs"
              >
                PROCESAR ALTA DE PAGO
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pendientes */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 px-2 text-rose-500">
            <Clock size={16} />
            Pagos Pendientes
          </h3>
          <div className="space-y-3">
            {pendingPayments.map(p => (
              <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between group hover:border-rose-500/30 transition-all shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-950 rounded-lg text-slate-600 group-hover:text-rose-500 transition-colors border border-slate-800">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-white text-base tracking-tight">{p.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest bg-slate-950 px-1.5 py-0.5 rounded">{p.category}</span>
                      <span className="text-slate-800 tracking-tighter">|</span>
                      <span className="text-[9px] text-rose-400 font-bold uppercase tracking-widest flex items-center gap-1">
                        <Calendar size={10} />
                        Vence: {format(new Date(p.nextDueDate), 'dd MMM', { locale: es })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-3">
                  <p className="text-lg font-black text-white tabular-nums">{userProfile?.currency}{p.amount.toLocaleString()}</p>
                  <button 
                    onClick={() => markPaymentAsPaid(p.id)}
                    className="px-3 py-1.5 bg-emerald-500 text-slate-900 hover:bg-emerald-400 rounded text-[9px] font-black uppercase tracking-widest transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                  >
                    PAGAR AHORA
                  </button>
                </div>
              </div>
            ))}
            {pendingPayments.length === 0 && (
              <div className="p-12 text-center bg-slate-900/30 rounded-xl border-2 border-dashed border-slate-800 text-slate-600 uppercase text-[10px] font-black tracking-widest italic">
                Sin obligaciones pendientes.
              </div>
            )}
          </div>
        </div>

        {/* Historial de Pagos */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 px-2 text-emerald-500">
            <CheckCircle2 size={16} />
            Ejecuciones Recientes
          </h3>
          <div className="space-y-3">
            {paidPayments.map(p => (
              <div key={p.id} className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-5 flex items-center justify-between opacity-50 hover:opacity-100 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-500 border border-emerald-500/20">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-400 text-sm">{p.name}</p>
                    <p className="text-[9px] text-slate-600 mt-1 uppercase font-bold tracking-[0.2em]">{p.frequency}</p>
                  </div>
                </div>
                <p className="text-base font-black text-slate-500 tabular-nums">{userProfile?.currency}{p.amount.toLocaleString()}</p>
              </div>
            ))}
            {paidPayments.length === 0 && (
              <div className="p-12 text-center text-slate-700 uppercase text-[9px] font-black tracking-widest italic">
                Sin registros de ejecución.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
