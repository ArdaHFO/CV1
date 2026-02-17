import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import GlobalSettingsSync from "@/components/settings/global-settings-sync";
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
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "64x64", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GlobalSettingsSync />
        {children}
      </body>
    </html>
  );
}
