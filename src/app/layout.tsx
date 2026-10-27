import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Montserrat, the typeface of the mobile app (FigText.family).
const montserrat = localFont({
  variable: "--font-montserrat",
  display: "swap",
  src: [
    { path: "./fonts/Montserrat-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Montserrat-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/Montserrat-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/Montserrat-Bold.ttf", weight: "700", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "Gérance Immo Service — Administration",
  description: "Plateforme d'administration Gérance Immo Service",
};

import AppLayout from "@/components/AppLayout";
import { Providers } from "@/components/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${montserrat.variable} antialiased flex h-screen bg-brand-cream`}
        suppressHydrationWarning
      >
        <Providers>
          <AppLayout>
            {children}
          </AppLayout>
        </Providers>
      </body>
    </html>
  );
}
