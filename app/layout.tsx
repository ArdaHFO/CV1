import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import GlobalSettingsSync from "@/components/settings/global-settings-sync";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CSpark | AI Resume Builder + LinkedIn Job Search",
  description:
    "CSpark is an AI resume builder with real-time LinkedIn job search. Tailor your CV to each job, optimize for ATS, and apply faster with shareable links and QR codes.",
  keywords: [
    "AI Resume Builder",
    "LinkedIn Job Search",
    "ATS Optimization",
    "CV Tailoring Tool",
    "AI CV Optimization",
    "Resume ATS checker",
    "LinkedIn resume targeting",
    "Job application dashboard",
  ],
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png", sizes: "64x64", type: "image/png" },
    ],
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${geistMono.variable} antialiased swiss-app`}>
        <GlobalSettingsSync />
        {children}
      </body>
    </html>
  );
}
