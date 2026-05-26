import type { Metadata, Viewport } from "next";
import { Inter, Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import { RegisterServiceWorker } from "@/components/register-sw";
import { LgpdBanner } from "@/components/lgpd-banner";
import { DynamicBranding } from "@/components/dynamic-branding";
import { ThemeScript } from "@/components/theme-script";
import { getLocale } from "@/lib/i18n";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Bolão Copa do Mundo 2026",
  description: "Bolão corporativo da Copa do Mundo FIFA 2026",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bolão 2026",
  },
};

export const viewport: Viewport = {
  themeColor: "#009C3B",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <head>
        <ThemeScript />
        <DynamicBranding />
      </head>
      <body>
        {children}
        <LgpdBanner />
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
