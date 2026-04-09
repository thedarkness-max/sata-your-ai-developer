import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowLeft, User, Moon, Sun, Zap, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [aiMode, setAiMode] = useState("normal");
  const [longResponses, setLongResponses] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).single().then(({ data }) => {
      if (data) {
        setNickname(data.nickname || "");
        setAiMode(data.ai_mode || "normal");
        setLongResponses(data.long_responses ?? true);
      }
    });
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ nickname, ai_mode: aiMode, long_responses: longResponses }).eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error("Erro ao salvar"); else toast.success("Salvo! 😈");
  };

  const clearAllConversations = async () => {
    if (!user) return;
    if (!confirm("Deletar TODAS as conversas? Isso não pode ser desfeito.")) return;
    await supabase.from("conversations").delete().eq("user_id", user.id);
    toast.success("Conversas deletadas");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 flex items-center px-4 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="flex-1 text-center font-semibold text-sm">Configurações</h1>
        <div className="w-9" />
      </header>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto p-4 space-y-6">
        {/* Profile */}
        <section className="bg-card border border-border rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold"><User className="w-4 h-4 text-primary" /> Perfil</div>
          <div>
            <label className="text-xs text-muted-foreground">Apelido</label>
            <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Como quer ser chamado?" className="w-full mt-1 px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="text-xs text-muted-foreground">Email: {user?.email}</div>
        </section>

        {/* Theme */}
        <section className="bg-card border border-border rounded-xl p-4">
          <button onClick={toggle} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              {theme === "dark" ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-primary" />}
              Tema {theme === "dark" ? "Escuro" : "Claro"}
            </div>
            <div className="text-xs text-muted-foreground">Toque para alternar</div>
          </button>
        </section>

        {/* AI Mode */}
        <section className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold"><Zap className="w-4 h-4 text-primary" /> Modo IA</div>
          <div className="flex gap-2">
            <button onClick={() => setAiMode("normal")} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${aiMode === "normal" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>Normal</button>
            <button onClick={() => setAiMode("advanced")} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${aiMode === "advanced" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>Avançado</button>
          </div>
          <button onClick={() => setLongResponses(!longResponses)} className="w-full flex items-center justify-between py-2">
            <span className="text-sm">Respostas longas</span>
            {longResponses ? <ToggleRight className="w-5 h-5 text-primary" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
          </button>
        </section>

        {/* Danger */}
        <section className="bg-card border border-border rounded-xl p-4 space-y-3">
          <button onClick={clearAllConversations} className="w-full flex items-center gap-2 text-sm text-destructive hover:opacity-80">
            <Trash2 className="w-4 h-4" /> Limpar todas as conversas
          </button>
        </section>

        <button onClick={saveProfile} disabled={saving} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:opacity-90 disabled:opacity-50">
          {saving ? "Salvando..." : "Salvar configurações"}
        </button>

        <button onClick={handleSignOut} className="w-full py-3 bg-muted text-muted-foreground rounded-xl text-sm hover:text-foreground transition-colors">
          Sair da conta
        </button>

        <div className="text-center text-xs text-muted-foreground pt-4">
          Sata GOD v2.0 — IA sem limites 😈
        </div>
      </motion.div>
    </div>
  );
}
