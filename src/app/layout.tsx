import type { Metadata } from "next";
import { Cinzel, Rajdhani } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

const cinzel = Cinzel({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const rajdhani = Rajdhani({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Master of Masters",
  description: "Command monsters, forge dark pacts, crush the Inquisition.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${cinzel.variable} ${rajdhani.variable} antialiased`}>
        <SessionProvider>
          {children}
        </SessionProvider>
        <div id="modal-portal" />
      </body>
    </html>
  );
}
