import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useFinance } from '../lib/store.tsx';
import { TrendingUp, User as UserIcon, Lock, Mail, BadgeDollarSign } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../types';
import { CURRENCIES } from '../constants';

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    password: '',
    confirmPassword: '',
    currency: '$'
  });
  const [error, setError] = useState('');
  const { register } = useFinance();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    const newUser: User = {
      fullName: formData.fullName,
      username: formData.username,
      currency: formData.currency,
      theme: 'dark'
    };

    if (register(newUser, formData.password)) {
      navigate('/');
    } else {
      setError('El nombre de usuario ya existe');
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
          <h1 className="text-3xl font-bold text-white tracking-tight">Crear Cuenta</h1>
          <p className="text-sm text-slate-400 mt-2">Comienza a gestionar tus finanzas hoy mismo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2 ml-1">Nombre Completo</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3.5 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all font-medium placeholder:text-slate-600 shadow-inner"
                placeholder="Tu nombre"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2 ml-1">Nombre de Usuario</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3.5 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all font-medium placeholder:text-slate-600 shadow-inner"
                placeholder="Ej. juan.perez"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2 ml-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3.5 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all font-medium placeholder:text-slate-600 shadow-inner"
                  placeholder="••••"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2 ml-1">Confirmar</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3.5 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all font-medium placeholder:text-slate-600 shadow-inner"
                  placeholder="••••"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2 ml-1">Tipo de Moneda</label>
            <div className="relative">
              <BadgeDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3.5 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all appearance-none font-semibold cursor-pointer shadow-inner"
              >
                {CURRENCIES.map(curr => (
                  <option key={curr.code} value={curr.symbol}>
                    {curr.name} ({curr.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="text-rose-500 text-xs font-bold text-center bg-rose-500/10 py-3 rounded-lg border border-rose-500/20 mt-2">{error}</p>}

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-all shadow-xl transform active:scale-[0.98] mt-4 text-lg"
          >
            Crear Mi Cuenta
          </button>
        </form>

        <div className="mt-10 text-center border-t border-slate-800 pt-8">
          <p className="text-slate-500 text-sm">
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className="text-emerald-500 hover:text-emerald-400 font-bold">
              Inicia Sesión
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
