"use client";

import { useUser, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Bot, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isSignedIn } = useUser();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black transition group-hover:scale-105">
                <Bot className="h-5 w-5" />
              </div>
              <span className="font-semibold text-white">
                RAG Chatbot
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/chat"
                className="text-sm text-zinc-300 transition hover:text-white"
              >
                Chat
              </Link>
              <Link
                href="/dashboard"
                className="text-sm text-zinc-300 transition hover:text-white"
              >
                Dashboard
              </Link>
              <Link
                href="/documents"
                className="text-sm text-zinc-300 transition hover:text-white"
              >
                Documents
              </Link>
            </div>
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-4">
            {/* Signed Out State */}
            {!isSignedIn && (
              <div className="hidden sm:flex items-center gap-3">
                <SignInButton mode="modal">
                  <button className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200">
                    Sign Up
                  </button>
                </SignUpButton>
              </div>
            )}

            {/* Signed In State */}
            {isSignedIn && (
              <div className="hidden sm:flex items-center gap-4">
                <Link
                  href="/profile"
                  className="text-sm text-zinc-300 transition hover:text-white"
                >
                  Profile
                </Link>
                <UserButton />
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden rounded-lg p-2 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-800 py-4">
            <div className="flex flex-col gap-3">
              <Link
                href="/chat"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 text-sm text-zinc-300 rounded-lg transition hover:bg-zinc-800 hover:text-white"
              >
                Chat
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 text-sm text-zinc-300 rounded-lg transition hover:bg-zinc-800 hover:text-white"
              >
                Dashboard
              </Link>
              <Link
                href="/documents"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 text-sm text-zinc-300 rounded-lg transition hover:bg-zinc-800 hover:text-white"
              >
                Documents
              </Link>
              
              {/* Mobile Auth Buttons */}
              {!isSignedIn && (
                <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800">
                  <SignInButton mode="modal">
                    <button className="w-full rounded-lg px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200">
                      Sign Up
                    </button>
                  </SignUpButton>
                </div>
              )}
              
              {isSignedIn && (
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                  <Link
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-3 py-2 text-sm text-zinc-300 rounded-lg transition hover:bg-zinc-800 hover:text-white"
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