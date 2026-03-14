import React, { useMemo } from 'react';
import { Icon } from '@iconify/react';
import { useApp } from '@/contexts/AppContext';
import { calculateShiftEarnings, calculateShiftHours } from '@/types';
import insightsIcon from '@/assets/images/insights.png';
import logo from '@/assets/images/logo.png';

const Insights: React.FC = () => {
  const { shifts, jobs, getJobById, currencySymbol } = useApp();

  const insights = useMemo(() => {
    if (shifts.length === 0) return [];
    const result: { icon: string; title: string; value: string; color: string }[] = [];

    // Best earning day
    const dayMap: Record<string, number> = {};
    shifts.forEach(s => {
      dayMap[s.date] = (dayMap[s.date] || 0) + calculateShiftEarnings(s, getJobById(s.jobId));
    });
    const bestDay = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0];
    if (bestDay) {
      const d = new Date(bestDay[0]);
      result.push({
        icon: 'mdi:trophy',
        title: 'Best Earning Day',
        value: `${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} — ${currencySymbol}${bestDay[1].toFixed(2)}`,
        color: '#FFD700',
      });
    }

    // Highest paying job
    if (jobs.length > 0) {
      const sorted = [...jobs].sort((a, b) => b.hourlyRate - a.hourlyRate);
      result.push({
        icon: 'mdi:star',
        title: 'Highest Paying Job',
        value: `${sorted[0].name} — ${currencySymbol}${sorted[0].hourlyRate}/h`,
        color: '#4ECDC4',
      });
    }

    // Average shift length
    const avgHours = shifts.reduce((s, sh) => s + calculateShiftHours(sh), 0) / shifts.length;
    result.push({
      icon: 'mdi:clock-outline',
      title: 'Average Shift Length',
      value: `${avgHours.toFixed(1)} hours`,
      color: '#FF7A5C',
    });

    // Total shifts this month
    const now = new Date();
    const monthShifts = shifts.filter(s => {
      const d = new Date(s.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    result.push({
      icon: 'mdi:calendar-check',
      title: 'Shifts This Month',
      value: `${monthShifts.length} shifts`,
      color: '#FF5A3C',
    });

    // Weekly hours
    const weekHours = (() => {
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay();
      startOfWeek.setDate(startOfWeek.getDate() - (day === 0 ? 6 : day - 1));
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      return shifts
        .filter(s => { const d = new Date(s.date); return d >= startOfWeek && d <= endOfWeek; })
        .reduce((sum, s) => sum + calculateShiftHours(s), 0);
    })();

    if (weekHours > 40) {
      result.push({
        icon: 'mdi:alert-circle',
        title: 'Overtime Warning',
        value: `${weekHours.toFixed(1)} hours this week (over 40h)`,
        color: '#FF4444',
      });
    }

    if (weekHours > 55) {
      result.push({
        icon: 'mdi:heart-broken',
        title: 'Burnout Risk',
        value: `Working ${weekHours.toFixed(1)}h/week — consider rest`,
        color: '#FF2222',
      });
    }

    return result;
  }, [shifts, jobs, getJobById, currencySymbol]);

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center gap-2">
        <img src={insightsIcon} alt="Insights" className="h-6 w-6 object-contain brightness-0 invert" />
        <h1 className="text-xl font-semibold text-foreground">Smart Insights</h1>
      </div>

      {insights.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <Icon icon="mdi:chart-bar" width={48} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Add shifts to see insights</p>
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((ins, i) => (
            <div key={i} className="glass-card-glow p-4 min-h-[100px] flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${ins.color}20` }}>
                <img src={logo} alt="Logo" className="h-5 w-5 object-contain brightness-0 invert" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{ins.title}</div>
                <div className="font-semibold text-foreground mt-0.5">{ins.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Insights;
