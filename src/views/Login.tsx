import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useFinance } from '../lib/store.tsx';
import { TrendingUp, Lock, User as UserIcon } from 'lucide-react';
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
    const { error } = await login(email, password);
    if (!error) {
      navigate('/');
    } else {
      setError(error.message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos' : error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-slate-900">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-slate-900 rounded-xl border border-slate-800 p-10 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
        
        <div className="flex flex-col items-center mb-10">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl mb-4 shadow-xl">
            <TrendingUp className="text-emerald-500 w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">FinanzaPro</h1>
          <p className="text-sm text-slate-400 mt-2">Bienvenido de nuevo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2 ml-1">Correo Electrónico</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3.5 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all font-medium placeholder:text-slate-600 shadow-inner"
                placeholder="ejemplo@correo.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2 ml-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3.5 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all font-medium placeholder:text-slate-600 shadow-inner"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && <p className="text-rose-500 text-xs font-bold text-center bg-rose-500/10 py-3 rounded-lg border border-rose-500/20">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-4 rounded-xl transition-all shadow-xl transform active:scale-[0.98] text-lg"
          >
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-10 text-center border-t border-slate-800 pt-8">
          <p className="text-slate-500 text-sm">
            ¿No tienes una cuenta?{' '}
            <Link to="/register" className="text-emerald-500 hover:text-emerald-400 font-bold">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
