"use client";

// Contenu du pied de page lié au défilement : il remonte et s'éclaire à mesure que la page
// se soulève pour le dévoiler, et repart en arrière si on remonte.
// Calcul à partir de la distance au bas du document : fiable même quand le pied de page est « sticky ».

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useMotionValueEvent, useScroll, useTransform } from "framer-motion";

export default function FooterReveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const progress = useMotionValue(0);
  const { scrollY } = useScroll();

  const update = (y: number) => {
    const height = ref.current?.offsetHeight ?? 0;
    if (!height) return;
    const remaining = document.documentElement.scrollHeight - (y + window.innerHeight);
    progress.set(Math.min(1, Math.max(0, 1 - remaining / height)));
  };

  useMotionValueEvent(scrollY, "change", update);

  // Page courte (sans défilement) ou fenêtre redimensionnée : calcul sans attendre un défilement
  useEffect(() => {
    const onResize = () => update(window.scrollY);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const translateY = useTransform(progress, [0, 1], [-60, 0]);
  const opacity = useTransform(progress, [0, 0.7, 1], [0.2, 0.85, 1]);
  const scale = useTransform(progress, [0, 1], [0.96, 1]);

  return (
    <motion.div ref={ref} style={{ y: translateY, opacity, scale }} className={className}>
      {children}
    </motion.div>
  );
}
