"use client";

// Défilement fluide (molette amortie) sur tout le site public.
// Sur écran tactile, Lenis laisse le défilement natif du doigt ; il est désactivé
// si l'appareil demande moins d'animations.

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.15,
      autoRaf: true,
      // Liens d'ancre (#resultats…) : défilement fluide, en laissant la place de la barre de navigation
      anchors: { offset: -90 },
    });
    return () => lenis.destroy();
  }, []);

  return null;
}
