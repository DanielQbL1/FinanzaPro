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
  exportData: () => string;
  importData: (json: string) => Promise<void>;
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
  const [localModeActive, setLocalModeActive] = useState<boolean>(() => {
    return !isSupabaseConfigured || localStorage.getItem('is_local_mode_forced') === 'true';
  });
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payments, setPayments] = useState<RecurringPayment[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savings, setSavings] = useState<SavingGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    if (!localModeActive) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session) {
          fetchAllData(session.user.id);
        } else {
          // If a local session also exists, fall back to that
          const savedLocalSession = localStorage.getItem('local_session');
          if (savedLocalSession) {
            try {
              const parsed = JSON.parse(savedLocalSession);
              setLocalModeActive(true);
              setSession(parsed);
              fetchAllDataLocal(parsed.user.id);
              return;
            } catch {}
          }
          setLoading(false);
        }
      }).catch((err) => {
        console.warn("Supabase auth error, falling back to local mode:", err);
        setLocalModeActive(true);
        const savedLocalSession = localStorage.getItem('local_session');
        if (savedLocalSession) {
          try {
            const parsed = JSON.parse(savedLocalSession);
            setSession(parsed);
            fetchAllDataLocal(parsed.user.id);
            return;
          } catch {}
        }
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!localModeActive) {
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
        }
      });

      return () => subscription.unsubscribe();
    } else {
      // Local Mode initialization on mount
      const savedLocalSession = localStorage.getItem('local_session');
      if (savedLocalSession) {
        try {
          const parsed = JSON.parse(savedLocalSession);
          setSession(parsed);
          fetchAllDataLocal(parsed.user.id);
        } catch {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
  }, [localModeActive]);

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
      }, 2 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [transactions, budgets, payments, session, userProfile, loading]);

  const fetchAllDataLocal = (userId: string) => {
    setLoading(true);
    setDbError(null);
    try {
      // Profile
      const savedProfile = localStorage.getItem(`local_profile_${userId}`);
      if (savedProfile) {
        setUserProfile(JSON.parse(savedProfile));
      } else {
        const users = JSON.parse(localStorage.getItem('local_users') || '[]');
        const thisUser = users.find((u: any) => u.email === userId);
        if (thisUser) {
          const profile = {
            fullName: thisUser.fullName,
            username: thisUser.email,
            currency: thisUser.currency || '$',
            theme: 'dark'
          };
          setUserProfile(profile);
          localStorage.setItem(`local_profile_${userId}`, JSON.stringify(profile));
        } else {
          setUserProfile({
            fullName: 'Usuario Local',
            username: userId,
            currency: '$',
            theme: 'dark'
          });
        }
      }

      // Transactions
      const savedTrans = localStorage.getItem(`local_transactions_${userId}`);
      setTransactions(savedTrans ? JSON.parse(savedTrans) : []);

      // Payments
      const savedPayments = localStorage.getItem(`local_payments_${userId}`);
      setPayments(savedPayments ? JSON.parse(savedPayments) : []);

      // Budgets
      const savedBudgets = localStorage.getItem(`local_budgets_${userId}`);
      setBudgets(savedBudgets ? JSON.parse(savedBudgets) : []);

      // Savings
      const savedSavings = localStorage.getItem(`local_savings_${userId}`);
      setSavings(savedSavings ? JSON.parse(savedSavings) : []);

    } catch (err) {
      console.error('Error fetching local data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async (userId: string) => {
    if (localModeActive) {
      fetchAllDataLocal(userId);
      return;
    }
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
      // Fallback to local mode on fetch error
      setLocalModeActive(true);
      fetchAllDataLocal(userId);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    if (localModeActive) {
      const users = JSON.parse(localStorage.getItem('local_users') || '[]');
      const found = users.find((u: any) => u.email === email && u.password === password);
      if (found) {
        const mockSess = { user: { id: email, email } };
        localStorage.setItem('local_session', JSON.stringify(mockSess));
        setSession(mockSess);
        fetchAllDataLocal(email);
        return { error: null };
      } else {
        return { error: { message: 'Correo o contraseña incorrectos' } };
      }
    }

    try {
      const response = await supabase.auth.signInWithPassword({ email, password });
      return { error: response.error };
    } catch (err: any) {
      // Fallback auto login locally on failure
      const users = JSON.parse(localStorage.getItem('local_users') || '[]');
      const found = users.find((u: any) => u.email === email && u.password === password);
      if (found) {
        setLocalModeActive(true);
        localStorage.setItem('is_local_mode_forced', 'true');
        const mockSess = { user: { id: email, email } };
        localStorage.setItem('local_session', JSON.stringify(mockSess));
        setSession(mockSess);
        fetchAllDataLocal(email);
        return { error: null };
      }
      return { error: err };
    }
  };

  const register = async (email: string, password: string, profile: Partial<User>) => {
    if (localModeActive) {
      const users = JSON.parse(localStorage.getItem('local_users') || '[]');
      const exists = users.some((u: any) => u.email === email);
      if (exists) {
        return { error: { message: 'El correo electrónico ya está registrado' } };
      }
      
      const newUser = {
        fullName: profile.fullName || 'Usuario',
        email,
        password,
        currency: profile.currency || '$',
        theme: 'dark'
      };
      users.push(newUser);
      localStorage.setItem('local_users', JSON.stringify(users));

      const mockSess = { user: { id: email, email } };
      localStorage.setItem('local_session', JSON.stringify(mockSess));
      
      setSession(mockSess);
      // Initialize profile
      const profUser = {
        fullName: newUser.fullName,
        username: email,
        currency: newUser.currency,
        theme: 'dark'
      };
      setUserProfile(profUser);
      localStorage.setItem(`local_profile_${email}`, JSON.stringify(profUser));
      
      // Initialize empty arrays
      localStorage.setItem(`local_transactions_${email}`, JSON.stringify([]));
      localStorage.setItem(`local_payments_${email}`, JSON.stringify([]));
      localStorage.setItem(`local_budgets_${email}`, JSON.stringify([]));
      localStorage.setItem(`local_savings_${email}`, JSON.stringify([]));
      
      setTransactions([]);
      setPayments([]);
      setBudgets([]);
      setSavings([]);
      
      return { error: null };
    }

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
        // Fallback to local registration if supabase registration failed (e.g. network/setup issue)
        console.warn("Supabase register error, falling back dynamically to local mode registration:", error);
        setLocalModeActive(true);
        localStorage.setItem('is_local_mode_forced', 'true');
        return register(email, password, profile);
      }
      return { error: null };
    } catch (err: any) {
      console.warn("Supabase register failure caught. Falling back dynamically to local mode registration.");
      setLocalModeActive(true);
      localStorage.setItem('is_local_mode_forced', 'true');
      return register(email, password, profile);
    }
  };

  const logout = async () => {
    if (localModeActive) {
      localStorage.removeItem('local_session');
      setSession(null);
      setUserProfile(null);
      setTransactions([]);
      setPayments([]);
      setBudgets([]);
      setSavings([]);
      return;
    }
    await supabase.auth.signOut();
  };

  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    if (!session) return;
    const userId = session.user.id;

    if (localModeActive) {
      const newTx: Transaction = {
        ...t,
        id: 'tx_' + Date.now() + Math.random().toString(36).substr(2, 5)
      };
      const updated = [newTx, ...transactions];
      setTransactions(updated);
      localStorage.setItem(`local_transactions_${userId}`, JSON.stringify(updated));
      return;
    }

    const { data, error } = await supabase.from('transactions').insert([
      { ...t, user_id: userId }
    ]).select().single();
    
    if (!error && data) {
      setTransactions(prev => [data, ...prev]);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!session) return;
    const userId = session.user.id;

    if (localModeActive) {
      const updated = transactions.filter(t => t.id !== id);
      setTransactions(updated);
      localStorage.setItem(`local_transactions_${userId}`, JSON.stringify(updated));
      return;
    }

    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const addPayment = async (p: Omit<RecurringPayment, 'id' | 'isPaid' | 'history'>) => {
    if (!session) return;
    const userId = session.user.id;

    if (localModeActive) {
      const newPayment: RecurringPayment = {
        id: 'pay_' + Date.now() + Math.random().toString(36).substr(2, 5),
        name: p.name,
        amount: Number(p.amount),
        category: p.category,
        frequency: p.frequency,
        startDate: p.startDate || new Date().toISOString(),
        nextDueDate: p.nextDueDate,
        isPaid: false,
        history: []
      };
      const updated = [...payments, newPayment];
      setPayments(updated);
      localStorage.setItem(`local_payments_${userId}`, JSON.stringify(updated));
      return;
    }

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
    const userId = session.user.id;

    if (localModeActive) {
      const updated = payments.map(p => p.id === id ? { ...p, isPaid: true } : p);
      setPayments(updated);
      localStorage.setItem(`local_payments_${userId}`, JSON.stringify(updated));
      await addTransaction({
        amount: target.amount,
        category: target.category,
        date: new Date().toISOString(),
        type: 'expense',
        description: `Pago recurrente: ${target.name}`
      });
      return;
    }

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

    if (localModeActive) {
      const newBudget: Budget = {
        category: b.category,
        amount: Number(b.amount),
        month: b.month
      };
      const filtered = budgets.filter(item => !(item.category === b.category && item.month === b.month));
      const updated = [...filtered, newBudget];
      setBudgets(updated);
      localStorage.setItem(`local_budgets_${userId}`, JSON.stringify(updated));
      return;
    }

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

    if (localModeActive) {
      const newSaving: SavingGoal = {
        id: 'sav_' + Date.now() + Math.random().toString(36).substr(2, 5),
        name: s.name,
        targetAmount: Number(s.targetAmount),
        currentAmount: Number(s.currentAmount),
        deadline: s.deadline
      };
      const updated = [...savings, newSaving];
      setSavings(updated);
      localStorage.setItem(`local_savings_${userId}`, JSON.stringify(updated));
      return;
    }

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
    const userId = session.user.id;

    const newAmount = target.currentAmount + amount;

    if (localModeActive) {
      const updated = savings.map(s => s.id === id ? { ...s, currentAmount: newAmount } : s);
      setSavings(updated);
      localStorage.setItem(`local_savings_${userId}`, JSON.stringify(updated));
      return;
    }

    const { error } = await supabase.from('savings').update({ current_amount: newAmount }).eq('id', id);

    if (!error) {
      setSavings(prev => prev.map(s => s.id === id ? { ...s, currentAmount: newAmount } : s));
    }
  };

  const updateProfile = async (updatedUser: Partial<User>) => {
    if (!session) return;
    const userId = session.user.id;

    if (localModeActive) {
      const updated = userProfile ? { ...userProfile, ...updatedUser } : null;
      setUserProfile(updated);
      localStorage.setItem(`local_profile_${userId}`, JSON.stringify(updated));
      return;
    }

    const updateData: any = {};
    if (updatedUser.fullName) updateData.full_name = updatedUser.fullName;
    if (updatedUser.currency) updateData.currency = updatedUser.currency;
    if (updatedUser.theme) updateData.theme = updatedUser.theme;
    
    const { error } = await supabase.from('profiles').update({ ...updateData, updated_at: new Date() }).eq('id', userId);
    if (!error) {
      setUserProfile(prev => prev ? { ...prev, ...updatedUser } : null);
    }
  };

  const exportData = () => {
    const backupObj = {
      transactions,
      payments,
      budgets,
      savings,
      userProfile,
      version: '1.0.0'
    };
    return JSON.stringify(backupObj, null, 2);
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

      // If in local mode, persist directly
      if (session?.user?.id) {
        const userId = session.user.id;
        if (localModeActive) {
          if (Array.isArray(parsed.transactions)) localStorage.setItem(`local_transactions_${userId}`, JSON.stringify(parsed.transactions));
          if (Array.isArray(parsed.payments)) localStorage.setItem(`local_payments_${userId}`, JSON.stringify(parsed.payments));
          if (Array.isArray(parsed.budgets)) localStorage.setItem(`local_budgets_${userId}`, JSON.stringify(parsed.budgets));
          if (Array.isArray(parsed.savings)) localStorage.setItem(`local_savings_${userId}`, JSON.stringify(parsed.savings));
          if (parsed.userProfile) localStorage.setItem(`local_profile_${userId}`, JSON.stringify(parsed.userProfile));
        } else {
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
      }
    } catch (err) {
      console.error('Failed to import backup data:', err);
      throw err;
    }
  };

  const resetData = async () => {
    if (!session?.user?.id) return;
    const userId = session.user.id;
    if (localModeActive) {
      localStorage.removeItem(`local_transactions_${userId}`);
      localStorage.removeItem(`local_payments_${userId}`);
      localStorage.removeItem(`local_budgets_${userId}`);
      localStorage.removeItem(`local_savings_${userId}`);
      
      setTransactions([]);
      setPayments([]);
      setBudgets([]);
      setSavings([]);
    } else {
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
    }
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
    exportData,
    importData,
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
