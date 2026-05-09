import React, { useState } from 'react';
import { useFinance } from '../lib/store.tsx';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, PieChart as PieIcon, Wallet, Activity, Calendar } from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  subMonths, 
  isWithinInterval, 
  addMonths,
  eachMonthOfInterval
} from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  BarChart,
  Bar,
  Cell
} from 'recharts';

export default function MonthlyHistory() {
  const { transactions, userProfile } = useFinance();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const currentMonthStart = startOfMonth(selectedDate);
  const currentMonthEnd = endOfMonth(selectedDate);
  const prevMonthStart = startOfMonth(subMonths(selectedDate, 1));
  const prevMonthEnd = endOfMonth(subMonths(selectedDate, 1));

  const currentMonthTransactions = transactions.filter(t => 
    isWithinInterval(new Date(t.date), { start: currentMonthStart, end: currentMonthEnd })
  );

  const prevMonthTransactions = transactions.filter(t => 
    isWithinInterval(new Date(t.date), { start: prevMonthStart, end: prevMonthEnd })
  );

  const getStats = (ts: typeof transactions) => {
    const income = ts.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expenses = ts.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return { income, expenses, balance: income - expenses };
  };

  const stats = getStats(currentMonthTransactions);
  const prevStats = getStats(prevMonthTransactions);

  const calculateChange = (current: number, prev: number) => {
    if (prev === 0) return 0;
    return ((Number(current) - Number(prev)) / Number(prev)) * 100;
  };

  const incomeChange = calculateChange(stats.income, prevStats.income);
  const expensesChange = calculateChange(stats.expenses, prevStats.expenses);

  const expensesByCategory = Object.entries(
    currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
        return acc;
      }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value: Number(value) }))
    .sort((a, b) => Number(b.value) - Number(a.value));

  const top5Expenses = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, 5);

  const last6Months = eachMonthOfInterval({
    start: subMonths(selectedDate, 5),
    end: selectedDate
  }).map(month => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const monthTs = transactions.filter(t => 
      isWithinInterval(new Date(t.date), { start, end })
    );
    const { income, expenses } = getStats(monthTs);
    return {
      month: format(month, 'MMM', { locale: es }),
      income,
      expenses
    };
  });

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-10 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-white mb-2">Análisis de Operaciones</h2>
          <p className="text-slate-400 font-medium">Control exhaustivo y proyecciones de tu salud financiera</p>
        </div>
        
        <div className="flex items-center gap-2 p-1.5 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-sm">
          <button 
            onClick={() => setSelectedDate(subMonths(selectedDate, 1))}
            className="p-3 hover:bg-slate-800 rounded-2xl transition-all text-slate-400 hover:text-emerald-500 shadow-sm active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="px-6 flex flex-col items-center min-w-[180px]">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Periodo Actual</span>
            <span className="text-base font-bold text-white capitalize leading-none">
              {format(selectedDate, 'MMMM yyyy', { locale: es })}
            </span>
          </div>
          <button 
            onClick={() => setSelectedDate(addMonths(selectedDate, 1))}
            className="p-3 hover:bg-slate-800 rounded-2xl transition-all text-slate-400 hover:text-emerald-500 shadow-sm active:scale-95"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden group hover:bg-slate-900 transition-all backdrop-blur-md ring-1 ring-white/5"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="p-3.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-500">
              <TrendingUp size={24} />
            </div>
            <div className={`flex items-center text-xs font-bold px-3 py-1.5 rounded-full ${incomeChange >= 0 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
              {incomeChange >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-1" />}
              {Math.abs(incomeChange).toFixed(1)}%
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Ingresos Registrados</p>
          <h3 className="text-4xl font-bold text-white tabular-nums tracking-tighter">{userProfile?.currency}{stats.income.toLocaleString()}</h3>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden group hover:bg-slate-900 transition-all backdrop-blur-md ring-1 ring-white/5"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="p-3.5 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-rose-500">
              <TrendingDown size={24} />
            </div>
            <div className={`flex items-center text-xs font-bold px-3 py-1.5 rounded-full ${expensesChange <= 0 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
              {expensesChange <= 0 ? <ArrowDownRight className="w-3.5 h-3.5 mr-1" /> : <ArrowUpRight className="w-3.5 h-3.5 mr-1" />}
              {Math.abs(expensesChange).toFixed(1)}%
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Egresos Registrados</p>
          <h3 className="text-4xl font-bold text-white tabular-nums tracking-tighter">{userProfile?.currency}{stats.expenses.toLocaleString()}</h3>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden group hover:bg-slate-900 transition-all backdrop-blur-md ring-1 ring-white/5"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="p-3.5 bg-slate-800 rounded-2xl border border-slate-700 text-slate-400">
              <Wallet size={24} />
            </div>
            <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full border uppercase tracking-widest ${stats.balance >= 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
              {stats.balance >= 0 ? 'Eficiente' : 'En Déficit'}
            </span>
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Balance del Periodo</p>
          <h3 className="text-4xl font-bold text-white tabular-nums tracking-tighter">{userProfile?.currency}{stats.balance.toLocaleString()}</h3>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden ring-1 ring-white/5">
          <div className="flex items-center justify-between mb-10">
            <h4 className="text-sm font-bold uppercase tracking-[0.15em] flex items-center gap-3 text-slate-300">
              <Activity className="text-emerald-500 w-5 h-5" />
              Rendimiento Semestral
            </h4>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={last6Months}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dx={-10} className="font-medium tabular-nums" />
                <Tooltip 
                  cursor={{ stroke: '#1e293b', strokeWidth: 2 }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px', fontSize: '12px', color: '#cbd5e1', fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)' }}
                />
                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={4} dot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                <Line type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={4} dot={{ r: 6, fill: '#f43f5e', strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 8, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden ring-1 ring-white/5">
          <div className="flex items-center justify-between mb-10">
            <h4 className="text-sm font-bold uppercase tracking-[0.15em] flex items-center gap-3 text-slate-300">
              <PieIcon className="text-emerald-500 w-5 h-5" />
              Gastos por Categoría
            </h4>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={expensesByCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={110} tickLine={false} axisLine={false} className="font-bold" />
                <Tooltip 
                  cursor={{ fill: '#0f172a', opacity: 0.5 }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)' }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={28}>
                  {expensesByCategory.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-slate-900 rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl ring-1 ring-white/5">
           <div className="p-8 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
             <h4 className="text-sm font-bold uppercase tracking-widest text-slate-300">Movimientos de Mayor Impacto</h4>
             <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">Top 5 Gastos</span>
           </div>
           <div className="divide-y divide-slate-800/40">
             {top5Expenses.map((t, idx) => (
               <motion.div 
                 key={t.id} 
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: idx * 0.1 }}
                 className="p-8 flex items-center justify-between hover:bg-slate-800/30 transition-all group"
               >
                 <div className="flex items-center gap-5">
                   <div className="w-14 h-14 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center text-rose-500 group-hover:border-rose-500/30 transition-colors shadow-inner">
                     <ArrowDownRight size={24} />
                   </div>
                   <div>
                     <p className="font-bold text-white text-xl tracking-tight group-hover:text-rose-400 transition-colors">{t.description || t.category}</p>
                     <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest">{format(new Date(t.date), 'dd MMMM yyyy', { locale: es })}</p>
                   </div>
                 </div>
                 <div className="text-right">
                   <p className="font-bold text-rose-500 text-2xl tabular-nums">-{userProfile?.currency}{t.amount.toLocaleString()}</p>
                   <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-3 py-1 bg-slate-950 rounded-lg border border-slate-800 mt-2 inline-block shadow-sm">{t.category}</span>
                 </div>
               </motion.div>
             ))}
             {top5Expenses.length === 0 && (
               <div className="py-32 text-center text-slate-600 font-medium italic">No se registran egresos en este periodo</div>
             )}
           </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl flex flex-col items-center text-center relative overflow-hidden ring-1 ring-white/5">
             <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-6 shadow-xl shadow-emerald-500/5">
               <TrendingUp size={40} />
             </div>
             <p className="text-xs font-bold text-emerald-500/60 uppercase tracking-[0.2em] mb-2">Capacidad de Ahorro</p>
             <h3 className="text-4xl font-bold text-white tabular-nums tracking-tighter mb-2">
               {userProfile?.currency}{stats.balance > 0 ? stats.balance.toLocaleString() : '0'}
             </h3>
             <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">Recursos netos disponibles después de cubrir todos los egresos operativos del mes.</p>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl ring-1 ring-white/5">
            <h4 className="text-xs font-bold uppercase tracking-widest mb-8 text-slate-500 flex items-center gap-2">
              <Calendar size={14} />
              Principales Indicadores
            </h4>
            <div className="space-y-8">
              <div className="flex items-center justify-between group">
                <span className="text-slate-400 text-sm font-bold group-hover:text-slate-300 transition-colors">Volumen Transaccional</span>
                <span className="font-bold text-white text-xl tabular-nums bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">{currentMonthTransactions.length}</span>
              </div>
              <div className="flex items-center justify-between group">
                <span className="text-slate-400 text-sm font-bold group-hover:text-slate-300 transition-colors">Gasto Diario Promedio</span>
                <span className="font-bold text-white text-xl tabular-nums bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">{userProfile?.currency}{(stats.expenses / 30).toFixed(0)}</span>
              </div>
              <div className="flex items-center justify-between group">
                <span className="text-slate-400 text-sm font-bold group-hover:text-slate-300 transition-colors">Día Pico de Gasto</span>
                <div className="flex flex-col items-end">
                  <span className="font-bold text-white text-sm bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
                    {currentMonthTransactions
                      .filter(t => t.type === 'expense')
                      .sort((a, b) => b.amount - a.amount)[0]?.date 
                        ? format(new Date(currentMonthTransactions.filter(t => t.type === 'expense').sort((a, b) => b.amount - a.amount)[0].date), 'dd MMM', { locale: es })
                        : '---'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
