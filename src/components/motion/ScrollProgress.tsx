"use client";

// Fin trait doré en haut de l'écran qui se remplit à mesure qu'on descend dans la page.

import { motion, useScroll, useSpring } from "framer-motion";

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed top-0 inset-x-0 h-[3px] origin-left z-[60] bg-gradient-to-r from-[#BF953F] via-[#F0D060] to-[#AA771C] shadow-[0_0_10px_rgba(212,175,55,0.6)] pointer-events-none"
    />
  );
}
