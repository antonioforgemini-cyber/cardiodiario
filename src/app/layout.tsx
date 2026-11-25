import type { Metadata, Viewport } from "next";
import { Literata, Nunito_Sans } from "next/font/google";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { PwaManager } from "@/components/pwa/PwaManager";
import "./globals.css";

const literata = Literata({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-literata",
});

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-nunito-sans",
});

export const metadata: Metadata = {
  title: {
    default: "CardioDiario — Diario delle Misurazioni Pressorie",
    template: "%s | CardioDiario",
  },
  description:
    "Il tuo diario pressorio digitale connesso direttamente con il tuo medico curante.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CardioDiario",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  other: {
    "text-scale": "scale",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#4a7c59",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={`${literata.variable} ${nunitoSans.variable}`}>
      <body className="bg-background text-on-surface min-h-screen flex flex-col font-body selection:bg-primary/20 selection:text-primary">
        <ToastProvider>
          <PwaManager />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
