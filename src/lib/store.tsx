import React, { createContext, useContext, useEffect, useState } from 'react';
import { Transaction, RecurringPayment, Budget, SavingGoal, User } from '../types';
import { supabase } from './supabase';
import { Session } from '@supabase/supabase-js';

interface FinanceContextType {
  currentUser: string | null;
  userProfile: User | null;
  transactions: Transaction[];
  payments: RecurringPayment[];
  budgets: Budget[];
  savings: SavingGoal[];
  loading: boolean;
  dbError: string | null;
  login: (email: string, password: string) => Promise<{ error: any }>;
  register: (email: string, password: string, profile: Partial<User>) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  addTransaction: (t: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addPayment: (p: Omit<RecurringPayment, 'id' | 'isPaid' | 'history'>) => Promise<void>;
  markPaymentAsPaid: (id: string) => Promise<void>;
  setBudget: (b: Omit<Budget, 'id'>) => Promise<void>;
  updateSaving: (id: string, amount: number) => Promise<void>;
  addSaving: (s: Omit<SavingGoal, 'id'>) => Promise<void>;
  updateProfile: (updatedUser: Partial<User>) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payments, setPayments] = useState<RecurringPayment[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savings, setSavings] = useState<SavingGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchAllData(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchAllData(session.user.id);
      else {
        setUserProfile(null);
        setTransactions([]);
        setPayments([]);
        setBudgets([]);
        setSavings([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAllData = async (userId: string) => {
    setLoading(true);
    setDbError(null);
    try {
      const [profileRes, transRes, payRes, budRes, savRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }),
        supabase.from('recurring_payments').select('*').eq('user_id', userId),
        supabase.from('budgets').select('*').eq('user_id', userId),
        supabase.from('savings').select('*').eq('user_id', userId)
      ]);

      if (profileRes.error && profileRes.error.code === '42P01') {
        setDbError('DATABASE_NOT_INITIALIZED');
        return;
      }

      if (profileRes.data) {
        setUserProfile({
          fullName: profileRes.data.full_name,
          username: profileRes.data.email || '', // map email to username field for compatibility
          currency: profileRes.data.currency,
          theme: profileRes.data.theme
        });
      }
      
      if (transRes.data) setTransactions(transRes.data);
      
      if (payRes.data) {
        setPayments(payRes.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          amount: p.amount,
          category: p.category,
          frequency: p.frequency,
          startDate: p.start_date || p.created_at,
          nextDueDate: p.due_date,
          isPaid: p.is_paid,
          history: [] // history not yet implemented in DB
        })));
      }
      
      if (budRes.data) setBudgets(budRes.data);
      
      if (savRes.data) {
        setSavings(savRes.data.map((s: any) => ({
          id: s.id,
          name: s.name,
          targetAmount: s.target_amount,
          currentAmount: s.current_amount,
          deadline: s.deadline
        })));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await supabase.auth.signInWithPassword({ email, password });
    return { error: response.error };
  };

  const register = async (email: string, password: string, profile: Partial<User>) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error };
    
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert([
        { 
          id: data.user.id, 
          full_name: profile.fullName,
          currency: profile.currency,
          theme: profile.theme
        }
      ]);
      if (profileError) return { error: profileError };
    }
    return { error: null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    if (!session) return;
    const { data, error } = await supabase.from('transactions').insert([
      { ...t, user_id: session.user.id }
    ]).select().single();
    
    if (!error && data) {
      setTransactions(prev => [data, ...prev]);
    }
  };

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const addPayment = async (p: Omit<RecurringPayment, 'id' | 'isPaid' | 'history'>) => {
    if (!session) return;
    const { data, error } = await supabase.from('recurring_payments').insert([
      { 
        user_id: session.user.id,
        name: p.name,
        amount: p.amount,
        category: p.category,
        frequency: p.frequency,
        due_date: p.nextDueDate,
        is_paid: false
      }
    ]).select().single();
    
    if (!error && data) {
      setPayments(prev => [...prev, {
        id: data.id,
        name: data.name,
        amount: data.amount,
        category: data.category,
        frequency: data.frequency,
        startDate: data.start_date || data.created_at,
        nextDueDate: data.due_date,
        isPaid: data.is_paid,
        history: []
      }]);
    }
  };

  const markPaymentAsPaid = async (id: string) => {
    const target = payments.find(p => p.id === id);
    if (!target || !session) return;

    const { error: payError } = await supabase.from('recurring_payments').update({ is_paid: true }).eq('id', id);
    if (payError) return;

    // Add transaction record
    await addTransaction({
      amount: target.amount,
      category: target.category,
      date: new Date().toISOString(),
      type: 'expense',
      description: `Pago recurrente: ${target.name}`
    });

    setPayments(prev => prev.map(p => p.id === id ? { ...p, isPaid: true } : p));
  };

  const setBudget = async (b: Omit<Budget, 'id'>) => {
    if (!session) return;
    const { data, error } = await supabase.from('budgets').upsert([
      { 
        user_id: session.user.id,
        category: b.category,
        amount: b.amount,
        month: b.month
      }
    ], { onConflict: 'user_id, category, month' }).select().single();

    if (!error && data) {
      setBudgets(prev => {
        const filtered = prev.filter(item => !(item.category === b.category && item.month === b.month));
        return [...filtered, data];
      });
    }
  };

  const addSaving = async (s: Omit<SavingGoal, 'id'>) => {
    if (!session) return;
    const { data, error } = await supabase.from('savings').insert([
      { 
        user_id: session.user.id,
        name: s.name,
        target_amount: s.targetAmount,
        current_amount: s.currentAmount,
        deadline: s.deadline
      }
    ]).select().single();

    if (!error && data) {
      setSavings(prev => [...prev, {
        id: data.id,
        name: data.name,
        targetAmount: data.target_amount,
        currentAmount: data.current_amount,
        deadline: data.deadline
      }]);
    }
  };

  const updateSaving = async (id: string, amount: number) => {
    const target = savings.find(s => s.id === id);
    if (!target) return;

    const newAmount = target.currentAmount + amount;
    const { error } = await supabase.from('savings').update({ current_amount: newAmount }).eq('id', id);

    if (!error) {
      setSavings(prev => prev.map(s => s.id === id ? { ...s, currentAmount: newAmount } : s));
    }
  };

  const updateProfile = async (updatedUser: Partial<User>) => {
    if (!session) return;
    const updateData: any = {};
    if (updatedUser.fullName) updateData.full_name = updatedUser.fullName;
    if (updatedUser.currency) updateData.currency = updatedUser.currency;
    if (updatedUser.theme) updateData.theme = updatedUser.theme;
    
    const { error } = await supabase.from('profiles').update({ ...updateData, updated_at: new Date() }).eq('id', session.user.id);
    if (!error) {
      setUserProfile(prev => prev ? { ...prev, ...updatedUser } : null);
    }
  };

  const value = {
    currentUser: session?.user.id || null,
    userProfile,
    transactions,
    payments,
    budgets,
    savings,
    loading,
    dbError,
    login,
    register,
    logout,
    addTransaction,
    deleteTransaction,
    addPayment,
    markPaymentAsPaid,
    setBudget,
    updateSaving,
    addSaving,
    updateProfile
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
