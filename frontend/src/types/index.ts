export interface Job {
  id: string;
  name: string;
  hourlyRate: number;
  colorTag: string;
}

export interface Shift {
  id: string;
  jobId: string;
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  tips: number;
  premiums: number;
}

export interface ShiftTemplate {
  id: string;
  name: string;
  jobId: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  description: string;
}

export interface UserSettings {
  name: string;
  country: string;
  taxRate: number;
  insuranceRate: number;
  otherDeductions: number;
}

export interface ActiveShift {
  shiftId: string;
  jobId: string;
  startedAt: number;
}

export interface AppUser {
  id: string;
  username: string;
  email: string;
}

export const COUNTRIES = [
  { code: 'US', name: 'USA', currency: 'USD', symbol: '$' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', symbol: '£' },
  { code: 'DE', name: 'Germany', currency: 'EUR', symbol: '€' },
  { code: 'FR', name: 'France', currency: 'EUR', symbol: '€' },
  { code: 'CA', name: 'Canada', currency: 'CAD', symbol: 'CA$' },
  { code: 'AU', name: 'Australia', currency: 'AUD', symbol: 'A$' },
  { code: 'IT', name: 'Italy', currency: 'EUR', symbol: '€' },
  { code: 'CH', name: 'Switzerland', currency: 'CHF', symbol: 'CHF ' },
] as const;

export type CountryCode = typeof COUNTRIES[number]['code'];

export const getCurrencySymbol = (countryCode: string): string => {
  const c = COUNTRIES.find(c => c.code === countryCode);
  return c ? c.symbol : '$';
};

export const calculateShiftHours = (shift: Shift): number => {
  const [sh, sm] = shift.startTime.split(':').map(Number);
  const [eh, em] = shift.endTime.split(':').map(Number);
  let totalMin = (eh * 60 + em) - (sh * 60 + sm);
  if (totalMin < 0) totalMin += 24 * 60;
  return (totalMin - shift.breakMinutes) / 60;
};

export const calculateShiftEarnings = (shift: Shift, job: Job | undefined): number => {
  if (!job) return 0;
  const hours = calculateShiftHours(shift);
  return hours * job.hourlyRate + shift.tips + shift.premiums;
};

export const EXPENSE_CATEGORIES = [
  'Food & Drinks', 'Transport', 'Clothing', 'Rent', 'Utilities', 'Entertainment', 'Health', 'Concert', 'Other'
];
