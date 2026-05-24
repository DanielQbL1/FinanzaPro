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
  setBudget: (b: Budget) => Promise<void>;
  updateSaving: (id: string, amount: number) => Promise<void>;
  addSaving: (s: Omit<SavingGoal, 'id'>) => Promise<void>;
  updateProfile: (updatedUser: Partial<User>) => Promise<void>;
  localModeActive: boolean;
  setLocalModeActive: (active: boolean) => void;
  isSupabaseConfigured: boolean;
  exportData: () => string;
  importData: (json: string) => Promise<void>;
  importBackupAndLogin: (jsonString: string) => Promise<{ error: any }>;
  resetData: () => Promise<void>;
}

const isSupabaseConfigured = !!(
  import.meta.env.VITE_SUPABASE_URL && 
  !import.meta.env.VITE_SUPABASE_URL.includes('placeholder') && 
  import.meta.env.VITE_SUPABASE_ANON_KEY && 
  !import.meta.env.VITE_SUPABASE_ANON_KEY.includes('placeholder')
);

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [localModeActive, setLocalModeActive] = useState<boolean>(false);
  const [session, setSession] = useState<any>(null);
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
      if (session) {
        fetchAllData(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch((err) => {
      console.warn("Supabase auth error:", err);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchAllData(session.user.id);
      } else {
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

  // Register service worker on mount for push/web notifications
  useEffect(() => {
    import('./notifications').then(({ registerSW }) => {
      registerSW();
    });
  }, []);

  // Monitor transactions, budgets, and recurring payments for active notification conditions
  useEffect(() => {
    const userId = session?.user?.id;
    if (userId && !loading) {
      import('./notifications').then(({ verifyAndNotifyBudgets, verifyAndNotifyPayments }) => {
        verifyAndNotifyBudgets(transactions, budgets, userProfile, userId);
        verifyAndNotifyPayments(payments, userProfile, userId);
      });

      // Internal background interval check (every 2 minutes)
      const interval = setInterval(() => {
        import('./notifications').then(({ verifyAndNotifyBudgets, verifyAndNotifyPayments }) => {
          verifyAndNotifyBudgets(transactions, budgets, userProfile, userId);
          verifyAndNotifyPayments(payments, userProfile, userId);
        });
      }, 2 * 65 * 1000);

      return () => clearInterval(interval);
    }
  }, [transactions, budgets, payments, session, userProfile, loading]);

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

      if (
        (profileRes.error && profileRes.error.code === '42P01') ||
        (transRes.error && transRes.error.code === '42P01') ||
        (payRes.error && payRes.error.code === '42P01') ||
        (budRes.error && budRes.error.code === '42P01') ||
        (savRes.error && savRes.error.code === '42P01')
      ) {
        setDbError('DATABASE_NOT_INITIALIZED');
        return;
      }

      let userProfileData = profileRes.data;
      if (!userProfileData) {
        // Create a default profile reactively in case of database creation latency or trigger issues
        const sessionUser = (await supabase.auth.getSession()).data.session?.user;
        const defaultProfile = {
          id: userId,
          full_name: sessionUser?.user_metadata?.full_name || 'Usuario',
          currency: sessionUser?.user_metadata?.currency || '$',
          theme: sessionUser?.user_metadata?.theme || 'dark'
        };
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .upsert([defaultProfile])
          .select()
          .single();
        if (!insertError && newProfile) {
          userProfileData = newProfile;
        } else {
          userProfileData = {
            id: userId,
            full_name: defaultProfile.full_name,
            currency: defaultProfile.currency,
            theme: defaultProfile.theme
          };
        }
      }

      let userEmail = '';
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        userEmail = currentSession?.user?.email || '';
      } catch (e) {
        console.warn('Could not get session email:', e);
      }

      if (userProfileData) {
        setUserProfile({
          fullName: userProfileData.full_name || 'Usuario',
          username: userEmail || userProfileData.id || '',
          currency: userProfileData.currency || '$',
          theme: userProfileData.theme || 'dark'
        });
      }
      
      if (transRes.data) setTransactions(transRes.data.map((t: any) => ({
        ...t,
        amount: Number(t.amount)
      })));
      
      if (payRes.data) {
        setPayments(payRes.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          amount: Number(p.amount),
          category: p.category,
          frequency: p.frequency,
          startDate: p.start_date || p.created_at,
          nextDueDate: p.due_date,
          isPaid: p.is_paid,
          history: [] // history not yet implemented in DB
        })));
      }
      
      if (budRes.data) setBudgets(budRes.data.map((b: any) => ({
        ...b,
        amount: Number(b.amount)
      })));
      
      if (savRes.data) {
        setSavings(savRes.data.map((s: any) => ({
          id: s.id,
          name: s.name,
          targetAmount: Number(s.target_amount),
          currentAmount: Number(s.current_amount),
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
    try {
      const response = await supabase.auth.signInWithPassword({ email, password });
      if (!response.error && response.data?.session) {
        setSession(response.data.session);
        await fetchAllData(response.data.session.user.id);
      }
      return { error: response.error };
    } catch (err: any) {
      return { error: err };
    }
  };

  const register = async (email: string, password: string, profile: Partial<User>) => {
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            full_name: profile.fullName,
            currency: profile.currency || '$',
            theme: profile.theme || 'dark'
          }
        }
      });

      if (error) {
        return { error };
      }
      
      // Proactively upsert the profiles table directly to avoid any trigger lag issues
      if (data?.user) {
        const userId = data.user.id;
        const defaultProfile = {
          id: userId,
          full_name: profile.fullName || 'Usuario',
          currency: profile.currency || '$',
          theme: profile.theme || 'dark',
          updated_at: new Date()
        };
        const { error: profileError } = await supabase.from('profiles').upsert([defaultProfile]);
        if (profileError) {
          console.warn("Proactive profile creation failed, falling back to dynamic on-demand generation inside fetchAllData:", profileError);
        }

        // Wait for data load so screen shows when fully configured
        if (data.session) {
          setSession(data.session);
        }
        await fetchAllData(userId);
      }
      
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    if (!session) return;
    const userId = session.user.id;

    const { data, error } = await supabase.from('transactions').insert([
      { ...t, user_id: userId }
    ]).select().single();
    
    if (!error && data) {
      setTransactions(prev => [data, ...prev]);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!session) return;

    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const addPayment = async (p: Omit<RecurringPayment, 'id' | 'isPaid' | 'history'>) => {
    if (!session) return;
    const userId = session.user.id;

    const { data, error } = await supabase.from('recurring_payments').insert([
      { 
        user_id: userId,
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

  const setBudget = async (b: Budget) => {
    if (!session) return;
    const userId = session.user.id;

    const { data, error } = await supabase.from('budgets').upsert([
      { 
        user_id: userId,
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
    const userId = session.user.id;

    const { data, error } = await supabase.from('savings').insert([
      { 
        user_id: userId,
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
    if (!target || !session) return;

    const newAmount = target.currentAmount + amount;

    const { error } = await supabase.from('savings').update({ current_amount: newAmount }).eq('id', id);

    if (!error) {
      setSavings(prev => prev.map(s => s.id === id ? { ...s, currentAmount: newAmount } : s));
    }
  };

  const updateProfile = async (updatedUser: Partial<User>) => {
    if (!session) return;
    const userId = session.user.id;

    const updateData: any = {};
    if (updatedUser.fullName) updateData.full_name = updatedUser.fullName;
    if (updatedUser.currency) updateData.currency = updatedUser.currency;
    if (updatedUser.theme) updateData.theme = updatedUser.theme;
    
    const { error } = await supabase.from('profiles').update({ ...updateData, updated_at: new Date() }).eq('id', userId);
    if (!error) {
      setUserProfile(prev => prev ? { ...prev, ...updatedUser } : null);
    }
  };

  const exportData = async (): Promise<string> => {
    if (!session?.user?.id) return JSON.stringify({ error: "Sujeto no autenticado" });
    const userId = session.user.id;
    
    try {
      const [profileRes, transRes, payRes, budRes, savRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }),
        supabase.from('recurring_payments').select('*').eq('user_id', userId),
        supabase.from('budgets').select('*').eq('user_id', userId),
        supabase.from('savings').select('*').eq('user_id', userId)
      ]);

      const freshProfile = profileRes.data ? {
        fullName: profileRes.data.full_name || 'Usuario',
        username: session.user.email || profileRes.data.id || '',
        currency: profileRes.data.currency || '$',
        theme: profileRes.data.theme || 'dark'
      } : userProfile;

      const freshTransactions = transRes.data ? transRes.data.map((t: any) => ({
        ...t,
        amount: Number(t.amount)
      })) : transactions;

      const freshPayments = payRes.data ? payRes.data.map((p: any) => ({
        id: p.id,
        name: p.name,
        amount: Number(p.amount),
        category: p.category,
        frequency: p.frequency,
        startDate: p.start_date || p.created_at,
        nextDueDate: p.due_date,
        isPaid: p.is_paid,
        history: []
      })) : payments;

      const freshBudgets = budRes.data ? budRes.data.map((b: any) => ({
        ...b,
        amount: Number(b.amount)
      })) : budgets;

      const freshSavings = savRes.data ? savRes.data.map((s: any) => ({
        id: s.id,
        name: s.name,
        targetAmount: Number(s.target_amount),
        currentAmount: Number(s.current_amount),
        deadline: s.deadline
      })) : savings;

      const backupObj = {
        transactions: freshTransactions,
        payments: freshPayments,
        budgets: freshBudgets,
        savings: freshSavings,
        userProfile: freshProfile,
        version: '1.0.0'
      };
      
      // Sync local state as well
      setUserProfile(freshProfile);
      setTransactions(freshTransactions);
      setPayments(freshPayments);
      setBudgets(freshBudgets);
      setSavings(freshSavings);

      return JSON.stringify(backupObj, null, 2);
    } catch (e: any) {
      console.warn("Direct database fetch failed during export, falling back to state:", e);
      const backupObj = {
        transactions,
        payments,
        budgets,
        savings,
        userProfile,
        version: '1.0.0'
      };
      return JSON.stringify(backupObj, null, 2);
    }
  };

  const importData = async (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed) throw new Error('Data is empty');
      
      // Update states
      if (Array.isArray(parsed.transactions)) setTransactions(parsed.transactions);
      if (Array.isArray(parsed.payments)) setPayments(parsed.payments);
      if (Array.isArray(parsed.budgets)) setBudgets(parsed.budgets);
      if (Array.isArray(parsed.savings)) setSavings(parsed.savings);
      if (parsed.userProfile) setUserProfile(parsed.userProfile);

      if (session?.user?.id) {
        const userId = session.user.id;
        // If Supabase mode, try writing to DB table by table
        // Profiles upsert
        if (parsed.userProfile) {
          const updateFields = {
            id: userId,
            full_name: parsed.userProfile.fullName,
            currency: parsed.userProfile.currency,
            theme: parsed.userProfile.theme,
            updated_at: new Date()
          };
          await supabase.from('profiles').upsert([updateFields]);
        }

        // Transactions upsert/insert
        if (Array.isArray(parsed.transactions)) {
          await supabase.from('transactions').delete().eq('user_id', userId);
          const tRows = parsed.transactions.map((t: any) => ({
            user_id: userId,
            amount: t.amount,
            category: t.category,
            date: t.date,
            type: t.type,
            description: t.description
          }));
          if (tRows.length > 0) {
            await supabase.from('transactions').insert(tRows);
          }
        }

        // Payments
        if (Array.isArray(parsed.payments)) {
          await supabase.from('recurring_payments').delete().eq('user_id', userId);
          const pRows = parsed.payments.map((p: any) => ({
            user_id: userId,
            name: p.name,
            amount: p.amount,
            category: p.category,
            frequency: p.frequency,
            due_date: p.nextDueDate,
            is_paid: p.isPaid
          }));
          if (pRows.length > 0) {
            await supabase.from('recurring_payments').insert(pRows);
          }
        }

        // Budgets
        if (Array.isArray(parsed.budgets)) {
          await supabase.from('budgets').delete().eq('user_id', userId);
          const bRows = parsed.budgets.map((b: any) => ({
            user_id: userId,
            category: b.category,
            amount: b.amount,
            month: b.month
          }));
          if (bRows.length > 0) {
            await supabase.from('budgets').insert(bRows);
          }
        }

        // Savings
        if (Array.isArray(parsed.savings)) {
          await supabase.from('savings').delete().eq('user_id', userId);
          const sRows = parsed.savings.map((s: any) => ({
            user_id: userId,
            name: s.name,
            target_amount: s.targetAmount,
            current_amount: s.currentAmount,
            deadline: s.deadline
          }));
          if (sRows.length > 0) {
            await supabase.from('savings').insert(sRows);
          }
        }
      }
    } catch (err) {
      console.error('Failed to import backup data:', err);
      throw err;
    }
  };

  const importBackupAndLogin = async (jsonString: string): Promise<{ error: any }> => {
    // Deprecated for absolute cloud requirement
    return { error: { message: 'El Modo Local ha sido desactivado. Recuerda iniciar sesión con tu cuenta normal.' } };
  };

  const resetData = async () => {
    if (!session?.user?.id) return;
    const userId = session.user.id;
    await Promise.all([
      supabase.from('transactions').delete().eq('user_id', userId),
      supabase.from('recurring_payments').delete().eq('user_id', userId),
      supabase.from('budgets').delete().eq('user_id', userId),
      supabase.from('savings').delete().eq('user_id', userId)
    ]);
    setTransactions([]);
    setPayments([]);
    setBudgets([]);
    setSavings([]);
  };

  const value = {
    currentUser: session?.user?.id || null,
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
    updateProfile,
    localModeActive,
    setLocalModeActive,
    isSupabaseConfigured,
    exportData,
    importData,
    importBackupAndLogin,
    resetData
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
