import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import NavBar from "@/components/ui/NavBar";
import { getSession } from "@/lib/auth/session";
import ClientLayout from "./client-layout";
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
        <meta name="theme-color" content="#087B6E" />
      </head>
      <body className="min-h-full bg-background font-sans text-text-heading">
        <ClientLayout>
          <NavBar user={session?.user ?? null} />
          <main className="flex-1">{children}</main>
        </ClientLayout>
      </body>
    </html>
  );
}
