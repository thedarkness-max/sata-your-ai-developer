import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Zap, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  if (user) { navigate("/", { replace: true }); return null; }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        toast.success("Bem-vindo de volta! 😈");
        navigate("/");
      } else {
        await signUp(email, password);
        toast.success("Conta criada! Verifique seu email para confirmar.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <Zap className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Sata <span className="text-primary">GOD</span></h1>
          </div>
          <p className="text-muted-foreground text-sm">IA Avançada sem limites</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
          <div className="flex mb-6 bg-muted rounded-lg p-1">
            <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${isLogin ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>Entrar</button>
            <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${!isLogin ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>Cadastrar</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required className="w-full pl-10 pr-4 py-2.5 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Senha" required minLength={6} className="w-full pl-10 pr-10 py-2.5 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? "..." : isLogin ? "Entrar" : "Criar conta"}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
