"use client";

import { TransitionLink as Link } from "@/components/TransitionLink";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import Image from "next/image";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isSolid = scrolled || isOpen;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${isSolid ? 'bg-background/95 backdrop-blur-xl shadow-sm border-b border-black/5 dark:border-white/10 py-0' : 'bg-transparent py-2'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center space-x-3" onClick={() => setIsOpen(false)}>
              <Image 
                src="/images/logo.png" 
                alt="Logo Miss & Mister JMFC" 
                width={60} 
                height={60} 
                className="object-contain" 
                style={{ height: "auto" }}
                priority 
              />
              <div className="font-serif text-2xl font-bold text-accent drop-shadow-sm hidden sm:block">
                Miss & Mister <span className={isSolid ? "text-foreground" : "text-white"}>JMFC</span>
              </div>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-6">
            <Link href="/" className={`text-sm font-medium hover:text-accent transition-colors ${isSolid ? 'text-foreground/80' : 'text-white/90 drop-shadow-md'}`}>
              Accueil
            </Link>
            <Link href="/participants" className={`text-sm font-medium hover:text-accent transition-colors ${isSolid ? 'text-foreground/80' : 'text-white/90 drop-shadow-md'}`}>
              Candidats
            </Link>
            <Link href="/a-propos" className={`text-sm font-medium hover:text-accent transition-colors ${isSolid ? 'text-foreground/80' : 'text-white/90 drop-shadow-md'}`}>
              À Propos
            </Link>

            <div className="pl-4">
              <Link href="/participants" className="px-5 py-2.5 rounded-full bg-accent text-primary hover:bg-white hover:text-primary transition-all shadow-lg font-bold text-sm tracking-wide">
                Votez !
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`transition-colors ${isSolid ? 'text-foreground hover:text-accent' : 'text-white hover:text-accent drop-shadow-md'}`}
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden bg-background border-b border-black/5 dark:border-white/10 shadow-2xl absolute w-full top-full left-0">
          <div className="px-4 pt-4 pb-8 flex flex-col space-y-4">
            <Link href="/" className="px-3 py-3 text-base font-medium rounded-lg hover:bg-black/5 dark:hover:bg-white/5 hover:text-accent" onClick={() => setIsOpen(false)}>
              Accueil
            </Link>
            <Link href="/participants" className="px-3 py-3 text-base font-medium rounded-lg hover:bg-black/5 dark:hover:bg-white/5 hover:text-accent" onClick={() => setIsOpen(false)}>
              Candidats
            </Link>
            <Link href="/a-propos" className="px-3 py-3 text-base font-medium rounded-lg hover:bg-black/5 dark:hover:bg-white/5 hover:text-accent" onClick={() => setIsOpen(false)}>
              À Propos
            </Link>

            <div className="pt-6">
              <Link href="/participants" className="block w-full text-center px-5 py-4 rounded-full bg-accent text-primary font-bold transition-colors shadow-lg text-lg" onClick={() => setIsOpen(false)}>
                Voter Maintenant
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
