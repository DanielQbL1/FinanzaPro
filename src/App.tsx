import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { FinanceProvider, useFinance } from './lib/store.tsx';
import { 
  LayoutDashboard, 
  PlusCircle, 
  MinusCircle, 
  CreditCard, 
  Calendar as CalendarIcon, 
  History, 
  PiggyBank, 
  Target, 
  Settings, 
  LogOut,
  Menu,
  X,
  TrendingDown,
  TrendingUp,
  FileText,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Views (To be created in next steps)
import Dashboard from './views/Dashboard';
import Login from './views/Login';
import Register from './views/Register';
import Transactions from './views/Transactions';
import HistoryView from './views/History';
import MonthlyHistory from './views/MonthlyHistory';
import Budgets from './views/Budgets';
import Payments from './views/Payments';
import CalendarView from './views/Calendar';
import Savings from './views/Savings';
import Config from './views/Config';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (o: boolean) => void }) {
  const location = useLocation();
  const { logout, userProfile } = useFinance();
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Ingresos/Gastos', path: '/transactions', icon: PlusCircle },
    { name: 'Próximos Pagos', path: '/payments', icon: CreditCard },
    { name: 'Calendario', path: '/calendar', icon: CalendarIcon },
    { name: 'Historial', path: '/history', icon: History },
    { name: 'Historial Mensual', path: '/monthly-history', icon: FileText },
    { name: 'Presupuestos', path: '/budgets', icon: Target },
    { name: 'Ahorros', path: '/savings', icon: PiggyBank },
    { name: 'Configuración', path: '/config', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={cn(
          "fixed top-0 left-0 h-full bg-slate-900/50 backdrop-blur-xl border-r border-slate-800/50 w-72 z-50 transition-transform lg:translate-x-0 lg:static flex flex-col shadow-2xl",
          !isOpen && "-translate-x-full"
        )}
      >
        <div className="p-8 flex items-center gap-4">
          <div className="p-2 bg-emerald-600 rounded-xl shadow-lg ring-4 ring-emerald-500/10">
            <TrendingUp className="text-white w-6 h-6" strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">FinanzaPro</span>
        </div>

        <nav className="flex-1 px-6 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="mb-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-4 py-2 block">Menú Principal</span>
            {menuItems.slice(0, 5).map((item) => (
              <SidebarLink key={item.path} item={item} active={location.pathname === item.path} setIsOpen={setIsOpen} />
            ))}
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-4 py-2 block">Analítica y Gestión</span>
            {menuItems.slice(5).map((item) => (
              <SidebarLink key={item.path} item={item} active={location.pathname === item.path} setIsOpen={setIsOpen} />
            ))}
          </div>
        </nav>

        <div className="p-6 mt-auto">
          <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold border-2 border-slate-900 shadow-md uppercase">
                {userProfile?.fullName?.[0] || '?'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-white truncate">{userProfile?.fullName || 'Usuario'}</span>
                <span className="text-[10px] text-slate-500 font-medium italic">En línea</span>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

const SidebarLink: React.FC<{ item: any; active: boolean; setIsOpen: (o: boolean) => void }> = ({ item, active, setIsOpen }) => {
  return (
    <Link
      to={item.path}
      onClick={() => setIsOpen(false)}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-semibold",
        active 
          ? "bg-emerald-600/10 text-emerald-400 shadow-sm border border-emerald-500/10" 
          : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
      )}
    >
      <item.icon className={cn("w-5 h-5", active ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300")} />
      <span>{item.name}</span>
      {active && <motion.div layoutId="sidebar-active" className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />}
    </Link>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useFinance();
  if (loading) return null;
  return currentUser ? <>{children}</> : <Navigate to="/login" />;
}

function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans selection:bg-emerald-500 selection:text-slate-900">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-900 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white bg-slate-900 rounded border border-slate-800 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider leading-none mb-1">Panel de Control</span>
              <span className="text-sm text-slate-300 font-semibold">
                {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <Link 
               to="/transactions"
               className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition-all shadow-lg active:scale-95"
             >
               <PlusCircle className="w-4 h-4" />
               <span className="text-xs font-bold">Nueva Operación</span>
             </Link>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
        className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl mb-6"
      >
        <TrendingUp className="text-emerald-500 w-12 h-12" />
      </motion.div>
      <p className="text-slate-400 font-bold tracking-widest uppercase text-xs animate-pulse">Cargando tu Pro</p>
    </div>
  );
}

function DatabaseSetupGuide() {
  const sql = `-- 1. Tablas Principales (con IF NOT EXISTS para evitar errores)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  currency text default '$',
  theme text default 'dark',
  updated_at timestamp with time zone default now()
);

create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  amount numeric not null,
  category text not null,
  date timestamp with time zone not null,
  type text check (type in ('income', 'expense')) not null,
  description text,
  created_at timestamp with time zone default now()
);

create table if not exists public.recurring_payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  amount numeric not null,
  category text not null,
  frequency text not null,
  due_date text not null,
  is_paid boolean default false,
  created_at timestamp with time zone default now()
);

create table if not exists public.budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  category text not null,
  amount numeric not null,
  month text not null,
  created_at timestamp with time zone default now(),
  unique(user_id, category, month)
);

create table if not exists public.savings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  target_amount numeric not null,
  current_amount numeric default 0,
  deadline text,
  category text,
  created_at timestamp with time zone default now()
);

-- 2. Habilitar Seguridad (RLS)
alter table public.profiles enable row level security;
alter table public.transactions enable row level security;
alter table public.recurring_payments enable row level security;
alter table public.budgets enable row level security;
alter table public.savings enable row level security;

-- 3. Políticas de Seguridad (con comprobación de existencia)
do $$ 
begin
  if not exists (select 1 from pg_policies where policyname = 'Users can manage their own profile') then
    create policy "Users can manage their own profile" on public.profiles for all using (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can manage their own transactions') then
    create policy "Users can manage their own transactions" on public.transactions for all using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can manage their own recurring payments') then
    create policy "Users can manage their own recurring payments" on public.recurring_payments for all using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can manage their own budgets') then
    create policy "Users can manage their own budgets" on public.budgets for all using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can manage their own savings') then
    create policy "Users can manage their own savings" on public.savings for all using (auth.uid() = user_id);
  end if;
end $$;

-- 4. Función y Trigger para creación automática de perfil
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, currency, theme)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Usuario'),
    coalesce(new.raw_user_meta_data->>'currency', '$'),
    coalesce(new.raw_user_meta_data->>'theme', 'dark')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();`;

  return (
    <div className="min-h-screen bg-slate-950 p-6 flex items-center justify-center">
      <div className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-amber-500/10 rounded-2xl">
            <Settings className="text-amber-500 w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Configuración de Supabase</h1>
            <p className="text-slate-400">Sigue estos pasos para activar tu base de datos y evitar errores de registro.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center text-sm">1</span>
              Ajustes de Autenticación
            </h2>
            <p className="text-slate-400 text-sm mb-4">
              En tu dashboard de Supabase ve a <b>Authentication › Settings › Email Auth</b>:
            </p>
            <ul className="text-slate-400 text-xs space-y-2 list-disc list-inside">
              <li><b>Enable Email Signup:</b> Mantener ACTIVADO.</li>
              <li><b>Confirm email:</b> DESACTIVAR (esto quita la verificación).</li>
            </ul>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center text-sm">2</span>
              Copia y corre este SQL
            </h2>
            <div className="relative group">
               <pre className="bg-black/50 p-4 rounded-xl text-slate-400 text-xs overflow-x-auto max-h-60 custom-scrollbar font-mono">
                {sql}
              </pre>
              <button 
                onClick={() => navigator.clipboard.writeText(sql)}
                className="absolute top-2 right-2 px-3 py-1.5 bg-emerald-500 rounded-lg text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity font-bold text-[10px] uppercase tracking-wider"
              >
                Copiar SQL
              </button>
            </div>
            <p className="text-slate-500 text-[10px] mt-4 italic">* Es importante incluir el <b>Trigger</b> al final para que el registro funcione correctamente.</p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
             <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center text-sm">3</span>
              Enlace al Panel
            </h2>
            <a 
              href="https://app.supabase.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-emerald-500 font-bold hover:underline"
            >
              Abrir Panel de Supabase <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
          
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-all shadow-xl transform active:scale-[0.98]"
          >
            Ya configuré todo, entrar ahora
          </button>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { loading, dbError } = useFinance();

  if (loading) return <LoadingScreen />;
  if (dbError === 'DATABASE_NOT_INITIALIZED') return <DatabaseSetupGuide />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={
          <PrivateRoute>
            <MainLayout><Dashboard /></MainLayout>
          </PrivateRoute>
        } />
        <Route path="/transactions" element={
          <PrivateRoute>
            <MainLayout><Transactions /></MainLayout>
          </PrivateRoute>
        } />
        <Route path="/payments" element={
          <PrivateRoute>
            <MainLayout><Payments /></MainLayout>
          </PrivateRoute>
        } />
        <Route path="/calendar" element={
          <PrivateRoute>
            <MainLayout><CalendarView /></MainLayout>
          </PrivateRoute>
        } />
        <Route path="/history" element={
          <PrivateRoute>
            <MainLayout><HistoryView /></MainLayout>
          </PrivateRoute>
        } />
        <Route path="/monthly-history" element={
          <PrivateRoute>
            <MainLayout><MonthlyHistory /></MainLayout>
          </PrivateRoute>
        } />
        <Route path="/budgets" element={
          <PrivateRoute>
            <MainLayout><Budgets /></MainLayout>
          </PrivateRoute>
        } />
        <Route path="/savings" element={
          <PrivateRoute>
            <MainLayout><Savings /></MainLayout>
          </PrivateRoute>
        } />
        <Route path="/config" element={
          <PrivateRoute>
            <MainLayout><Config /></MainLayout>
          </PrivateRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
}
