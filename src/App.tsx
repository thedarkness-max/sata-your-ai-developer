import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import AuthPage from "./pages/AuthPage";
import ChatPage from "./pages/ChatPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Toaster position="top-center" richColors />
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/" element={<ChatPage />} />
          <Route path="/chat/:conversationId" element={<ChatPage />} />
        </Routes>
      </ThemeProvider>
    </AuthProvider>
  );
}
