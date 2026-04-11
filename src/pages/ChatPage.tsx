import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Plus, Send, Loader2, Zap } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import MessageBubble from "@/components/MessageBubble";

type Msg = { id?: string; role: "user" | "assistant"; content: string };

export default function ChatPage() {
  const { user } = useAuth();
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [nickname, setNickname] = useState("");
  const [aiMode, setAiMode] = useState("normal");
  const [longResponses, setLongResponses] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load profile (only if logged in)
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

  // Load conversation messages (only if logged in)
  useEffect(() => {
    if (!conversationId || !user) { setMessages([]); return; }
    supabase.from("messages").select("*").eq("conversation_id", conversationId).order("created_at").then(({ data }) => {
      if (data) setMessages(data.map(m => ({ id: m.id, role: m.role as "user" | "assistant", content: m.content })));
    });
  }, [conversationId, user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const createConversation = async (title: string) => {
    if (!user) return null;
    const { data, error } = await supabase.from("conversations").insert({ user_id: user.id, title }).select().single();
    if (error) throw error;
    return data.id as string;
  };

  const saveMessage = async (convId: string, role: string, content: string) => {
    if (!user) return;
    await supabase.from("messages").insert({ conversation_id: convId, role, content });
  };

  const updateConversationTitle = async (convId: string, firstMsg: string) => {
    if (!user) return;
    const title = firstMsg.slice(0, 60) + (firstMsg.length > 60 ? "..." : "");
    await supabase.from("conversations").update({ title }).eq("id", convId);
  };

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    setIsStreaming(true);

    const userMsg: Msg = { role: "user", content: text };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);

    try {
      let convId = conversationId;
      
      // Only persist to DB if logged in
      if (user) {
        if (!convId) {
          convId = await createConversation(text.slice(0, 60));
          if (convId) navigate(`/chat/${convId}`, { replace: true });
        }
        if (convId) {
          await saveMessage(convId, "user", text);
          if (allMessages.filter(m => m.role === "user").length === 1) {
            await updateConversationTitle(convId, text);
          }
        }
      }

      const systemContent = `Você é Sata GOD, uma IA avançada, inteligente e carismática. ${nickname ? `O usuário se chama "${nickname}". Use o nome dele naturalmente nas respostas.` : ""} ${aiMode === "advanced" ? "Responda de forma detalhada e técnica quando apropriado." : "Mantenha respostas concisas e diretas."} ${!longResponses ? "Seja breve nas respostas." : ""} Responda sempre em português brasileiro.`;

      const apiMessages = [
        { role: "system", content: systemContent },
        ...allMessages.map(m => ({ role: m.role, content: m.content })),
      ];

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sata-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (resp.status === 429) { toast.error("Muitas requisições. Tente novamente em breve."); setIsStreaming(false); return; }
      if (resp.status === 402) { toast.error("Créditos esgotados."); setIsStreaming(false); return; }
      if (!resp.ok || !resp.body) throw new Error("Falha ao conectar com a IA");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                return [...prev, { role: "assistant", content: assistantContent }];
              });
            }
          } catch {}
        }
      }

      if (assistantContent && convId && user) {
        await saveMessage(convId, "assistant", assistantContent);
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar mensagem");
    } finally {
      setIsStreaming(false);
    }
  }, [input, messages, isStreaming, user, conversationId, nickname, aiMode, longResponses, navigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="h-screen flex bg-background">
      <AnimatePresence>
        {sidebarOpen && <Sidebar onClose={() => setSidebarOpen(false)} currentConvId={conversationId} />}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center px-4 border-b border-border shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1 flex items-center justify-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Sata GOD</span>
          </div>
          <button onClick={() => { navigate("/"); setMessages([]); }} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <Plus className="w-5 h-5 text-foreground" />
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <Zap className="w-12 h-12 text-primary mb-4 animate-pulse-glow" />
              <h2 className="text-xl font-bold mb-2">
                {nickname ? `E aí, ${nickname} 😏` : "Sata GOD"}
              </h2>
              <p className="text-muted-foreground text-sm max-w-sm">Como posso te ajudar hoje?</p>
              {!user && (
                <button onClick={() => navigate("/auth")} className="mt-4 text-xs text-primary hover:underline">
                  Faça login para salvar suas conversas
                </button>
              )}
            </div>
          )}
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((msg, i) => (
              <MessageBubble key={i} role={msg.role} content={msg.content} />
            ))}
            {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex gap-2 items-center text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Pensando...
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-border shrink-0">
          <div className="max-w-3xl mx-auto flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem..."
              rows={1}
              className="flex-1 resize-none bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 max-h-32"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isStreaming}
              className="p-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
