import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import GlobalSettingsSync from "@/components/settings/global-settings-sync";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const BASE_URL = "https://www.cspark.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: "CSPARK | AI CV Builder & Multi-Platform Job Search",
    template: "%s | CSPARK",
  },
  description:
    "Build ATS-optimized CVs and search jobs on LinkedIn, Workday & CareerOne with AI. Powered by Meta Llama 3.3 70B. Free to start — no credit card required.",
  keywords: [
    "AI CV builder",
    "AI resume builder",
    "ATS optimization",
    "CV tailoring tool",
    "LinkedIn job search",
    "Workday job search",
    "CareerOne job search",
    "AI CV optimization",
    "resume ATS checker",
    "job application dashboard",
    "CV builder online free",
    "AI job matching",
    "resume for ATS",
    "CV for LinkedIn",
    "Meta Llama resume",
  ],
  authors: [{ name: "CSPARK", url: BASE_URL }],
  creator: "CSPARK",
  publisher: "CSPARK",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  alternates: {
    canonical: BASE_URL,
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "CSPARK",
    title: "CSPARK | AI CV Builder & Multi-Platform Job Search",
    description:
      "Build ATS-optimized CVs and search jobs on LinkedIn, Workday & CareerOne with AI. Powered by Meta Llama 3.3. Free to start.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CSPARK — AI CV Builder & Multi-Platform Job Search",
        type: "image/png",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "CSPARK | AI CV Builder & Multi-Platform Job Search",
    description:
      "Build ATS-optimized CVs and search jobs on LinkedIn, Workday & CareerOne with AI. Free to start.",
    images: ["/og-image.png"],
    creator: "@CSPARK_app",
    site: "@CSPARK_app",
  },

  icons: {
    icon: [
      { url: "/favicon.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png", sizes: "64x64", type: "image/png" },
    ],
    apple: "/favicon.png",
    shortcut: "/favicon.png",
  },

  category: "technology",

  other: {
    "application-name": "CSPARK",
    "apple-mobile-web-app-title": "CSPARK",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "mobile-web-app-capable": "yes",
    "theme-color": "#FF3000",
    "msapplication-TileColor": "#FF3000",
    "msapplication-config": "/browserconfig.xml",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
      <body className={`${inter.variable} ${geistMono.variable} antialiased swiss-app`}>
        <GlobalSettingsSync />
        {children}
      </body>
    </html>
  );
}
