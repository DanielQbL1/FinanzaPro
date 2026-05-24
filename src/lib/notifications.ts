import { RecurringPayment, Budget, Transaction, User } from '../types';
import { format, differenceInHours } from 'date-fns';

export interface NotificationPrefs {
  upcomingPayments: boolean;
  budgetAlerts: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  upcomingPayments: true,
  budgetAlerts: true,
};

// Check if notifications are supported by this browser
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

// Request user's permission for browser notifications
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  
  const permission = await Notification.requestPermission();
  return permission;
}

// Register the Service Worker in the client browser
export async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (!isNotificationSupported() || !('serviceWorker' in navigator)) {
    return null;
  }
  
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered successfully with scope:', registration.scope);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

// Triggers a native notification using Service Worker or falling back
export async function triggerBrowserNotification(title: string, body: string, tag?: string) {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== 'granted') return;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration && registration.active) {
      registration.active.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        body,
        tag: tag || 'finanzapro-default'
      });
    } else {
      new Notification(title, {
        body,
        tag: tag || 'finanzapro-default',
        icon: '/favicon.ico'
      });
    }
  } catch (e) {
    console.error('Failed to dispatch service worker notification, fallback to standard Web API:', e);
    try {
      new Notification(title, {
        body,
        tag: tag || 'finanzapro-default',
        icon: '/favicon.ico'
      });
    } catch (err) {
      console.error('All notification attempts failed:', err);
    }
  }
}

// Load user notification preferences from localized storage
export function loadNotificationPrefs(userId: string): NotificationPrefs {
  const stored = localStorage.getItem(`notif_prefs_${userId}`);
  if (!stored) return DEFAULT_PREFS;
  try {
    return { ...DEFAULT_PREFS, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_PREFS;
  }
}

// Save user notification preferences to localized storage
export function saveNotificationPrefs(userId: string, prefs: NotificationPrefs) {
  localStorage.setItem(`notif_prefs_${userId}`, JSON.stringify(prefs));
}

// Perform active checks for budgets reaching >= 80% limit
export function verifyAndNotifyBudgets(
  transactions: Transaction[],
  budgets: Budget[],
  userProfile: User | null,
  userId: string
) {
  if (!userId) return;
  const prefs = loadNotificationPrefs(userId);
  if (!prefs.budgetAlerts) return;

  const currentMonth = format(new Date(), 'yyyy-MM');
  const currentMonthTransactions = transactions.filter(t => 
    t.type === 'expense' && format(new Date(t.date), 'yyyy-MM') === currentMonth
  );

  let notifiedKeys: any = {};
  try {
    notifiedKeys = JSON.parse(localStorage.getItem(`notif_keys_budgets_${userId}`) || '{}');
  } catch {
    notifiedKeys = {};
  }

  budgets.forEach(b => {
    if (b.month !== currentMonth) return;
    
    const spent = currentMonthTransactions
      .filter(t => t.category === b.category)
      .reduce((acc, t) => acc + t.amount, 0);
    
    if (b.amount <= 0) return;
    const progress = (spent / b.amount) * 100;
    
    // Notify if expenditures >= 80% and not warned before this month
    if (progress >= 80) {
      const lockKey = `${b.category}_${currentMonth}`;
      if (!notifiedKeys[lockKey]) {
        const currency = userProfile?.currency || '$';
        const pctFormatted = progress.toFixed(0);
        const title = `⚠️ Límite de Presupuesto: ${b.category}`;
        const body = `Has alcanzado el ${pctFormatted}% de tu límite mensual para ${b.category} (${currency}${spent.toFixed(2)} de ${currency}${b.amount.toFixed(2)}).`;
        
        triggerBrowserNotification(title, body, `budget-${lockKey}`);
        
        // Pin lock key to prevent alert fatigue
        notifiedKeys[lockKey] = true;
        localStorage.setItem(`notif_keys_budgets_${userId}`, JSON.stringify(notifiedKeys));
      }
    }
  });
}

// Perform active checks on recurring payments matching the 24-hour advance limit
export function verifyAndNotifyPayments(
  payments: RecurringPayment[],
  userProfile: User | null,
  userId: string
) {
  if (!userId) return;
  const prefs = loadNotificationPrefs(userId);
  if (!prefs.upcomingPayments) return;

  const now = new Date();
  let notifiedKeys: any = {};
  try {
    notifiedKeys = JSON.parse(localStorage.getItem(`notif_keys_payments_${userId}`) || '{}');
  } catch {
    notifiedKeys = {};
  }

  payments.forEach(p => {
    if (p.isPaid) return;

    let dueDateStr = p.nextDueDate;
    if (dueDateStr.length === 10) {
      dueDateStr += 'T12:00:00';
    }
    const dueDate = new Date(dueDateStr);
    
    // Calculate difference in hours between payment date and current time
    const diffHours = differenceInHours(dueDate, now);
    
    // Match alerts falling strictly in the upcoming 0h - 24h window
    if (diffHours >= 0 && diffHours <= 24) {
      const lockKey = `${p.id}_${p.nextDueDate}`;
      if (!notifiedKeys[lockKey]) {
        const currency = userProfile?.currency || '$';
        const title = `📅 Pago Pendiente Próximo: ${p.name}`;
        const body = `Tu pago de ${currency}${p.amount.toFixed(2)} vence en menos de 24 horas (${p.category}). ¡Que no se te pase!`;
        
        triggerBrowserNotification(title, body, `payment-${lockKey}`);
        
        // Pin lock key to prevent alert fatigue
        notifiedKeys[lockKey] = true;
        localStorage.setItem(`notif_keys_payments_${userId}`, JSON.stringify(notifiedKeys));
      }
    }
  });
}
