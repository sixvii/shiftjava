import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Icon } from '@iconify/react';
import logo from '@/assets/images/logo.png';
import dashIcon from '@/assets/images/dash.png';
import expensesIcon from '@/assets/images/expenses.png';
import jobsIcon from '@/assets/images/jobs.png';
import calIcon from '@/assets/images/cal.png';
import insightsIcon from '@/assets/images/insights.png';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useApp } from '@/contexts/AppContext';

type NavItem = {
  path: string;
  label: string;
  icon?: string;
  iconImage?: string;
};

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', iconImage: dashIcon },
  { path: '/calendar', label: 'Calendar', iconImage: calIcon },
  { path: '/insights', label: 'Insights', iconImage: insightsIcon },
  { path: '/jobs', label: 'Jobs', iconImage: jobsIcon },
  { path: '/expenses', label: 'Expenses', iconImage: expensesIcon },
  { path: '/settings', label: 'Settings', icon: 'mdi:cog' },
];

const renderNavIcon = (item: NavItem, active: boolean, size: number = 22) => {
  if (item.iconImage) {
    return (
      <img
        src={item.iconImage}
        alt={item.label}
        className={`h-[${size}px] w-[${size}px] object-contain brightness-0 invert ${active ? 'opacity-100' : 'opacity-80'}`}
        style={{ height: `${size}px`, width: `${size}px` }}
      />
    );
  }

  return <Icon icon={item.icon ?? ''} width={size} className={active ? 'text-primary' : 'text-foreground'} />;
};

const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:w-60 md:flex-col glass-card rounded-none border-r border-border/50 z-30">
      <div className="flex items-center px-6 py-6">
        <img src={logo} alt="Logo" className="h-7 w-7 invert" />
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                active
                  ? 'bg-primary/15 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
              }`}
            >
              {renderNavIcon(item, active)}
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

const MobileNav: React.FC = () => {
  const location = useLocation();
  const mobileItems = navItems.slice(0, 5);

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 glass-card rounded-none border-t border-border/50">
      <div className="flex items-center justify-around py-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
        {mobileItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {renderNavIcon(item, active, 24)}
              <span className="text-[10px]">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { isLoading } = useApp();

  return (
    <div className="min-h-screen bg-background font-poppins overflow-x-hidden">
      <Sidebar />
      <MobileNav />
      <LoadingSpinner isVisible={isLoading} />
      <main className="md:pl-60">
        <div className="mx-auto max-w-4xl px-4 py-5 pb-24 lg:max-w-5xl md:pb-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
