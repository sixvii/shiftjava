import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "@/contexts/AppContext";
import AppLayout from "@/components/layout/AppLayout";
import LoadingSpinner from "@/components/LoadingSpinner";

// Lazy load pages for faster initial load
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Calendar = lazy(() => import("@/pages/Calendar"));
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Settings = lazy(() => import("@/pages/Settings"));
const Insights = lazy(() => import("@/pages/Insights"));
const Jobs = lazy(() => import("@/pages/Jobs"));
const Expenses = lazy(() => import("@/pages/Expenses"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient();

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isBootstrapping } = useApp();
  if (isBootstrapping) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <AppLayout><Suspense fallback={<LoadingSpinner isVisible />}>{children}</Suspense></AppLayout>;
};

const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isBootstrapping } = useApp();
  if (isBootstrapping) return null;
  if (user) return <Navigate to="/" replace />;
  return <Suspense fallback={<LoadingSpinner isVisible />}>{children}</Suspense>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
    <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />
    <Route path="/forgot-password" element={<AuthRoute><ForgotPassword /></AuthRoute>} />
    <Route path="/reset-password" element={<AuthRoute><ResetPassword /></AuthRoute>} />
    <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
    <Route path="/insights" element={<ProtectedRoute><Insights /></ProtectedRoute>} />
    <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
    <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
