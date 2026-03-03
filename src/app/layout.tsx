import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GESTIMOU - Votre partenaire de gestion immobilière",
  description: "Plateforme d'administration pour la gestion immobilière",
};

import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Providers } from "@/components/Providers";
import AuthWrapper from "@/components/AuthWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex h-screen bg-gray-50`}
        suppressHydrationWarning
      >
        <Providers>
          <AuthWrapper>
            <Sidebar />
            <div className="flex flex-1 flex-col h-screen overflow-hidden">
              <Header />
              <main className="flex-1 overflow-y-auto p-8">
                {children}
              </main>
            </div>
          </AuthWrapper>
        </Providers>
      </body>
    </html>
  );
}
