"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowUp, Bot, Loader2, User } from "lucide-react";

export default function ChatPage() {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

const {
  messages,
  sendMessage,
  status,
  error,
} = useChat({
  transport: new DefaultChatTransport({
    api: "/api/chat",
  }),
});

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

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
    <div className="flex h-screen flex-col bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black">
            <Bot className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-lg font-semibold">RAG Chatbot</h1>
            <p className="text-sm text-zinc-400">
              AI-powered document assistant
            </p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          {messages.length === 0 && (
            <div className="mt-24 flex flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                <Bot className="h-10 w-10 text-zinc-300" />
              </div>

              <h2 className="mb-2 text-2xl font-semibold">
                Start a conversation
              </h2>

              <p className="max-w-md text-zinc-400">
                Ask questions about your documents, company policies,
                employees, or anything connected to your RAG system.
              </p>
            </div>
          )}

          {messages.map((message) => {
            const isUser = message.role === "user";

            return (
              <div
                key={message.id}
                className={`flex gap-4 ${
                  isUser ? "justify-end" : "justify-start"
                }`}
              >
                {!isUser && (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800">
                    <Bot className="h-5 w-5" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-7 shadow-lg ${
                    isUser
                      ? "bg-white text-black"
                      : "border border-zinc-800 bg-zinc-900 text-zinc-100"
                  }`}
                >
                  {message.parts.map((part, index) => {
                    if (part.type !== "text") return null;

                    return (
                      <div
                        key={`${message.id}-${index}`}
                        className="whitespace-pre-wrap"
                      >
                        {part.text}
                      </div>
                    );
                  })}
                </div>

                {isUser && (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-black">
                    <User className="h-5 w-5" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-3 text-zinc-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>AI is thinking...</span>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
              {error.message || "Something went wrong. Please try again."}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <footer className="border-t border-zinc-800 bg-zinc-900 p-4">
        <div className="mx-auto max-w-4xl">
          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-3"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask something..."
              rows={1}
              className="max-h-40 flex-1 resize-none bg-transparent px-2 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
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
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-black transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
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
    </div>
  );
}