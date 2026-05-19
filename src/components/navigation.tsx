"use client";

import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { Bot, Menu, MessageSquareText, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/chat", label: "Chat" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/documents", label: "Documents" },
];

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isSignedIn } = useUser();
  const pathname = usePathname();

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#080b0f]/88 shadow-[0_18px_48px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="group flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-300/25 bg-emerald-400/15 text-emerald-200 transition group-hover:border-emerald-300/45 group-hover:bg-emerald-400/25">
                <Bot className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold tracking-wide text-white">
                RAG Chatbot
              </span>
            </Link>

            <div className="hidden items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] p-1 md:flex">
              {links.map((link) => {
                const isActive = pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-md px-3 py-2 text-sm transition ${
                      isActive
                        ? "bg-white/10 text-white shadow-sm"
                        : "text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {!isSignedIn && (
              <div className="hidden items-center gap-2 sm:flex">
                <SignInButton mode="modal">
                  <button
                    className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
                    type="button"
                  >
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button
                    className="rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-200"
                    type="button"
                  >
                    Sign Up
                  </button>
                </SignUpButton>
              </div>
            )}

            {isSignedIn && (
              <div className="hidden items-center gap-4 sm:flex">
                <Link
                  href="/profile"
                  className="text-sm text-zinc-300 transition hover:text-white"
                >
                  Profile
                </Link>
                <UserButton />
              </div>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-lg p-2 text-zinc-300 transition hover:bg-white/[0.06] hover:text-white md:hidden"
              type="button"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="border-t border-white/10 py-4 md:hidden">
            <div className="flex flex-col gap-2">
              {links.map((link) => {
                const isActive = pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                      isActive
                        ? "bg-white/10 text-white"
                        : "text-zinc-300 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <MessageSquareText className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}

              {!isSignedIn && (
                <div className="mt-2 flex flex-col gap-2 border-t border-white/10 pt-3">
                  <SignInButton mode="modal">
                    <button
                      className="w-full rounded-lg px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
                      type="button"
                    >
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button
                      className="w-full rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-200"
                      type="button"
                    >
                      Sign Up
                    </button>
                  </SignUpButton>
                </div>
              )}

              {isSignedIn && (
                <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-3">
                  <Link
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    Profile
                  </Link>
                  <UserButton />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
