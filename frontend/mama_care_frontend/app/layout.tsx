import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MamaCare AI",
  description:
    "AI-powered maternal health platform for pregnant women in Nigeria. Get personalised risk assessments, understand your medical reports, and ask health questions in Yoruba, Igbo, or Hausa.",
  keywords: [
    "maternal health",
    "pregnancy",
    "Nigeria",
    "AI health",
    "prenatal care",
    "risk prediction",
  ],
  authors: [{ name: "Indubitable Team" }],
  openGraph: {
    title: "MamaCare AI",
    description:
      "AI-powered maternal care for every woman in Nigeria, in your language, at your fingertips.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth">
      <body className="min-h-screen flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
