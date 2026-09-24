"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function SupportWidget() {
  const params = useParams();
  const businessSlug = typeof params?.slug === "string" ? params.slug : null;

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! How can I help you with your booking or studio operations today?",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, open]);

  // Notice the `async` keyword here
  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: Message = { role: "user", content: text };
    const updated = [...messages, userMessage];

    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated, businessSlug }),
      });
      const data = await res.json();

      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, I had trouble reaching the support service.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Network error. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Expanded Chat Box */}
      {open && (
        <div className="mb-4 flex h-[480px] w-[350px] sm:w-[380px] flex-col overflow-hidden rounded-3xl border border-slate-400/40 bg-white/85 shadow-2xl backdrop-blur-2xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-300/70 bg-white/70 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-lime-300/80 bg-lime-100 font-mono text-[10px] font-bold text-lime-950 shadow-2xs">
                ✓
              </span>
              <div>
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-800">
                  Slottick Support AI
                </h4>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-mono text-[10px] text-slate-500">
                    Instant Help
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="rounded-xl border border-slate-300/80 bg-white/80 px-2.5 py-1 font-mono text-xs font-bold text-slate-600 shadow-2xs hover:bg-white hover:text-black"
            >
              ✕
            </button>
          </div>

          {/* Messages Stream */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto p-4 text-xs"
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 leading-relaxed shadow-2xs ${
                    m.role === "user"
                      ? "border border-lime-300/80 bg-lime-100 font-medium text-lime-950"
                      : "border border-slate-300/80 bg-white/95 text-slate-800"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-slate-300/80 bg-white/80 px-4 py-2.5 font-mono text-[11px] text-slate-400">
                  Generating reply...
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSend}
            className="border-t border-slate-300/70 bg-white/80 p-3"
          >
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about booking, policies, or hours..."
                className="h-10 flex-1 rounded-xl border border-slate-300/80 bg-white/90 px-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-xl border border-lime-300/80 bg-lime-100 px-3.5 py-2 font-mono text-xs font-bold text-lime-950 shadow-2xs transition hover:bg-lime-200 disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Floating Toggle Bubble */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-14 w-14 items-center justify-center rounded-2xl border border-lime-300/80 bg-lime-100 text-lime-950 shadow-xl transition-all hover:scale-105 active:scale-95"
        aria-label="Toggle support chat"
      >
        <span className="font-mono text-xl">{open ? "✕" : "💬"}</span>
      </button>
    </div>
  );
}
