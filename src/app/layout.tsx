import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import NavBar from "@/components/ui/NavBar";
import { getSession } from "@/lib/auth/session";
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
  title: "Splitup",
  description:
    "Expense splitting for group living — settle with one tap via UPI",
  manifest: "/manifest.json",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#6366f1" />
      </head>
      <body className="min-h-full bg-gray-50 font-sans text-gray-900">
        <NavBar user={session?.user ?? null} />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
