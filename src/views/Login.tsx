import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useFinance } from '../lib/store.tsx';
import { TrendingUp, Lock, User as UserIcon, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useFinance();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    let displayError = '';
    const { error: loginErr } = await login(email, password);
    if (!loginErr) {
      navigate('/');
    } else {
      const msg = loginErr.message || '';
      if (msg === 'Invalid login credentials' || msg.includes('invalid_ref_or_credentials') || msg.includes('invalid_credentials') || msg.includes('Invalid claims')) {
        displayError = 'Correo o contraseña incorrectos. Por favor, verifica tus credenciales.';
      } else if (msg.includes('Email not confirmed')) {
        displayError = 'Tu correo aún no ha sido verificado en Supabase. Configura Supabase para desactivar "Confirm email" o revisa tu bandeja de entrada.';
      } else if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        displayError = 'Error de conexión con la base de datos Supabase. Inténtalo de nuevo.';
      } else {
        displayError = msg || 'Error al iniciar sesión';
      }
      setError(displayError);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-emerald-500 selection:text-slate-900">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-slate-900 rounded-xl border border-slate-800 p-8 sm:p-10 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
        
        <div className="flex flex-col items-center mb-6">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl mb-4 shadow-xl">
            <TrendingUp className="text-emerald-500 w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">FinanzaPro</h1>
          <p className="text-sm text-slate-400 mt-2">Control Financiero Inteligente</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[11px] uppercase tracking-widest font-black text-slate-400 mb-2 ml-1">Correo Electrónico</label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3.5 pl-11 pr-4 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all font-medium placeholder:text-slate-600 shadow-inner"
                placeholder="ejemplo@correo.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-widest font-black text-slate-400 mb-2 ml-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3.5 pl-11 pr-4 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all font-medium placeholder:text-slate-600 shadow-inner"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="text-rose-400 text-xs font-semibold bg-rose-500/10 p-3.5 rounded-xl border border-rose-500/25 leading-relaxed">
              <div className="flex gap-2 items-start">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span>{error}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-850 disabled:text-slate-600 text-slate-950 font-black uppercase tracking-widest py-4 rounded-xl transition-all shadow-xl transform active:scale-[0.98] text-xs"
          >
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-800/60 pt-6">
          <p className="text-slate-500 text-xs font-semibold">
            ¿No tienes una cuenta?{' '}
            <Link to="/register" className="text-emerald-500 hover:text-emerald-400 font-bold ml-1">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
