import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppData, Transaction, RecurringPayment, Budget, SavingGoal, User } from '../types';

interface FinanceContextType {
  currentUser: string | null;
  userProfile: User | null;
  transactions: Transaction[];
  payments: RecurringPayment[];
  budgets: Budget[];
  savings: SavingGoal[];
  login: (username: string, password: string) => boolean;
  register: (user: User, password: string) => boolean;
  logout: () => void;
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  addPayment: (p: Omit<RecurringPayment, 'id' | 'isPaid' | 'history'>) => void;
  markPaymentAsPaid: (id: string) => void;
  setBudget: (b: Budget) => void;
  updateSaving: (id: string, amount: number) => void;
  addSaving: (s: Omit<SavingGoal, 'id'>) => void;
  exportData: () => string;
  importData: (json: string) => void;
  resetData: () => void;
  updateProfile: (updatedUser: Partial<User>) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const INITIAL_DATA: AppData = {
  users: {},
  profiles: {},
  transactions: {},
  recurringPayments: {},
  budgets: {},
  savings: {}
};

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem('finanzapro_data');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });

  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return localStorage.getItem('finanzapro_user');
  });

  useEffect(() => {
    localStorage.setItem('finanzapro_data', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('finanzapro_user', currentUser);
    } else {
      localStorage.removeItem('finanzapro_user');
    }
  }, [currentUser]);

  const login = (username: string, password: string) => {
    if (data.users[username] === password) {
      setCurrentUser(username);
      return true;
    }
    return false;
  };

  const register = (user: User, password: string) => {
    if (data.users[user.username]) return false;
    setData(prev => ({
      ...prev,
      users: { ...prev.users, [user.username]: password },
      profiles: { ...prev.profiles, [user.username]: user },
      transactions: { ...prev.transactions, [user.username]: [] },
      recurringPayments: { ...prev.recurringPayments, [user.username]: [] },
      budgets: { ...prev.budgets, [user.username]: [] },
      savings: { ...prev.savings, [user.username]: [] }
    }));
    setCurrentUser(user.username);
    return true;
  };

  const logout = () => setCurrentUser(null);

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    if (!currentUser) return;
    const newT: Transaction = { ...t, id: crypto.randomUUID() };
    setData(prev => ({
      ...prev,
      transactions: {
        ...prev.transactions,
        [currentUser]: [newT, ...(prev.transactions[currentUser] || [])]
      }
    }));
  };

  const deleteTransaction = (id: string) => {
    if (!currentUser) return;
    setData(prev => ({
      ...prev,
      transactions: {
        ...prev.transactions,
        [currentUser]: prev.transactions[currentUser].filter(t => t.id !== id)
      }
    }));
  };

  const addPayment = (p: Omit<RecurringPayment, 'id' | 'isPaid' | 'history'>) => {
    if (!currentUser) return;
    const newP: RecurringPayment = { ...p, id: crypto.randomUUID(), isPaid: false, history: [] };
    setData(prev => ({
      ...prev,
      recurringPayments: {
        ...prev.recurringPayments,
        [currentUser]: [...(prev.recurringPayments[currentUser] || []), newP]
      }
    }));
  };

  const markPaymentAsPaid = (id: string) => {
    if (!currentUser) return;
    setData(prev => {
      const userPayments = prev.recurringPayments[currentUser] || [];
      const updated = userPayments.map(p => {
        if (p.id === id) {
          // Generate transaction
          const t: Transaction = {
            id: crypto.randomUUID(),
            amount: p.amount,
            category: p.category,
            date: new Date().toISOString(),
            type: 'expense',
            description: `Pago recurrente: ${p.name}`
          };
          return { ...p, isPaid: true, history: [...p.history, t.id] };
        }
        return p;
      });

      // Also add to transactions
      const target = userPayments.find(p => p.id === id);
      const newTransactions = [...(prev.transactions[currentUser] || [])];
      if (target) {
        newTransactions.unshift({
           id: crypto.randomUUID(),
           amount: target.amount,
           category: target.category,
           date: new Date().toISOString(),
           type: 'expense',
           description: `Pago recurrente: ${target.name}`
        });
      }

      return {
        ...prev,
        recurringPayments: { ...prev.recurringPayments, [currentUser]: updated },
        transactions: { ...prev.transactions, [currentUser]: newTransactions }
      };
    });
  };

  const setBudget = (b: Budget) => {
    if (!currentUser) return;
    setData(prev => {
      const filtered = (prev.budgets[currentUser] || []).filter(
        item => !(item.category === b.category && item.month === b.month)
      );
      return {
        ...prev,
        budgets: { ...prev.budgets, [currentUser]: [...filtered, b] }
      };
    });
  };

  const addSaving = (s: Omit<SavingGoal, 'id'>) => {
     if (!currentUser) return;
     const newS = { ...s, id: crypto.randomUUID() };
     setData(prev => ({
       ...prev,
       savings: { ...prev.savings, [currentUser]: [...(prev.savings[currentUser] || []), newS] }
     }));
  };

  const updateSaving = (id: string, amount: number) => {
    if (!currentUser) return;
    setData(prev => ({
      ...prev,
      savings: {
        ...prev.savings,
        [currentUser]: (prev.savings[currentUser] || []).map(s => 
          s.id === id ? { ...s, currentAmount: s.currentAmount + amount } : s
        )
      }
    }));
  };

  const exportData = () => JSON.stringify(data);
  const importData = (json: string) => setData(JSON.parse(json));
  const resetData = () => setData(INITIAL_DATA);

  const updateProfile = (updatedUser: Partial<User>) => {
    if (!currentUser) return;
    setData(prev => ({
      ...prev,
      profiles: {
        ...prev.profiles,
        [currentUser]: { ...prev.profiles[currentUser], ...updatedUser }
      }
    }));
  };

  const value = {
    currentUser,
    userProfile: currentUser ? data.profiles[currentUser] : null,
    transactions: currentUser ? data.transactions[currentUser] || [] : [],
    payments: currentUser ? data.recurringPayments[currentUser] || [] : [],
    budgets: currentUser ? data.budgets[currentUser] || [] : [],
    savings: currentUser ? data.savings[currentUser] || [] : [],
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
    exportData,
    importData,
    resetData,
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
