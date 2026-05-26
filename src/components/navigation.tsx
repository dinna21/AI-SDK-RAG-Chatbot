"use client";

import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import {
  Bot,
  MessageSquareText,
  LayoutDashboard,
  FileStack,
  X,
  Menu,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const links = [
  {
    href: "/chat",
    label: "Chat",
    icon: <MessageSquareText className="h-4 w-4" />,
    description: "Talk to your docs",
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
    description: "Usage & analytics",
  },
  {
    href: "/upload",
    label: "Documents",
    icon: <FileStack className="h-4 w-4" />,
    description: "Manage your files",
  },
];

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isSignedIn } = useUser();
  const pathname = usePathname();
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Scroll shadow effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Close on outside click
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isMobileMenuOpen]);

  // Close mobile menu on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <style>{`
        @keyframes navSlideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes mobileMenuIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .nav-animate { animation: navSlideDown 0.35s ease-out both; }
        .mobile-menu-animate { animation: mobileMenuIn 0.22s ease-out both; }

        /* Active link underline pill */
        .nav-link-active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 50%;
          transform: translateX(-50%);
          width: 16px;
          height: 2px;
          border-radius: 99px;
          background: #34d399;
        }
      `}</style>

      <nav
        ref={mobileMenuRef}
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "border-b border-white/[0.07] bg-[#07090d]/95 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl"
            : "border-b border-transparent bg-[#07090d]/80 backdrop-blur-md"
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">

            {/* ── Logo ── */}
            <Link
              href="/"
              className="group flex items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 rounded-lg"
              aria-label="RAG Chatbot home"
            >
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/20 bg-linear-to-br from-emerald-400/15 to-cyan-400/10 text-emerald-300 shadow-[0_0_16px_rgba(52,211,153,0.1)] transition-all duration-300 group-hover:border-emerald-400/40 group-hover:shadow-[0_0_24px_rgba(52,211,153,0.18)]">
                <Bot className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                {/* Subtle pulse ring on hover */}
                <span className="absolute inset-0 rounded-xl opacity-0 ring-1 ring-emerald-400/30 transition-opacity duration-300 group-hover:opacity-100 group-hover:animate-ping" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-sm font-semibold tracking-wide text-white">
                  RAG Chatbot
                </span>
                <span className="text-[10px] font-medium tracking-widest text-emerald-400/60 uppercase">
                  AI · Docs
                </span>
              </div>
            </Link>

            {/* ── Desktop nav links ── */}
            <div className="hidden items-center gap-1 md:flex" aria-label="Navigation links">
              {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    title={link.description}
                    className={`relative flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 ${
                      isActive
                        ? "nav-link-active bg-emerald-400/8 text-emerald-300"
                        : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                    }`}
                  >
                    <span
                      className={`transition-colors duration-200 ${
                        isActive ? "text-emerald-400" : "text-zinc-500"
                      }`}
                    >
                      {link.icon}
                    </span>
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* ── Auth + mobile toggle ── */}
            <div className="flex items-center gap-3">
              {/* Desktop auth */}
              {!isSignedIn && (
                <div className="hidden items-center gap-2 sm:flex">
                  <SignInButton mode="modal">
                    <button
                      type="button"
                        className="rounded-lg px-3.5 py-2 text-sm font-medium text-zinc-400 transition-all duration-200 hover:bg-white/5 hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
                    >
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button
                      type="button"
                        className="rounded-xl bg-linear-to-r from-emerald-400 to-cyan-400 px-4 py-2 text-sm font-semibold text-zinc-950 shadow-[0_4px_14px_rgba(52,211,153,0.25)] transition-all duration-200 hover:shadow-[0_4px_20px_rgba(52,211,153,0.4)] hover:brightness-110 outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
                    >
                      Get Started
                    </button>
                  </SignUpButton>
                </div>
              )}

              {isSignedIn && (
                <div className="hidden items-center gap-3 sm:flex">
                  <Link
                    href="/profile"
                    className="rounded-lg px-3 py-2 text-sm text-zinc-400 transition-all duration-200 hover:bg-white/5 hover:text-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
                  >
                    Profile
                  </Link>
                  {/* Subtle ring around Clerk UserButton */}
                  <div className="rounded-full ring-1 ring-white/10 ring-offset-1 ring-offset-[#07090d] transition-all hover:ring-emerald-400/30">
                    <UserButton />
                  </div>
                </div>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setIsMobileMenuOpen((v) => !v)}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/7 bg-white/3 text-zinc-400 transition-all duration-200 hover:border-white/12 hover:bg-white/7 hover:text-white md:hidden outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
                type="button"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                aria-controls="mobile-menu"
              >
                <span
                  className={`absolute transition-all duration-200 ${
                    isMobileMenuOpen ? "opacity-100 rotate-0" : "opacity-0 rotate-90"
                  }`}
                >
                  <X className="h-4 w-4" />
                </span>
                <span
                  className={`absolute transition-all duration-200 ${
                    isMobileMenuOpen ? "opacity-0 -rotate-90" : "opacity-100 rotate-0"
                  }`}
                >
                  <Menu className="h-4 w-4" />
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile menu ── */}
        {isMobileMenuOpen && (
          <div
            id="mobile-menu"
            aria-label="Mobile navigation"
            className="mobile-menu-animate border-t border-white/6 bg-[#07090d]/98 pb-5 pt-3 md:hidden"
          >
            <div className="mx-auto max-w-7xl space-y-1 px-4">
              {links.map((link, i) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-between rounded-xl px-3.5 py-3 text-sm transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 ${
                      isActive
                        ? "bg-emerald-400/8 text-emerald-300"
                        : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                    }`}
                    style={{ animationDelay: `${i * 0.04}s` }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`${
                          isActive ? "text-emerald-400" : "text-zinc-500"
                        }`}
                      >
                        {link.icon}
                      </span>
                      <div>
                        <div className="font-medium leading-none">{link.label}</div>
                        <div className="mt-0.5 text-[11px] text-zinc-600">
                          {link.description}
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      className={`h-3.5 w-3.5 transition-colors ${
                        isActive ? "text-emerald-400/50" : "text-zinc-700"
                      }`}
                    />
                  </Link>
                );
              })}

              {/* Mobile auth */}
              <div className="mt-3 border-t border-white/6 pt-4">
                {!isSignedIn ? (
                  <div className="flex flex-col gap-2">
                    <SignInButton mode="modal">
                      <button
                        type="button"
                        className="w-full rounded-xl border border-white/7 bg-white/3 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/7 hover:text-white"
                      >
                        Sign In
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button
                        type="button"
                        className="w-full rounded-xl bg-linear-to-r from-emerald-400 to-cyan-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 shadow-[0_4px_14px_rgba(52,211,153,0.2)] transition hover:brightness-110"
                      >
                        Get Started — Free
                      </button>
                    </SignUpButton>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-1">
                    <Link
                      href="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100"
                    >
                      Profile
                    </Link>
                    <div className="rounded-full ring-1 ring-white/10 ring-offset-1 ring-offset-[#07090d]">
                      <UserButton />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}