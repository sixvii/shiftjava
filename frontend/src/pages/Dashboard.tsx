import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from '@iconify/react';
import tipsIcon from '@/assets/images/tips.png';
import jobsIcon from '@/assets/images/jobs.png';
import premiumIcon from '@/assets/images/premium.png';
import clockkIcon from '@/assets/images/clockk.png';
import forecastIcon from '@/assets/images/forecast.png';
import healthIcon from '@/assets/images/health.png';
import calIcon from '@/assets/images/cal.png';
import exIcon from '@/assets/images/ex.png';
import { useApp } from '@/contexts/AppContext';
import { calculateShiftEarnings, calculateShiftHours } from '@/types';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard: React.FC = () => {
  const { user, jobs, shifts, expenses, settings, activeShift, currencySymbol, getJobById, stopLiveShift } = useApp();
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Live timer
  useEffect(() => {
    if (!activeShift) return;
    const iv = setInterval(() => setElapsed(Date.now() - activeShift.startedAt), 1000);
    return () => clearInterval(iv);
  }, [activeShift]);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthShifts = useMemo(() =>
    shifts.filter(s => {
      const d = new Date(s.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }), [shifts, currentMonth, currentYear]);

  const totalEarnings = useMemo(() =>
    monthShifts.reduce((sum, s) => sum + calculateShiftEarnings(s, getJobById(s.jobId)), 0), [monthShifts, getJobById]);

  const totalHours = useMemo(() =>
    monthShifts.reduce((sum, s) => sum + calculateShiftHours(s), 0), [monthShifts]);

  const avgHourly = totalHours > 0 ? totalEarnings / totalHours : 0;

  const totalTips = useMemo(() => monthShifts.reduce((s, sh) => s + sh.tips, 0), [monthShifts]);
  const totalWage = useMemo(() =>
    monthShifts.reduce((s, sh) => s + calculateShiftHours(sh) * (getJobById(sh.jobId)?.hourlyRate || 0), 0), [monthShifts, getJobById]);
  const totalPremiums = useMemo(() => monthShifts.reduce((s, sh) => s + sh.premiums, 0), [monthShifts]);

  const deductionRate = (settings.taxRate + settings.insuranceRate + settings.otherDeductions) / 100;
  const netEstimated = totalEarnings * (1 - deductionRate);
  const netPercent = totalEarnings > 0 ? Math.round((netEstimated / totalEarnings) * 100) : 0;

  // Today's shifts
  const todayStr = now.toISOString().split('T')[0];
  const todayShifts = shifts.filter(s => s.date === todayStr);
  const todayForecast = todayShifts.reduce((sum, s) => sum + calculateShiftEarnings(s, getJobById(s.jobId)), 0);
  const nextShift = todayShifts.sort((a, b) => a.startTime.localeCompare(b.startTime))[0];

  // Monthly expenses
  const monthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    monthExpenses.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [monthExpenses]);

  // Weekly earnings chart
  const weekEarnings = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - (day === 0 ? 6 : day - 1));
    return days.map((name, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayShifts = shifts.filter(s => s.date === dateStr);
      const total = dayShifts.reduce((sum, s) => sum + calculateShiftEarnings(s, getJobById(s.jobId)), 0);
      return { name, total: Math.round(total * 100) / 100 };
    });
  }, [shifts, getJobById, now]);

  // Weekly forecast
  const weeklyForecast = useMemo(() => {
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - (day === 0 ? 6 : day - 1));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    const weekShifts = shifts.filter(s => {
      const d = new Date(s.date);
      return d >= startOfWeek && d <= endOfWeek;
    });
    return weekShifts.reduce((sum, s) => sum + calculateShiftEarnings(s, getJobById(s.jobId)), 0);
  }, [shifts, getJobById, now]);

  // Monthly forecast (based on scheduled shifts for remaining days)
  const monthlyForecast = useMemo(() => {
    const remaining = shifts.filter(s => {
      const d = new Date(s.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && d >= now;
    });
    const future = remaining.reduce((sum, s) => sum + calculateShiftEarnings(s, getJobById(s.jobId)), 0);
    return totalEarnings + future;
  }, [shifts, getJobById, totalEarnings, currentMonth, currentYear, now]);

  const PIE_COLORS = ['#FF5A3C', '#FF7A5C', '#FF9A7C', '#FFB89C', '#FFD6BC', '#4ECDC4', '#45B7AA', '#3CA190'];

  const formatCurrency = (n: number) => `${currencySymbol}${n.toFixed(n >= 1000 ? 0 : 2)}`;
  const formatK = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toFixed(0);

  const elapsedStr = activeShift ? (() => {
    const s = Math.floor(elapsed / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  })() : '';

  const activeJob = activeShift ? getJobById(activeShift.jobId) : null;
  const liveEarnings = activeShift && activeJob ? (elapsed / 3600000) * activeJob.hourlyRate : 0;

  return (
    <>
    <div className="space-y-5 animate-fade-in-up">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-semibold text-foreground">
            Good {now.getHours() < 12 ? 'morning' : now.getHours() < 18 ? 'afternoon' : 'evening'}, {settings.name || user?.username || 'there'}
          </h1>
        </div>
        <div className="flex gap-2">
          <button className="fab !w-10 !h-10" onClick={() => navigate('/settings')}>
            <Icon icon="mdi:cog" width={20} className="text-foreground" />
          </button>
        </div>
      </div>

      {/* Live Shift Timer */}
      {activeShift && activeJob && (
        <div className="glass-card p-5 border-primary/30 pulse-glow animate-fade-in-up">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Icon icon="mdi:timer-outline" width={22} className="text-primary" />
              <span className="text-sm font-medium text-primary">Live Shift</span>
            </div>
            <button onClick={stopLiveShift} className="accent-badge cursor-pointer hover:opacity-80">
              Stop
            </button>
          </div>
          <div className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">{elapsedStr}</div>
          <div className="flex items-center gap-4 mt-2 text-muted-foreground">
            <span>{activeJob.name}</span>
            <span>≈ {formatCurrency(liveEarnings)}</span>
          </div>
        </div>
      )}

      {/* Earnings Summary */}
      <div className="glass-card p-5 animate-fade-in-up stagger-1">
        <div className="text-[25px] md:text-[35px] font-bold text-foreground tracking-tight">
          {currencySymbol}{formatK(totalEarnings)}
        </div>
        <div className="text-muted-foreground mt-1">Ø {formatCurrency(avgHourly)}/h</div>

        <div className="glass-card mt-4 p-4 grid grid-cols-3 gap-3 text-center">
          <div>
            <img src={tipsIcon} alt="Tips" className="h-9 w-9 object-contain brightness-0 invert mx-auto mb-1" />
            <div className="font-semibold text-foreground">{currencySymbol}{formatK(totalTips)}</div>
            <div className="text-xs text-muted-foreground">Tips</div>
          </div>
          <div>
            <img src={jobsIcon} alt="Wage" className="h-7 w-7 object-contain brightness-0 invert mx-auto mb-1" />
            <div className="font-semibold text-foreground">{currencySymbol}{formatK(totalWage)}</div>
            <div className="text-xs text-muted-foreground">Wage</div>
          </div>
          <div>
            <img src={premiumIcon} alt="Premiums" className="h-7 w-7 object-contain brightness-0 invert mx-auto mb-1" />
            <div className="font-semibold text-foreground">{currencySymbol}{formatK(totalPremiums)}</div>
            <div className="text-xs text-muted-foreground">Premiums</div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <img src={exIcon} alt="Net estimated" className="h-5 w-5 object-contain brightness-0 invert" />
            <span className="text-muted-foreground">Net (estimated)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">{currencySymbol}{formatK(netEstimated)}</span>
            <span className="accent-badge">{netPercent}%</span>
          </div>
        </div>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full mt-3 text-center text-primary text-sm font-medium flex items-center justify-center gap-1"
        >
          {showDetails ? 'Hide' : 'Show'} details
          <Icon icon={showDetails ? 'mdi:chevron-up' : 'mdi:chevron-down'} width={18} className="text-primary" />
        </button>

        {showDetails && (
          <div className="mt-3 space-y-2 animate-slide-down text-sm text-muted-foreground">
            <div className="flex justify-between"><span>Gross</span><span className="text-foreground">{formatCurrency(totalEarnings)}</span></div>
            <div className="flex justify-between"><span>Tax ({settings.taxRate}%)</span><span>-{formatCurrency(totalEarnings * settings.taxRate / 100)}</span></div>
            <div className="flex justify-between"><span>Insurance ({settings.insuranceRate}%)</span><span>-{formatCurrency(totalEarnings * settings.insuranceRate / 100)}</span></div>
            <div className="flex justify-between"><span>Other ({settings.otherDeductions}%)</span><span>-{formatCurrency(totalEarnings * settings.otherDeductions / 100)}</span></div>
          </div>
        )}
      </div>

      {/* Today Quick Overview */}
      <div className="animate-fade-in-up stagger-2">
        <div className="flex items-center gap-2 mb-3">
          <img src={calIcon} alt="Today" className="h-[24px] w-[24px] object-contain brightness-0 invert" />
          <div>
            <div className="font-semibold text-foreground">Today</div>
            <div className="text-xs text-muted-foreground">Quick overview</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card-glow p-4 text-center">
            <img src={clockkIcon} alt="Shift" className="h-6 w-6 object-contain brightness-0 invert mx-auto mb-2" />
            <div className="text-xs text-muted-foreground">Shift</div>
            <div className="font-semibold text-foreground">{nextShift ? nextShift.startTime : '--:--'}</div>
          </div>
          <div className="glass-card-glow p-4 text-center">
            <img src={forecastIcon} alt="Forecast" className="h-6 w-6 object-contain brightness-0 invert mx-auto mb-2" />
            <div className="text-xs text-muted-foreground">Forecast</div>
            <div className="font-semibold text-foreground">{formatCurrency(todayForecast)}</div>
          </div>
          <div className="glass-card-glow p-4 text-center">
            <img src={healthIcon} alt="Health" className="h-6 w-6 object-contain brightness-0 invert mx-auto mb-2" />
            <div className="text-xs text-muted-foreground">Health</div>
            <div className="font-semibold text-foreground">Okay</div>
          </div>
        </div>
      </div>

      {/* Forecast Cards */}
      <div className="grid grid-cols-2 gap-3 animate-fade-in-up stagger-3">
        <div className="glass-card-glow p-4">
          <div className="flex items-center gap-2 mb-2">
            <img src={calIcon} alt="Weekly Forecast" className="h-5 w-5 object-contain brightness-0 invert" />
            <span className="text-sm text-muted-foreground">Weekly Forecast</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{formatCurrency(weeklyForecast)}</div>
        </div>
        <div className="glass-card-glow p-4">
          <div className="flex items-center gap-2 mb-2">
            <img src={calIcon} alt="Monthly Forecast" className="h-5 w-5 object-contain brightness-0 invert" />
            <span className="text-sm text-muted-foreground">Monthly Forecast</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{formatCurrency(monthlyForecast)}</div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="glass-card p-4 animate-fade-in-up stagger-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
            <img src={calIcon} alt="Upcoming Events" className="h-5 w-5 object-contain brightness-0 invert" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-foreground">Upcoming Events</div>
            <div className="text-xs text-muted-foreground">Your calendar for today</div>
          </div>
        </div>
        {todayShifts.length === 0 ? (
          <div className="mt-3 glass-card p-4 flex items-center gap-3">
            <Icon icon="mdi:check-circle" width={28} className="text-green-500" />
            <div>
              <div className="font-medium text-foreground">No events today</div>
              <div className="text-xs text-muted-foreground">Your calendar for today</div>
            </div>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {todayShifts.map(s => {
              const job = getJobById(s.jobId);
              return (
                <div key={s.id} className="glass-card p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">{job?.name || 'Shift'}</div>
                    <div className="text-xs text-muted-foreground">{s.startTime} - {s.endTime}</div>
                  </div>
                  <span className="text-sm font-semibold text-primary">{formatCurrency(calculateShiftEarnings(s, job))}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Earnings Chart */}
      {weekEarnings.some(d => d.total > 0) && (
        <div className="glass-card p-4 animate-fade-in-up stagger-4">
          <h3 className="font-semibold text-foreground mb-3">This Week's Earnings</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weekEarnings}>
              <XAxis dataKey="name" tick={{ fill: 'hsl(0,0%,55%)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(0,0%,55%)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'hsl(0,0%,11%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff' }}
              />
              <Bar dataKey="total" fill="hsl(9,100%,62%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Expense Pie Chart */}
      {expenseByCategory.length > 0 && (
        <div className="glass-card p-4 animate-fade-in-up stagger-5">
          <h3 className="font-semibold text-foreground mb-3">Expenses by Category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3}>
                {expenseByCategory.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(0,0%,11%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {expenseByCategory.map((e, i) => (
              <div key={e.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {e.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FABs - Bottom Left & Right */}
    </div>
      <div className="fixed bottom-32 md:bottom-1 left-4 md:left-[350px] z-30">
        <button className="fab" onClick={() => navigate('/calendar')}>
          <img src={calIcon} alt="Calendar" className="h-6 w-6 object-contain brightness-0 invert" />
        </button>
      </div>
      <div className="fixed bottom-32 md:bottom-1 right-4 md:right-28 z-30">
        <button className="fab" onClick={() => navigate('/calendar?add=true')}>
          <Icon icon="mdi:plus" width={28} className="text-foreground" />
        </button>
      </div>
    </>
  );
};

export default Dashboard;
