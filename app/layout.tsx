import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from 'next-auth/react';
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Client Management & Appointment System",
  description: "Minimalist client management and appointment interface"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans`}>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}

