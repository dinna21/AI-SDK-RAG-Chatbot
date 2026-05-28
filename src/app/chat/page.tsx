"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  ArrowUp,
  Bot,
  BookOpen,
  Copy,
  Check,
  Loader2,
  RefreshCw,
  Sparkles,
  User,
  FileSearch,
  Lightbulb,
} from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";

const suggestions = [
  {
    icon: <FileSearch className="h-4 w-4" />,
    label: "Summarize document",
    text: "Summarize the latest uploaded document",
  },
  {
    icon: <BookOpen className="h-4 w-4" />,
    label: "Find policy details",
    text: "Find policy details with context",
  },
  {
    icon: <Lightbulb className="h-4 w-4" />,
    label: "Draft an answer",
    text: "Draft an answer from retrieved notes",
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-md hover:bg-white/10 text-zinc-500 hover:text-zinc-300"
      aria-label="Copy message"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-400" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 sm:gap-4 justify-start animate-fade-in">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-400/10 text-emerald-300 shadow-[0_0_16px_rgba(52,211,153,0.08)]">
        <Bot className="h-4 w-4" />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-white/[0.07] bg-[#111823] px-4 py-3.5 shadow-lg shadow-black/20">
        <span className="h-2 w-2 rounded-full bg-emerald-400/70 animate-[bounce_1s_ease-in-out_infinite]" />
        <span className="h-2 w-2 rounded-full bg-emerald-400/70 animate-[bounce_1s_ease-in-out_0.15s_infinite]" />
        <span className="h-2 w-2 rounded-full bg-emerald-400/70 animate-[bounce_1s_ease-in-out_0.3s_infinite]" />
      </div>
    </div>
  );
}

// Simple markdown-like renderer for bold, inline code, and line breaks
function MessageContent({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={i}
              className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs text-emerald-300"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return (
          <span key={i}>
            {part.split("\n").map((line, j, arr) => (
              <span key={j}>
                {line}
                {j < arr.length - 1 && <br />}
              </span>
            ))}
          </span>
        );
      })}
    </span>
  );
}

export default function ChatPage() {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const { messages, sendMessage, status, error, reload } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  const isLoading = status === "submitted" || status === "streaming";
  const isStreaming = status === "streaming";

  // Auto-resize textarea
  const handleTextareaInput = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, []);

  // Scroll to bottom helper
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  // Track scroll position to show/hide scroll-to-bottom button
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const scrolledUp = distanceFromBottom > 120;
    setIsUserScrolledUp(scrolledUp);
    setShowScrollButton(scrolledUp && messages.length > 0);
  }, [messages.length]);

  // Auto-scroll: only when user hasn't scrolled up manually
  useEffect(() => {
    if (!isUserScrolledUp) {
      scrollToBottom("smooth");
    }
  }, [messages, isLoading, isUserScrolledUp, scrollToBottom]);

  // Scroll to bottom instantly on new user message
  useEffect(() => {
    if (status === "submitted") {
      setIsUserScrolledUp(false);
      scrollToBottom("instant" as ScrollBehavior);
    }
  }, [status, scrollToBottom]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input;
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    await sendMessage({ text: message });
  }

  const characterCount = input.length;
  const isNearLimit = characterCount > 1800;

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.25s ease-out both;
        }
        .animate-slide-up {
          animation: slideUp 0.3s ease-out both;
        }
        .scroll-area {
          scrollbar-width: thin;
          scrollbar-color: #1f2d3d transparent;
        }
        .scroll-area::-webkit-scrollbar {
          width: 5px;
        }
        .scroll-area::-webkit-scrollbar-track {
          background: transparent;
        }
        .scroll-area::-webkit-scrollbar-thumb {
          background: #1f2d3d;
          border-radius: 99px;
        }
        .scroll-area::-webkit-scrollbar-thumb:hover {
          background: #2d4a5e;
        }
      `}</style>

      <section className="flex h-[calc(100dvh-4rem)] min-h-0 flex-col overflow-hidden bg-[#07090d] text-white">
        {/* Ambient background glow */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/[0.04] blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-cyan-500/[0.04] blur-3xl" />
        </div>

        {/* Messages area */}
        <main
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="scroll-area relative min-h-0 flex-1 overflow-y-auto px-4 py-8 sm:px-6"
        >
          <div className="mx-auto flex max-w-3xl flex-col gap-5">
            {/* Empty state */}
            {messages.length === 0 && !isLoading && (
              <div className="mx-auto mt-12 flex max-w-xl flex-col items-center justify-center text-center animate-slide-up sm:mt-20">
                <div className="relative mb-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-400/15 to-cyan-400/10 text-emerald-200 shadow-[0_0_40px_rgba(52,211,153,0.1)]">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <div className="absolute -inset-1 rounded-2xl bg-emerald-400/5 blur-md -z-10" />
                </div>

                <h2 className="mb-2.5 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Ask your knowledge base
                </h2>
                <p className="text-sm leading-7 text-zinc-500 sm:text-[0.9375rem]">
                  Search documents, summarize policies, and turn scattered
                  context into clear answers — without leaving chat.
                </p>

                <div className="mt-8 grid w-full gap-2.5 sm:grid-cols-3">
                  {suggestions.map((s) => (
                    <button
                      key={s.text}
                      type="button"
                      onClick={() => {
                        setInput(s.text);
                        textareaRef.current?.focus();
                      }}
                      className="group flex flex-col gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 text-left transition-all duration-200 hover:border-emerald-400/25 hover:bg-emerald-400/[0.06] hover:shadow-[0_0_20px_rgba(52,211,153,0.06)]"
                    >
                      <span className="text-emerald-400/70 transition group-hover:text-emerald-300">
                        {s.icon}
                      </span>
                      <span className="text-xs font-medium text-zinc-400 transition group-hover:text-zinc-200">
                        {s.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((message, msgIndex) => {
              const isUser = message.role === "user";
              const fullText = message.parts
                .filter((p) => p.type === "text")
                .map((p) => (p as { type: "text"; text: string }).text)
                .join("");

              return (
                <div
                  key={message.id}
                  className={`group flex gap-3 animate-fade-in sm:gap-4 ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                  style={{ animationDelay: `${Math.min(msgIndex * 0.03, 0.15)}s` }}
                >
                  {!isUser && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300 shadow-[0_0_16px_rgba(52,211,153,0.06)]">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div className="flex max-w-[82%] flex-col gap-1.5 sm:max-w-[74%]">
                    <div
                      className={`relative rounded-2xl px-4 py-3 text-sm leading-7 shadow-lg ${
                        isUser
                          ? "rounded-tr-sm bg-gradient-to-br from-cyan-300 to-cyan-400 text-zinc-950 shadow-cyan-950/30"
                          : "rounded-tl-sm border border-white/[0.07] bg-[#0f1620] text-zinc-200 shadow-black/30"
                      }`}
                    >
                      {message.parts.map((part, index) => {
                        if (part.type !== "text") return null;
                        return (
                          <MessageContent
                            key={`${message.id}-${index}`}
                            text={(part as { type: "text"; text: string }).text}
                          />
                        );
                      })}
                    </div>

                    {/* Copy + timestamp row for AI messages */}
                    {!isUser && fullText && (
                      <div className="flex items-center gap-1 pl-1">
                        <CopyButton text={fullText} />
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-300/15 text-cyan-200">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing indicator — shown while submitted (before streaming starts) */}
            {status === "submitted" && <TypingIndicator />}

            {/* Streaming indicator label */}
            {isStreaming && (
              <div className="flex items-center gap-2 pl-12 text-xs text-zinc-600 animate-fade-in">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Generating response…
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-500/[0.07] px-4 py-3.5 text-sm text-red-300 animate-fade-in">
                <span className="mt-0.5 shrink-0 text-red-400">⚠</span>
                <div className="flex-1">
                  <p>{error.message || "Something went wrong. Please try again."}</p>
                </div>
                <button
                  onClick={() => reload()}
                  className="shrink-0 flex items-center gap-1.5 rounded-lg border border-red-400/20 bg-red-400/10 px-2.5 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-400/20"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry
                </button>
              </div>
            )}

            <div ref={messagesEndRef} className="h-1" />
          </div>
        </main>

        {/* Scroll to bottom button */}
        {showScrollButton && (
          <div className="pointer-events-none absolute bottom-24 left-0 right-0 flex justify-center">
            <button
              onClick={() => {
                setIsUserScrolledUp(false);
                scrollToBottom("smooth");
              }}
              className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-white/10 bg-[#111823]/90 px-3.5 py-2 text-xs font-medium text-zinc-300 shadow-lg backdrop-blur-sm transition hover:bg-[#1a2332] hover:text-white animate-fade-in"
            >
              ↓ Scroll to latest
            </button>
          </div>
        )}

        {/* Input footer */}
        <footer className="relative shrink-0 border-t border-white/[0.06] bg-[#07090d]/95 px-4 py-4 shadow-[0_-20px_48px_rgba(0,0,0,0.3)] backdrop-blur-sm">
          <div className="mx-auto max-w-3xl">
            <form
              onSubmit={handleSubmit}
              className="relative flex items-end gap-2 rounded-2xl border border-white/[0.08] bg-[#0c1018] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all duration-200 focus-within:border-emerald-400/30 focus-within:shadow-[0_0_0_3px_rgba(52,211,153,0.06)]"
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  handleTextareaInput();
                }}
                placeholder="Ask about your documents…"
                rows={1}
                className="max-h-40 min-h-[2.75rem] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-zinc-600"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
              />

              <div className="flex shrink-0 items-end gap-2 pb-0.5">
                {/* Character count warning */}
                {isNearLimit && (
                  <span className="text-[11px] text-amber-400/70">
                    {characterCount}/2000
                  </span>
                )}

                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400 text-zinc-950 shadow-[0_4px_14px_rgba(52,211,153,0.25)] transition-all duration-200 hover:bg-emerald-300 hover:shadow-[0_4px_18px_rgba(52,211,153,0.35)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUp className="h-4 w-4" />
                  )}
                </button>
              </div>
            </form>

            <p className="mt-2.5 text-center text-[11px] text-zinc-600">
              Press <kbd className="rounded border border-white/10 bg-white/[0.04] px-1 py-0.5 font-mono text-[10px]">Enter</kbd> to send &nbsp;·&nbsp; <kbd className="rounded border border-white/10 bg-white/[0.04] px-1 py-0.5 font-mono text-[10px]">Shift+Enter</kbd> for new line
            </p>
          </div>
        </footer>
      </section>
    </>
  );
}