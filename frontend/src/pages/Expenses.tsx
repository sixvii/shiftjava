import React, { useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { useApp } from '@/contexts/AppContext';
import { EXPENSE_CATEGORIES } from '@/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import expensesIcon from '@/assets/images/expenses.png';

const PIE_COLORS = ['#FF5A3C', '#4ECDC4', '#FFD700', '#9B59B6', '#3498DB', '#2ECC71', '#E74C3C', '#F39C12'];

const Expenses: React.FC = () => {
  const { expenses, addExpense, deleteExpense, currencySymbol } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const now = new Date();
  const monthExpenses = useMemo(() =>
    expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }), [expenses, now]);

  const totalExpenses = monthExpenses.reduce((s, e) => s + e.amount, 0);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    monthExpenses.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [monthExpenses]);

  const handleAdd = () => {
    if (!amount) return;
    addExpense({ category, amount, description, date });
    setShowAdd(false);
    setAmount(0);
    setDescription('');
    setCategory(EXPENSE_CATEGORIES[0]);
    setDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={expensesIcon} alt="Expenses" className="h-6 w-6 object-contain brightness-0 invert" />
          <h1 className="text-xl font-semibold text-foreground">Expenses</h1>
        </div>
        <button onClick={() => setShowAdd(true)} className="accent-badge cursor-pointer text-[14px]">+ Add</button>
      </div>

      {/* Monthly Total */}
      <div className="glass-card p-4 flex items-center justify-between">
        <span className="text-muted-foreground">This Month</span>
        <span className="text-xl font-bold text-foreground">{currencySymbol}{totalExpenses.toFixed(2)}</span>
      </div>

      {/* Pie Chart */}
      {byCategory.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="font-semibold text-foreground mb-3">By Category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3}>
                {byCategory.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(0,0%,11%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {byCategory.map((e, i) => (
              <div key={e.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {e.name}: {currencySymbol}{e.value.toFixed(0)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expense List */}
      <div className="space-y-2">
        {monthExpenses.length === 0 ? (
          <div className="glass-card p-6 text-center text-muted-foreground">No expenses this month yet.</div>
        ) : (
          monthExpenses
            .slice()
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map(expense => (
              <div key={expense.id} className="glass-card p-3 min-h-[80px] flex items-center justify-between">
                <div>
                  <div className="font-medium text-foreground">{expense.category}</div>
                  <div className="text-[13px] text-muted-foreground">{expense.description || 'No description'} • {expense.date}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-foreground">{currencySymbol}{expense.amount.toFixed(2)}</span>
                  <button
                    onClick={() => deleteExpense(expense.id)}
                    className="w-8 h-8 rounded-lg bg-secondary/60 text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Delete expense"
                  >
                    <Icon icon="mdi:trash-can-outline" width={20} className="mx-auto" />
                  </button>
                </div>
              </div>
            ))
        )}
      </div>

      {/* Add Expense Form (inline at bottom) */}
      {showAdd && (
        <div className="glass-card p-6 animate-fade-in-up">
          <h2 className="text-lg font-semibold text-foreground mb-4">Add Expense</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full mt-1 p-3 rounded-xl bg-secondary/60 text-foreground border border-border/50 outline-none focus:border-primary/50"
              >
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Amount ({currencySymbol})</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                min={0}
                step={0.01}
                className="w-full mt-1 p-3 rounded-xl bg-secondary/60 text-foreground border border-border/50 outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Description</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Optional"
                className="w-full mt-1 p-3 rounded-xl bg-secondary/60 text-foreground border border-border/50 outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full mt-1 p-3 rounded-xl bg-secondary/60 text-foreground border border-border/50 outline-none focus:border-primary/50"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowAdd(false)} className="flex-1 p-3 rounded-xl bg-secondary/60 text-foreground font-medium">Cancel</button>
              <button onClick={handleAdd} className="flex-1 p-3 rounded-xl bg-primary text-primary-foreground font-medium">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
