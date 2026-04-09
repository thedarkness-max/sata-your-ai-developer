import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";
import { X, MessageSquare, Settings, User, Moon, Sun, Trash2, Info, Plus } from "lucide-react";

type Conversation = { id: string; title: string; updated_at: string };

export default function Sidebar({ onClose, currentConvId }: { onClose: () => void; currentConvId?: string }) {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("conversations").select("id, title, updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).then(({ data }) => {
      if (data) setConversations(data);
    });
  }, [user]);

  const openConv = (id: string) => { navigate(`/chat/${id}`); onClose(); };
  const newChat = () => { navigate("/"); onClose(); };
  const goSettings = () => { navigate("/settings"); onClose(); };

  const deleteConv = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("conversations").delete().eq("id", id);
    setConversations(prev => prev.filter(c => c.id !== id));
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black z-40" />
      <motion.aside
        initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed left-0 top-0 bottom-0 w-72 bg-sidebar border-r border-sidebar-border z-50 flex flex-col"
      >
        <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border">
          <span className="font-semibold text-sm text-sidebar-foreground">Sata GOD</span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-sidebar-accent"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-3">
          <button onClick={newChat} className="w-full flex items-center gap-2 px-3 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
            <Plus className="w-4 h-4" /> Nova conversa
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          <p className="text-xs text-muted-foreground px-2 py-1">Conversas</p>
          {conversations.length === 0 && <p className="text-xs text-muted-foreground px-2 py-4 text-center">Nenhuma conversa ainda</p>}
          {conversations.map(c => (
            <button key={c.id} onClick={() => openConv(c.id)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left group transition-colors ${c.id === currentConvId ? "bg-sidebar-accent text-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/50"}`}>
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate flex-1">{c.title}</span>
              <button onClick={e => deleteConv(c.id, e)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-sidebar-border space-y-1">
          <button onClick={goSettings} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50">
            <Settings className="w-4 h-4" /> Configurações
          </button>
          <button onClick={toggle} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === "dark" ? "Tema Claro" : "Tema Escuro"}
          </button>
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
            <Info className="w-3 h-3" /> v2.0 — IA sem limites
          </div>
        </div>
      </motion.aside>
    </>
  );
}
