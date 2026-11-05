"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SmoothScroll from "@/components/motion/SmoothScroll";
import ScrollProgress from "@/components/motion/ScrollProgress";
import CursorEffects from "@/components/motion/CursorEffects";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  // Si on est dans l'espace administrateur, on ne rend pas la Navbar ni le Footer public
  if (isAdmin) {
    return <main className="flex-grow flex flex-col w-full h-full min-h-screen relative">{children}</main>;
  }

  return (
    <>
      <SmoothScroll />
      <ScrollProgress />
      <CursorEffects />
      <Navbar />
      {/* Fond opaque + ombre : la page « se soulève » et dévoile le pied de page placé dessous (écrans moyens et plus) */}
      <main className="flex-grow flex flex-col bg-background md:shadow-[0_40px_60px_-30px_rgba(0,0,0,0.55)]">{children}</main>
      <Footer />
    </>
  );
}
