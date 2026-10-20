import type { Metadata, Viewport } from "next";
import { DM_Sans, Inter, Manrope, Plus_Jakarta_Sans } from "next/font/google";
import { getSettings } from "@/lib/catalog";
import { readableOn } from "@/lib/color";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

// Fontes oferecidas no painel. Só a escolhida é baixada pelo navegador.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap", preload: false });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap", preload: false });
const dmsans = DM_Sans({ subsets: ["latin"], variable: "--font-dmsans", display: "swap", preload: false });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const title = s.seo.title || s.brand.name;
  const description = s.seo.description || s.brand.tagline || undefined;
  return {
    metadataBase: new URL(siteUrl),
    title: { default: title, template: `%s · ${s.brand.name}` },
    description,
    applicationName: s.brand.name,
    icons: s.brand.faviconUrl ? { icon: s.brand.faviconUrl, apple: s.brand.faviconUrl } : undefined,
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: s.brand.name,
      title,
      description,
      images: s.seo.ogImageUrl ? [s.seo.ogImageUrl] : undefined,
    },
    twitter: { card: "summary_large_image" },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const s = await getSettings();
  const light = "#ffffff";
  const dark = "#0a0a0b";
  return {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    themeColor:
      s.brand.theme === "system"
        ? [
            { media: "(prefers-color-scheme: light)", color: light },
            { media: "(prefers-color-scheme: dark)", color: dark },
          ]
        : s.brand.theme === "dark"
          ? dark
          : light,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  const brandVars = `:root{--accent:${s.brand.accent};--accent-fg:${readableOn(s.brand.accent)};--font-brand:var(--font-${s.brand.font});}`;
  return (
    <html
      lang="pt-BR"
      data-theme={s.brand.theme === "system" ? undefined : s.brand.theme}
      className={`${inter.variable} ${manrope.variable} ${jakarta.variable} ${dmsans.variable}`}
    >
      <head>
        <style>{brandVars}</style>
      </head>
      <body className="min-h-dvh">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
