import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import AuthPage from "./pages/AuthPage";
import ChatPage from "./pages/ChatPage";
import SettingsPage from "./pages/SettingsPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Toaster position="top-center" richColors />
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/chat/:conversationId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        </Routes>
      </ThemeProvider>
    </AuthProvider>
  );
}
