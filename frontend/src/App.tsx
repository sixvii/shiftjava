import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "@/contexts/AppContext";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Calendar from "@/pages/Calendar";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Settings from "@/pages/Settings";
import Insights from "@/pages/Insights";
import Jobs from "@/pages/Jobs";
import Expenses from "@/pages/Expenses";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isBootstrapping } = useApp();
  if (isBootstrapping) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
};

const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isBootstrapping } = useApp();
  if (isBootstrapping) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
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
