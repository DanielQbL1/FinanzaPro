import React, { useState } from 'react';
import { useFinance } from '../lib/store.tsx';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths 
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CreditCard, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function CalendarView() {
  const { payments, userProfile } = useFinance();
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  });

  const getPaymentsForDay = (day: Date) => {
    return payments.filter(p => isSameDay(new Date(p.nextDueDate), day));
  };

  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const selectedDayPayments = selectedDay ? getPaymentsForDay(selectedDay) : [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Calendario de Pagos</h2>
        <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 p-2 rounded-2xl">
          <button 
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-2 hover:bg-zinc-800 rounded-xl transition-all"
          >
            <ChevronLeft size={20} className="text-zinc-400" />
          </button>
          <span className="text-sm font-black uppercase tracking-widest min-w-32 text-center text-zinc-200">
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </span>
          <button 
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-2 hover:bg-zinc-800 rounded-xl transition-all"
          >
            <ChevronRight size={20} className="text-zinc-400" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 bg-zinc-800/50 border-b border-zinc-800">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
              <div key={day} className="py-4 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar days */}
          <div className="grid grid-cols-7">
            {days.map((day, i) => {
              const dayPayments = getPaymentsForDay(day);
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const hasPayments = dayPayments.length > 0;

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    "min-h-24 p-3 border-r border-b border-zinc-800/50 flex flex-col items-start transition-all hover:bg-zinc-800/30 text-left relative",
                    !isCurrentMonth && "opacity-20",
                    isSelected && "bg-emerald-500/5 ring-2 ring-emerald-500/20 z-10"
                  )}
                >
                  <span className={cn(
                    "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-lg mb-2",
                    isSameDay(day, new Date()) ? "bg-emerald-500 text-white" : "text-zinc-400",
                    isSelected && !isSameDay(day, new Date()) && "bg-zinc-800 text-emerald-500"
                  )}>
                    {format(day, 'd')}
                  </span>
                  
                  <div className="w-full space-y-1">
                    {dayPayments.slice(0, 2).map(p => (
                      <div key={p.id} className="w-full h-1.5 rounded-full bg-red-500/50" />
                    ))}
                    {dayPayments.length > 2 && (
                       <div className="text-[9px] font-black text-red-400">+{dayPayments.length - 2}</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Info */}
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-xl">
             <h3 className="text-xl font-bold mb-6 flex flex-col">
               <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1">
                 {selectedDay ? format(selectedDay, "EEEE d 'de' MMMM", { locale: es }) : 'Selecciona un día'}
               </span>
               Detalles del día
             </h3>

             <div className="space-y-4">
                {selectedDayPayments.length > 0 ? selectedDayPayments.map(p => (
                  <div key={p.id} className="p-4 bg-zinc-800/50 border border-zinc-700/50 rounded-2xl group hover:border-red-500/30 transition-all">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{p.category}</span>
                       <span className="text-sm font-bold text-white">{userProfile?.currency}{p.amount.toLocaleString()}</span>
                    </div>
                    <p className="font-bold text-zinc-100 mb-1">{p.name}</p>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                       <Clock size={12} className="text-red-400" />
                       Pagar pronto
                    </div>
                  </div>
                )) : (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-600">
                      <CreditCard size={20} />
                    </div>
                    <p className="text-zinc-500 text-sm italic">No hay pagos programados para este día</p>
                  </div>
                )}
             </div>
          </div>

          <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
             <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-2">Resumen Semanal</p>
             <p className="text-zinc-400 text-sm leading-relaxed">
               Tienes <span className="text-emerald-500 font-bold">{payments.filter(p => !p.isPaid).length} pagos pendientes</span> para este mes. Mantén tus finanzas bajo control.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
