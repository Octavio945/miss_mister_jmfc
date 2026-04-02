"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  // Si on est dans l'espace administrateur, on ne rend pas la Navbar ni le Footer public
  if (isAdmin) {
    return <main className="flex-grow flex flex-col w-full h-full min-h-screen relative">{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-grow flex flex-col">{children}</main>
      <Footer />
    </>
  );
}
