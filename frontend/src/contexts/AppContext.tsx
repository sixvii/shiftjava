import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { Job, Shift, ShiftTemplate, Expense, UserSettings, ActiveShift, AppUser } from '@/types';
import { getCurrencySymbol } from '@/types';
import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';

interface AppState {
  user: AppUser | null;
  jobs: Job[];
  shifts: Shift[];
  templates: ShiftTemplate[];
  expenses: Expense[];
  settings: UserSettings;
  activeShift: ActiveShift | null;
}

interface AppContextType extends AppState {
  isBootstrapping: boolean;
  isLoading: boolean;
  currencySymbol: string;
  login: (usernameOrEmail: string, password: string) => Promise<string | null>;
  signup: (username: string, email: string, password: string) => Promise<string | null>;
  requestPasswordReset: (email: string) => Promise<string | null>;
  resetPassword: (token: string, password: string) => Promise<string | null>;
  deleteAccount: (password: string) => Promise<string | null>;
  logout: () => void;
  addJob: (job: Omit<Job, 'id'>) => void;
  updateJob: (job: Job) => void;
  deleteJob: (id: string) => void;
  addShift: (shift: Omit<Shift, 'id'>) => void;
  updateShift: (shift: Shift) => void;
  deleteShift: (id: string) => void;
  addTemplate: (t: Omit<ShiftTemplate, 'id'>) => void;
  deleteTemplate: (id: string) => void;
  addExpense: (e: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;
  updateSettings: (s: Partial<UserSettings>) => void;
  startLiveShift: (jobId: string) => void;
  stopLiveShift: () => void;
  getJobById: (id: string) => Job | undefined;
}

const defaultSettings: UserSettings = {
  name: '',
  country: 'US',
  taxRate: 0,
  insuranceRate: 0,
  otherDeductions: 0,
};

const AppContext = createContext<AppContextType | null>(null);

const TEMPLATES_KEY = 'st_templates';
const ACTIVE_SHIFT_KEY = 'st_active';
const ACCESS_TOKEN_KEY = 'st_access_token';
const REFRESH_TOKEN_KEY = 'st_refresh_token';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081';

type BackendAuthResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  userId: string;
  username: string;
  email: string;
};

type BackendMessageResponse = {
  message: string;
};

type BackendSettings = {
  name: string;
  country: string;
  taxRate: number;
  insuranceRate: number;
  otherDeductions: number;
};

type BackendMeResponse = {
  id: string;
  username: string;
  email: string;
  settings: BackendSettings;
};

type BackendJob = {
  id: string;
  name: string;
  hourlyRate: number;
  colorTag: string;
};

type BackendShift = {
  id: string;
  jobId: string;
  date: string;
  startTime: string;
  endTime: string;
  tips: number;
  premiums: number;
};

type BackendExpense = {
  id: string;
  date: string;
  amount: number;
  category: string;
  note: string | null;
};

const load = <T,>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
};

const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

const setTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

const toLocalTime = (isoDateTime: string) => isoDateTime.slice(11, 16);
const toLocalDateTime = (date: string, time: string) => `${date}T${time}:00`;

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }
  return fallback;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(Boolean(getAccessToken()));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [templates, setTemplates] = useState<ShiftTemplate[]>(() => load(TEMPLATES_KEY, []));
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [activeShift, setActiveShift] = useState<ActiveShift | null>(() => load(ACTIVE_SHIFT_KEY, null));

  useEffect(() => { localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates)); }, [templates]);
  useEffect(() => { localStorage.setItem(ACTIVE_SHIFT_KEY, JSON.stringify(activeShift)); }, [activeShift]);

  const currencySymbol = getCurrencySymbol(settings.country);

  const clearSession = useCallback(() => {
    clearTokens();
    setUser(null);
    setJobs([]);
    setShifts([]);
    setExpenses([]);
    setSettings(defaultSettings);
    setActiveShift(null);
  }, []);

  const deleteAccount = async (password: string): Promise<string | null> => {
    try {
      await apiRequest<void>('/api/me', {
        method: 'DELETE',
        body: JSON.stringify({ password }),
      });
      clearSession();
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : 'Unable to delete account';
    }
  };

  const refreshAccess = useCallback(async (): Promise<string | null> => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearSession();
      return null;
    }

    const data = await response.json() as BackendAuthResponse;
    setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  }, [clearSession]);

  const apiRequest = useCallback(async <T,>(
    path: string,
    init: RequestInit = {},
    allowRefresh = true,
  ): Promise<T> => {
    const accessToken = getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string> ?? {}),
    };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    let response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

    if (response.status === 401 && allowRefresh && !path.startsWith('/api/auth/')) {
      const newAccessToken = await refreshAccess();
      if (newAccessToken) {
        response = await fetch(`${API_BASE_URL}${path}`, {
          ...init,
          headers: { ...headers, Authorization: `Bearer ${newAccessToken}` },
        });
      }
    }

    if (!response.ok) {
      let message = `Request failed (${response.status})`;
      try {
        const body = await response.json() as { message?: string; error?: string };
        message = body.message || body.error || message;
      } catch {
        // Ignore JSON parse failure and keep fallback message.
      }
      throw new Error(message);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return await response.json() as T;
  }, [refreshAccess]);

  const mapBackendJob = (job: BackendJob): Job => ({
    id: String(job.id),
    name: job.name,
    hourlyRate: job.hourlyRate,
    colorTag: job.colorTag,
  });

  const mapBackendShift = (shift: BackendShift): Shift => ({
    id: String(shift.id),
    jobId: String(shift.jobId),
    date: shift.date,
    startTime: toLocalTime(shift.startTime),
    endTime: toLocalTime(shift.endTime),
    breakMinutes: 0,
    tips: shift.tips,
    premiums: shift.premiums,
  });

  const mapBackendExpense = (expense: BackendExpense): Expense => ({
    id: String(expense.id),
    date: expense.date,
    amount: expense.amount,
    category: expense.category,
    description: expense.note ?? '',
  });

  const showMutationError = (
    actionLabel: string,
    err: unknown,
    retry: () => void,
  ) => {
    toast({
      variant: 'destructive',
      title: `${actionLabel} failed`,
      description: `${getErrorMessage(err, 'Please check your connection and try again.')} Tap Retry to attempt the request again.`,
      action: (
        <ToastAction altText={`Retry ${actionLabel}`} onClick={retry}>
          Retry
        </ToastAction>
      ),
    });
  };

  const loadServerState = useCallback(async () => {
    const me = await apiRequest<BackendMeResponse>('/api/me');
    setUser({ id: String(me.id), username: me.username, email: me.email });
    setSettings({
      name: me.settings.name,
      country: me.settings.country,
      taxRate: me.settings.taxRate,
      insuranceRate: me.settings.insuranceRate,
      otherDeductions: me.settings.otherDeductions,
    });

    const [backendJobs, backendShifts, backendExpenses] = await Promise.all([
      apiRequest<BackendJob[]>('/api/jobs'),
      apiRequest<BackendShift[]>('/api/shifts'),
      apiRequest<BackendExpense[]>('/api/expenses'),
    ]);

    setJobs(backendJobs.map(mapBackendJob));
    setShifts(backendShifts.map(mapBackendShift));
    setExpenses(backendExpenses.map(mapBackendExpense));
  }, [apiRequest]);

  useEffect(() => {
    const bootstrap = async () => {
      if (!getAccessToken()) {
        setIsBootstrapping(false);
        return;
      }

      try {
        await loadServerState();
      } catch {
        clearSession();
      } finally {
        setIsBootstrapping(false);
      }
    };

    void bootstrap();
  }, [clearSession, loadServerState]);

  const login = async (usernameOrEmail: string, password: string): Promise<string | null> => {
    try {
      const data = await apiRequest<BackendAuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ usernameOrEmail, password }),
      }, false);

      setTokens(data.accessToken, data.refreshToken);
      await loadServerState();
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : 'Login failed';
    }
  };

  const signup = async (username: string, email: string, password: string): Promise<string | null> => {
    try {
      const data = await apiRequest<BackendAuthResponse>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      }, false);

      setTokens(data.accessToken, data.refreshToken);
      await loadServerState();
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : 'Signup failed';
    }
  };

  const requestPasswordReset = async (email: string): Promise<string | null> => {
    try {
      const data = await apiRequest<BackendMessageResponse>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }, false);

      return data.message;
    } catch (err) {
      return err instanceof Error ? err.message : 'Unable to send reset email';
    }
  };

  const resetPassword = async (token: string, password: string): Promise<string | null> => {
    try {
      const data = await apiRequest<BackendMessageResponse>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      }, false);

      return data.message;
    } catch (err) {
      return err instanceof Error ? err.message : 'Unable to reset password';
    }
  };

  const logout = () => {
    const refreshToken = getRefreshToken();
    clearSession();

    if (refreshToken) {
      void fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    }
  };

  const addJob = (job: Omit<Job, 'id'>) => {
    const run = async () => {
      setIsLoading(true);
      try {
        const created = await apiRequest<BackendJob>('/api/jobs', {
          method: 'POST',
          body: JSON.stringify(job),
        });
        setJobs(prev => [...prev, mapBackendJob(created)]);
      } catch (err) {
        showMutationError('Add job', err, () => { void run(); });
      } finally {
        setIsLoading(false);
      }
    };
    void run();
  };

  const updateJob = (job: Job) => {
    const run = async () => {
      setIsLoading(true);
      try {
        const updated = await apiRequest<BackendJob>(`/api/jobs/${job.id}`, {
          method: 'PUT',
          body: JSON.stringify({ name: job.name, hourlyRate: job.hourlyRate, colorTag: job.colorTag }),
        });
        const mapped = mapBackendJob(updated);
        setJobs(prev => prev.map(item => (item.id === mapped.id ? mapped : item)));
      } catch (err) {
        showMutationError('Update job', err, () => { void run(); });
      } finally {
        setIsLoading(false);
      }
    };
    void run();
  };

  const deleteJob = (id: string) => {
    const run = async () => {
      setIsLoading(true);
      try {
        await apiRequest<void>(`/api/jobs/${id}`, { method: 'DELETE' });
        setJobs(prev => prev.filter(item => item.id !== id));
      } catch (err) {
        showMutationError('Delete job', err, () => { void run(); });
      } finally {
        setIsLoading(false);
      }
    };
    void run();
  };

  const addShift = (shift: Omit<Shift, 'id'>) => {
    const run = async () => {
      setIsLoading(true);
      try {
        const created = await apiRequest<BackendShift>('/api/shifts', {
          method: 'POST',
          body: JSON.stringify({
            jobId: shift.jobId,
            date: shift.date,
            startTime: toLocalDateTime(shift.date, shift.startTime),
            endTime: toLocalDateTime(shift.date, shift.endTime),
            tips: shift.tips,
            premiums: shift.premiums,
          }),
        });
        const mapped = mapBackendShift(created);
        mapped.breakMinutes = shift.breakMinutes;
        setShifts(prev => [...prev, mapped]);
      } catch (err) {
        showMutationError('Add shift', err, () => { void run(); });
      } finally {
        setIsLoading(false);
      }
    };
    void run();
  };

  const updateShift = (shift: Shift) => {
    const run = async () => {
      setIsLoading(true);
      try {
        const updated = await apiRequest<BackendShift>(`/api/shifts/${shift.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            jobId: shift.jobId,
            date: shift.date,
            startTime: toLocalDateTime(shift.date, shift.startTime),
            endTime: toLocalDateTime(shift.date, shift.endTime),
            tips: shift.tips,
            premiums: shift.premiums,
          }),
        });
        const mapped = mapBackendShift(updated);
        mapped.breakMinutes = shift.breakMinutes;
        setShifts(prev => prev.map(item => (item.id === mapped.id ? mapped : item)));
      } catch (err) {
        showMutationError('Update shift', err, () => { void run(); });
      } finally {
        setIsLoading(false);
      }
    };
    void run();
  };

  const deleteShift = (id: string) => {
    const run = async () => {
      setIsLoading(true);
      try {
        await apiRequest<void>(`/api/shifts/${id}`, { method: 'DELETE' });
        setShifts(prev => prev.filter(item => item.id !== id));
      } catch (err) {
        showMutationError('Delete shift', err, () => { void run(); });
      } finally {
        setIsLoading(false);
      }
    };
    void run();
  };

  const addTemplate = (t: Omit<ShiftTemplate, 'id'>) => setTemplates(p => [...p, { ...t, id: uid() }]);
  const deleteTemplate = (id: string) => setTemplates(p => p.filter(x => x.id !== id));

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const run = async () => {
      setIsLoading(true);
      try {
        const created = await apiRequest<BackendExpense>('/api/expenses', {
          method: 'POST',
          body: JSON.stringify({
            date: expense.date,
            amount: expense.amount,
            category: expense.category,
            note: expense.description,
          }),
        });
        setExpenses(prev => [...prev, mapBackendExpense(created)]);
      } catch (err) {
        showMutationError('Add expense', err, () => { void run(); });
      } finally {
        setIsLoading(false);
      }
    };
    void run();
  };

  const deleteExpense = (id: string) => {
    const run = async () => {
      setIsLoading(true);
      try {
        await apiRequest<void>(`/api/expenses/${id}`, { method: 'DELETE' });
        setExpenses(prev => prev.filter(item => item.id !== id));
      } catch (err) {
        showMutationError('Delete expense', err, () => { void run(); });
      } finally {
        setIsLoading(false);
      }
    };
    void run();
  };

  const updateSettings = (next: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...next }));

    const run = async () => {
      setIsLoading(true);
      try {
        const updated = await apiRequest<BackendSettings>('/api/me/settings', {
          method: 'PATCH',
          body: JSON.stringify(next),
        });
        setSettings({
          name: updated.name,
          country: updated.country,
          taxRate: updated.taxRate,
          insuranceRate: updated.insuranceRate,
          otherDeductions: updated.otherDeductions,
        });
      } catch (err) {
        showMutationError('Update settings', err, () => { void run(); });
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  };

  const uid = () => crypto.randomUUID();
  const startLiveShift = (jobId: string) => setActiveShift({ shiftId: uid(), jobId, startedAt: Date.now() });
  const stopLiveShift = () => setActiveShift(null);

  const getJobById = useCallback((id: string) => jobs.find(j => j.id === id), [jobs]);

  return (
    <AppContext.Provider value={{
      user, jobs, shifts, templates, expenses, settings, activeShift, isBootstrapping, isLoading, currencySymbol,
      login, signup, requestPasswordReset, resetPassword, deleteAccount, logout,
      addJob, updateJob, deleteJob,
      addShift, updateShift, deleteShift,
      addTemplate, deleteTemplate,
      addExpense, deleteExpense,
      updateSettings,
      startLiveShift, stopLiveShift,
      getJobById,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
