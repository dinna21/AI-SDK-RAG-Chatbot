"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  ArrowUp,
  Bot,
  Loader2,
  Sparkles,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const suggestions = [
  "Summarize the latest uploaded document",
  "Find policy details with context",
  "Draft an answer from retrieved notes",
];

export default function ChatPage() {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  const isLoading = status === "submitted" || status === "streaming";
  const latestMessageFingerprint = messages
    .map((message) =>
      message.parts
        .map((part) => (part.type === "text" ? part.text : ""))
        .join(""),
    )
    .join("");

  useEffect(() => {
    if (!latestMessageFingerprint && messages.length > 0) return;

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [latestMessageFingerprint, messages.length]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const message = input;
    setInput("");

    await sendMessage({
      text: message,
    });
  }

  return (
    <section className="flex h-[calc(100dvh-4rem)] min-h-0 flex-col overflow-hidden bg-[#080b0f] text-white">
      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 [scrollbar-color:#2dd4bf_#111827] sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          {messages.length === 0 && (
            <div className="mx-auto mt-16 flex max-w-2xl flex-col items-center justify-center text-center sm:mt-24">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 shadow-[0_24px_80px_rgba(34,211,238,0.08)]">
                <Sparkles className="h-8 w-8" />
              </div>

              <h2 className="mb-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                Ask your knowledge base
              </h2>

              <p className="text-balance text-sm leading-7 text-zinc-400 sm:text-base">
                Search documents, summarize policies, and turn scattered context
                into a useful answer without leaving the chat.
              </p>

              <div className="mt-8 grid w-full gap-3 text-left sm:grid-cols-3">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setInput(suggestion)}
                    className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-zinc-300 transition hover:border-emerald-300/30 hover:bg-emerald-300/10 hover:text-white"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => {
            const isUser = message.role === "user";

            return (
              <div
                key={message.id}
                className={`flex gap-3 sm:gap-4 ${
                  isUser ? "justify-end" : "justify-start"
                }`}
              >
                {!isUser && (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-300/20 bg-emerald-300/10 text-emerald-100">
                    <Bot className="h-5 w-5" />
                  </div>
                )}

                <div
                  className={`max-w-[84%] rounded-2xl px-4 py-3 text-sm leading-7 shadow-lg sm:max-w-[76%] ${
                    isUser
                      ? "bg-cyan-300 text-zinc-950 shadow-cyan-950/30"
                      : "border border-white/10 bg-[#111823] text-zinc-100 shadow-black/20"
                  }`}
                >
                  {message.parts.map((part, index) => {
                    if (part.type !== "text") return null;

                    return (
                      <div
                        key={`${message.id}-${index}`}
                        className="whitespace-pre-wrap break-words"
                      >
                        {part.text}
                      </div>
                    );
                  })}
                </div>

                {isUser && (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan-200/40 bg-cyan-300 text-zinc-950">
                    <User className="h-5 w-5" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-3 text-sm text-zinc-400">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-200" />
              <span>AI is thinking...</span>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error.message || "Something went wrong. Please try again."}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="shrink-0 border-t border-white/10 bg-[#0d1117]/95 p-4 shadow-[0_-18px_48px_rgba(0,0,0,0.24)]">
        <div className="mx-auto max-w-5xl">
          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-3 rounded-xl border border-white/10 bg-[#080b0f] p-2 shadow-inner shadow-black/30 focus-within:border-cyan-300/45"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your documents..."
              rows={1}
              className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  const form = e.currentTarget.form;
                  if (form) {
                    const submitEvent = new Event("submit", {
                      bubbles: true,
                      cancelable: true,
                    });
                    form.dispatchEvent(submitEvent);
                  }
                }
              }}
            />

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-300 text-zinc-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ArrowUp className="h-5 w-5" />
              )}
            </button>
          </form>

          <p className="mt-3 text-center text-xs text-zinc-500">
            Responses may contain mistakes. Verify important information.
          </p>
        </div>
      </footer>
    </section>
  );
}