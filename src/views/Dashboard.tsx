import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useFinance } from '../lib/store.tsx';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  Target,
  PieChart as PieIcon,
  PlusCircle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Dashboard() {
  const { transactions, payments, budgets, userProfile } = useFinance();

  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const currentMonthTransactions = transactions.filter(t => 
    isWithinInterval(new Date(t.date), { start: currentMonthStart, end: currentMonthEnd })
  );

  const lastMonthTransactions = transactions.filter(t => 
    isWithinInterval(new Date(t.date), { start: lastMonthStart, end: lastMonthEnd })
  );

  const calculateStats = (ts: typeof transactions) => {
    const income = ts.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expenses = ts.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return { income, expenses, balance: income - expenses };
  };

  const currentStats = calculateStats(currentMonthTransactions);
  const lastStats = calculateStats(lastMonthTransactions);

  const totalBalance = transactions.reduce((acc, t) => 
    t.type === 'income' ? acc + t.amount : acc - t.amount, 0
  );

  const nextPayments = payments
    .filter(p => !p.isPaid)
    .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime())
    .slice(0, 5);

  const chartData = [
    { name: 'Ingresos', value: currentStats.income, color: '#10b981' },
    { name: 'Gastos', value: currentStats.expenses, color: '#f43f5e' } // rose-500
  ];

  const categoryData = Object.entries(
    currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-10">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-900/40 p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden group">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32 transition-colors duration-1000 group-hover:bg-emerald-500/10"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">¡Hola de nuevo, {userProfile?.fullName?.split(' ')[0] || 'Usuario'}!</h1>
            <p className="text-slate-400 mt-2 font-medium">Aquí tienes el resumen de tu actividad financiera para {format(now, 'MMMM', { locale: es })}.</p>
          </div>
          <div className="flex items-center gap-3 bg-slate-950/50 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm shadow-inner">
             <div className="text-right">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Estado del Sistema</p>
                <div className="flex items-center justify-end gap-2 text-xs font-bold text-emerald-400">
                   <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                   En Línea
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Total Balance Card */}
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl flex flex-col justify-between group overflow-hidden relative shadow-lg hover:shadow-2xl transition-all duration-500 ring-1 ring-white/5">
            <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 text-emerald-500">
              <Wallet size={160} />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Saldo Total</span>
            <div className="mt-8">
              <h2 className="text-4xl font-bold text-white tabular-nums tracking-tight mb-2">
                {userProfile?.currency}{totalBalance.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </h2>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-bold text-emerald-500 uppercase">
                <ArrowUpRight className="w-3 h-3" />
                Control Activo
              </div>
            </div>
          </div>

          {/* Monthly Income Card */}
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl flex flex-col justify-between shadow-lg hover:shadow-2xl transition-all ring-1 ring-white/5 group">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ingresos / Mes</span>
            <div className="mt-8">
              <h2 className="text-4xl font-bold text-emerald-500 tabular-nums tracking-tight">
                {userProfile?.currency}{currentStats.income.toLocaleString()}
              </h2>
              <div className="mt-6">
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden shadow-inner border border-slate-800/50">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '85%' }}
                    className="h-full bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Expense Card */}
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl flex flex-col justify-between shadow-lg hover:shadow-2xl transition-all ring-1 ring-white/5 group">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Gastos / Mes</span>
            <div className="mt-8">
              <h2 className="text-4xl font-bold text-rose-500 tabular-nums tracking-tight">
                {userProfile?.currency}{currentStats.expenses.toLocaleString()}
              </h2>
              <div className="mt-6">
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden shadow-inner border border-slate-800/50">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '45%' }}
                    className="h-full bg-rose-500 rounded-full shadow-[0_0_12px_rgba(244,63,94,0.4)]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upcomming Payments Sidebar Overlay Look */}
        <div className="lg:col-span-4 bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl ring-1 ring-white/5 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-xs uppercase tracking-[0.2em] text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              Cronograma
            </h3>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{nextPayments.length} Próximos</span>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar">
            {nextPayments.length > 0 ? nextPayments.map(p => (
              <div key={p.id} className="flex items-center justify-between p-4 bg-slate-950/40 rounded-2xl border border-slate-800/50 hover:bg-slate-950 hover:border-emerald-500/20 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 flex flex-col items-center justify-center border border-slate-800 group-hover:border-emerald-500/30">
                    <span className="text-[10px] font-bold text-slate-600 uppercase leading-none">Día</span>
                    <span className="text-xl font-bold text-white">{format(new Date(p.nextDueDate), 'dd')}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white truncate w-24 group-hover:text-emerald-400 transition-colors">{p.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">{format(new Date(p.nextDueDate), 'MMMM', { locale: es })}</p>
                  </div>
                </div>
                <span className="text-base font-bold text-rose-500">-{userProfile?.currency}{p.amount}</span>
              </div>
            )) : (
              <div className="text-center py-12 bg-slate-950/30 rounded-2xl border border-dashed border-slate-800">
                <p className="text-slate-500 text-sm italic font-medium">No hay cobros próximos</p>
              </div>
            )}
          </div>
          <button className="mt-8 w-full py-3 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all border border-slate-700/50">
            Gestionar Pagos
          </button>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-8 bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-xl ring-1 ring-white/5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
            <h3 className="font-bold text-sm uppercase tracking-widest text-slate-200">Balance Comparativo</h3>
            <div className="flex gap-6">
              <span className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span> Entradas
              </span>
              <span className="flex items-center gap-2 text-xs font-bold text-rose-400">
                <span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"></span> Salidas
              </span>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${userProfile?.currency}${v}`} />
                <Tooltip 
                  cursor={{ fill: '#020617', opacity: 0.5 }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px', padding: '12px', fontSize: '14px', fontWeight: 'bold' }}
                />
                <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={64}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Donut */}
        <div className="lg:col-span-4 bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-xl ring-1 ring-white/5 flex flex-col">
          <h3 className="font-bold text-sm uppercase tracking-widest text-slate-200 mb-8">Estructura Detallada</h3>
          <div className="h-80 relative flex items-center justify-center">
             {categoryData.length > 0 ? (
               <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      innerRadius={85}
                      outerRadius={115}
                      paddingAngle={10}
                      dataKey="value"
                      stroke="none"
                    >
                      {categoryData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Segmentos</p>
                  <p className="text-2xl font-bold text-white">{categoryData.length}</p>
                </div>
               </>
             ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-4 opacity-50">
                  <PieIcon size={48} strokeWidth={1.5} />
                  <p className="text-sm font-medium italic">Sin actividad registrada</p>
                </div>
             )}
          </div>
          <div className="mt-auto grid grid-cols-2 gap-3">
             {categoryData.slice(0, 4).map((c, i) => (
               <div key={c.name} className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                 <span className="text-[10px] font-bold text-slate-500 truncate uppercase tracking-tighter">{c.name}</span>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Enhanced Progress Tracking Grid */}
      <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-xl ring-1 ring-white/5 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 pointer-events-none">
          <Target size={200} />
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-600/10 rounded-2xl border border-emerald-500/20 shadow-lg">
              <Target className="text-emerald-500 w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white tracking-tight">Optimización Presupuestaria</h3>
              <p className="text-xs text-slate-500 font-medium">Estado de ejecución contra límites proyectados</p>
            </div>
          </div>
          <Link to="/budgets" className="px-6 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 uppercase tracking-widest transition-all shadow-xl flex items-center gap-3">
            Explorar Límites <ArrowUpRight size={14} />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {budgets.slice(0, 8).map(b => {
             const spent = currentMonthTransactions
               .filter(t => t.category === b.category && t.type === 'expense')
               .reduce((acc, t) => acc + t.amount, 0);
             const progress = Math.min((spent / b.amount) * 100, 100);
             const isWarning = progress >= 85;
             const isAlert = progress >= 100;

             return (
               <motion.div 
                 key={b.category} 
                 whileHover={{ y: -4 }}
                 className="p-6 bg-slate-950/40 rounded-2xl border border-slate-800/50 hover:border-emerald-500/30 hover:bg-slate-950 transition-all group"
               >
                 <div className="flex justify-between items-start mb-6">
                   <div className="min-w-0">
                     <p className="text-sm font-bold text-white truncate w-32 group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{b.category}</p>
                     <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">{userProfile?.currency}{b.amount} Límite</p>
                   </div>
                   <div className={cn("px-2 py-1 rounded-lg text-[10px] font-black tabular-nums border", isAlert ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : isWarning ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20")}>
                     {Math.round(progress)}%
                   </div>
                 </div>
                 <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                      <span>Utilizado</span>
                      <span className={cn(isAlert && "text-rose-500")}>{userProfile?.currency}{spent.toLocaleString()}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden shadow-inner border border-slate-900 p-0.5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className={cn(
                          "h-full rounded-full transition-all duration-1000 shadow-lg",
                          isAlert ? "bg-rose-500 shadow-rose-500/30" : isWarning ? "bg-amber-500 shadow-amber-500/30" : "bg-emerald-500 shadow-emerald-500/30"
                        )}
                      />
                    </div>
                 </div>
               </motion.div>
             );
          })}
          {budgets.length === 0 && (
            <div className="col-span-full py-16 text-center bg-slate-950/60 rounded-3xl border border-dashed border-slate-800/50 backdrop-blur-sm">
               <div className="w-16 h-16 bg-slate-900 rounded-full border border-slate-800 flex items-center justify-center mx-auto mb-6 shadow-2xl">
                 <Target className="text-slate-600 w-8 h-8 opacity-40" />
               </div>
               <p className="text-slate-400 font-bold text-base mb-2">No tienes presupuestos activos</p>
               <p className="text-slate-600 text-sm max-w-xs mx-auto mb-8 font-medium">Establece límites para tus categorías y mantén un control riguroso de tus egresos.</p>
               <Link to="/budgets" className="inline-flex items-center gap-3 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-emerald-500/10 active:scale-95">
                 Configurar Ahora <PlusCircle size={14} />
               </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
