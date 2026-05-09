/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TransactionType = 'income' | 'expense';

export type Category = 
  | 'Gasolina/Combustible' 
  | 'Agua' 
  | 'Luz' 
  | 'Internet' 
  | 'Supermercado' 
  | 'Transporte' 
  | 'Alquiler' 
  | 'Ocio' 
  | 'Sueldo' 
  | 'Ventas' 
  | 'Otros';

export type Frequency = 'único' | 'diario' | 'quincenal' | 'mensual' | 'trimestral' | 'anual';

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: TransactionType;
  category: Category;
  description: string;
}

export interface RecurringPayment {
  id: string;
  name: string;
  amount: number;
  category: Category;
  frequency: Frequency;
  startDate: string;
  nextDueDate: string;
  isPaid: boolean;
  history: string[]; // IDs of transactions generated from this payment
}

export interface Budget {
  category: Category;
  amount: number;
  month: string; // YYYY-MM
}

export interface SavingGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
}

export interface User {
  fullName: string;
  username: string;
  currency: string;
  theme: 'light' | 'dark';
}

export interface AppData {
  users: Record<string, string>; // username -> password
  profiles: Record<string, User>; // username -> details
  transactions: Record<string, Transaction[]>; // username -> transactions
  recurringPayments: Record<string, RecurringPayment[]>; // username -> payments
  budgets: Record<string, Budget[]>; // username -> budgets
  savings: Record<string, SavingGoal[]>; // username -> savings
}
