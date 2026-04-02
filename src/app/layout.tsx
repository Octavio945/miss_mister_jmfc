import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { TransitionProvider } from "@/components/TransitionProvider";
import { AppLayout } from "@/components/AppLayout";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Miss & Mister JMFC 2026",
  description: "Plateforme de vote pour le concours Miss & Mister Jeunesse Missionnaire Foi et Culture du Bénin",
  icons: {
    icon: "/images/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen flex flex-col font-sans antialiased text-foreground bg-background">
        <TransitionProvider>
          <AppLayout>{children}</AppLayout>
        </TransitionProvider>
      </body>
    </html>
  );
}
