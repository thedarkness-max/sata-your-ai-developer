import { motion } from "framer-motion";
import { Zap, User } from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";

export default function MessageBubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "justify-end" : ""}`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
          <Zap className="w-3.5 h-3.5 text-primary" />
        </div>
      )}
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${isUser ? "bg-primary text-primary-foreground" : "bg-card border border-border text-card-foreground"}`}>
        {isUser ? <p className="whitespace-pre-wrap">{content}</p> : <MarkdownRenderer content={content} />}
      </div>
      {isUser && (
        <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-1">
          <User className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      )}
    </motion.div>
  );
}
