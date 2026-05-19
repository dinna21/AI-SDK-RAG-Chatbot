import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import Navigation from "@/components/navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "RAG Chatbot",
  description: "AI-powered document assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full">
        <body className="min-h-dvh bg-[#080b0f] text-zinc-100 antialiased">
          <Navigation />
          <main className="min-h-dvh pt-16">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
