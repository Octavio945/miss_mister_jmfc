"use client";

import { TransitionLink as Link } from "@/components/TransitionLink";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { MagneticButton } from "@/components/AnimatedSection";
import { Menu, X } from "lucide-react";
import Image from "next/image";

const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/participants", label: "Candidats" },
  { href: "/historique", label: "Historique" },
  { href: "/a-propos", label: "À Propos" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const pathname = usePathname();
  // Barre transparente seulement au-dessus d'un bandeau sombre (accueil, page d'une édition) :
  // sur les pages claires, des liens blancs sur fond blanc seraient illisibles
  const overDarkHero = pathname === "/" || /^\/historique\/[^/]+$/.test(pathname ?? "");
  const isSolid = scrolled || isOpen || !overDarkHero;
  const { scrollY } = useScroll();

  // Barre cachée quand on descend (plus de place pour le contenu), visible dès qu'on remonte
  useMotionValueEvent(scrollY, "change", (y) => {
    const previous = scrollY.getPrevious() ?? 0;
    setScrolled(y > 30);
    if (y > 320 && y > previous + 6) setHidden(true);
    else if (y < previous - 6 || y <= 320) setHidden(false);
  });

  return (
    <motion.nav
      initial={false}
      animate={{ y: hidden && !isOpen ? "-110%" : "0%" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed w-full z-50 transition-[background-color,box-shadow,padding,border-color] duration-500 ${
        isSolid
          ? "bg-background/95 backdrop-blur-2xl shadow-lg border-b border-accent/10 py-0"
          : "bg-transparent py-2"
      }`}
    >
      {/* Ligne dorée supérieure (quand scrolled) */}
      {isSolid && (
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex justify-between items-center transition-[height] duration-500 ${scrolled ? "h-16" : "h-20"}`}>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group" onClick={() => setIsOpen(false)}>
            <div className={`relative transition-all duration-500 group-hover:scale-105 ${scrolled ? "w-10 h-10 sm:w-12 sm:h-12" : "w-12 h-12 sm:w-14 sm:h-14"}`}>
              <Image
                src="/images/logo.png"
                alt="Logo Miss & Mister JMFC"
                fill
                className="object-contain"
                sizes="56px"
                priority
              />
            </div>
            <div className="hidden sm:block">
              <span className="font-serif text-lg font-bold text-accent leading-none">Miss & Mister</span>
              <br />
              <span className={`font-serif text-xl font-bold leading-none transition-colors duration-300 ${isSolid ? "text-foreground" : "text-white"}`}>
                JMFC
              </span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`relative px-4 py-2 text-sm font-medium transition-colors duration-300 group ${
                  isSolid ? "text-foreground/75 hover:text-accent" : "text-white/85 hover:text-accent drop-shadow-md"
                }`}
              >
                {label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-accent group-hover:w-4/5 transition-all duration-300" />
              </Link>
            ))}

            <MagneticButton className="ml-4">
              <Link
                data-cursor="Voter"
                href="/participants"
                className="relative inline-flex items-center px-6 py-2.5 rounded-full font-bold text-sm tracking-wide overflow-hidden group shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-shadow duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#BF953F] via-[#D4AF37] to-[#AA771C] transition-opacity duration-300" />
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 text-primary">Votez !</span>
              </Link>
            </MagneticButton>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`lg:hidden p-2 rounded-xl transition-all duration-300 ${
              isSolid
                ? "text-foreground hover:text-accent hover:bg-accent/10"
                : "text-white hover:text-accent drop-shadow-md"
            }`}
            aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden bg-background/98 backdrop-blur-2xl border-t border-accent/10 absolute w-full top-full left-0 shadow-2xl">
          {/* Ligne déco */}
          <div className="h-[1px] bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
          <div className="px-4 pt-4 pb-8 flex flex-col gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="px-4 py-3.5 text-base font-medium rounded-xl hover:bg-accent/8 hover:text-accent transition-all duration-200 border border-transparent hover:border-accent/20"
                onClick={() => setIsOpen(false)}
              >
                {label}
              </Link>
            ))}

            <div className="pt-4">
              <Link
                href="/participants"
                className="relative block w-full text-center px-5 py-4 rounded-full font-bold overflow-hidden transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                onClick={() => setIsOpen(false)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#BF953F] via-[#D4AF37] to-[#AA771C]" />
                <span className="relative z-10 text-primary">Voter Maintenant</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </motion.nav>
  );
}
