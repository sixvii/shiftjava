import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useApp } from '@/contexts/AppContext';
import { COUNTRIES } from '@/types';
import { useNavigate } from 'react-router-dom';

const Settings: React.FC = () => {
  const { settings, updateSettings, logout, deleteAccount, user } = useApp();
  const navigate = useNavigate();
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if ('Notification' in window) {
      setNotifEnabled(Notification.permission === 'granted');
    }
  }, []);

  const handleNotifToggle = async () => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      setNotifEnabled(false);
    } else {
      const perm = await Notification.requestPermission();
      setNotifEnabled(perm === 'granted');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError('Password is required');
      return;
    }

    setIsDeletingAccount(true);
    const err = await deleteAccount(deletePassword);
    setIsDeletingAccount(false);

    if (err) {
      setDeleteError(err);
      return;
    }

    navigate('/signup');
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <h1 className="text-xl font-semibold text-foreground">Settings</h1>

      {/* Profile */}
      <div className="glass-card p-5 space-y-4">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Icon icon="mdi:account" width={20} className="text-foreground" /> Profile
        </h2>
        <div>
          <label className="text-sm text-muted-foreground">Display Name</label>
          <input type="text" value={settings.name} onChange={e => updateSettings({ name: e.target.value })}
            className="w-full mt-1 p-3 rounded-xl bg-secondary/60 text-foreground border border-border/50 outline-none focus:border-primary/50" />
        </div>
        {user && <p className="text-sm text-muted-foreground">Email: {user.email}</p>}
      </div>

      {/* Country & Currency */}
      <div className="glass-card p-5 space-y-4">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Icon icon="mdi:earth" width={20} className="text-foreground" /> Country & Currency
        </h2>
        <div>
          <label className="text-sm text-muted-foreground">Country</label>
          <select value={settings.country} onChange={e => updateSettings({ country: e.target.value })}
            className="w-full mt-1 p-3 rounded-xl bg-secondary/60 text-foreground border border-border/50 outline-none focus:border-primary/50">
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>{c.name} ({c.symbol} {c.currency})</option>
            ))}
          </select>
        </div>
        <p className="text-sm text-muted-foreground">
          Currency will be set to {COUNTRIES.find(c => c.code === settings.country)?.currency || 'USD'} ({COUNTRIES.find(c => c.code === settings.country)?.symbol || '$'})
        </p>
      </div>

      {/* Deductions */}
      <div className="glass-card p-5 space-y-4">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Icon icon="mdi:calculator" width={20} className="text-foreground" /> Deductions
        </h2>
        <div>
          <label className="text-sm text-muted-foreground">Tax Rate (%)</label>
          <input type="number" value={settings.taxRate} onChange={e => updateSettings({ taxRate: Number(e.target.value) })} min={0} max={100}
            className="w-full mt-1 p-3 rounded-xl bg-secondary/60 text-foreground border border-border/50 outline-none focus:border-primary/50" />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Insurance Rate (%)</label>
          <input type="number" value={settings.insuranceRate} onChange={e => updateSettings({ insuranceRate: Number(e.target.value) })} min={0} max={100}
            className="w-full mt-1 p-3 rounded-xl bg-secondary/60 text-foreground border border-border/50 outline-none focus:border-primary/50" />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Other Deductions (%)</label>
          <input type="number" value={settings.otherDeductions} onChange={e => updateSettings({ otherDeductions: Number(e.target.value) })} min={0} max={100}
            className="w-full mt-1 p-3 rounded-xl bg-secondary/60 text-foreground border border-border/50 outline-none focus:border-primary/50" />
        </div>
      </div>

      {/* Notifications */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon icon="mdi:bell" width={20} className="text-foreground" />
            <div>
              <div className="font-semibold text-foreground">Push Notifications</div>
              <div className="text-xs text-muted-foreground">Get reminders before shifts</div>
            </div>
          </div>
          <button
            onClick={handleNotifToggle}
            className={`w-12 h-7 rounded-full transition-colors relative ${notifEnabled ? 'bg-primary' : 'bg-secondary'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-foreground absolute top-1 transition-transform ${notifEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      {/* Logout */}
      <button onClick={handleLogout} className="glass-card p-4 w-full flex items-center justify-center gap-2 text-destructive font-medium hover:bg-destructive/10 transition-colors">
        <Icon icon="mdi:logout" width={20} className="text-destructive" />
        Sign Out
      </button>

      <button
        onClick={() => { setShowDeleteConfirm(true); setDeletePassword(''); setDeleteError(''); }}
        disabled={isDeletingAccount}
        className="glass-card p-4 w-full flex items-center justify-center gap-2 text-destructive font-medium hover:bg-destructive/10 transition-colors disabled:opacity-50"
      >
        <Icon icon="mdi:account-remove" width={20} className="text-destructive" />
        Delete Account
      </button>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-6 w-full max-w-sm rounded-2xl space-y-4 animate-fade-in-up">
            <h2 className="text-lg font-semibold text-foreground">Delete Account</h2>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. Enter your password to confirm deletion of your account and all data.
            </p>
            
            {deleteError && (
              <div className="bg-destructive/20 border border-destructive/50 rounded-lg p-3 text-sm text-destructive">
                {deleteError}
              </div>
            )}

            <div>
              <label className="text-sm text-muted-foreground">Password</label>
              <input
                type="password"
                value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleDeleteAccount()}
                placeholder="Enter your password"
                className="w-full mt-1 p-3 rounded-xl bg-secondary/60 text-foreground border border-border/50 outline-none focus:border-primary/50"
                disabled={isDeletingAccount}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); setDeleteError(''); }}
                disabled={isDeletingAccount}
                className="flex-1 p-3 rounded-xl bg-secondary/60 text-foreground font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
                className="flex-1 p-3 rounded-xl bg-destructive text-destructive-foreground font-medium disabled:opacity-50"
              >
                {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
