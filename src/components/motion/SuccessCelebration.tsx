"use client";

// Célébration du paiement confirmé : médaillon doré qui apparaît avec un rebond,
// couronne qui se pose dessus et pluie de confettis dorés (une seule fois).

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Crown } from "lucide-react";

const COLORS = ["#D4AF37", "#F0D060", "#BF953F", "#FFF1C1", "#AA771C"];
const COUNT = 36;

// Pseudo-aléatoire déterministe : même rendu côté serveur et client
const rand = (seed: number) => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

export default function SuccessCelebration() {
  const reduceMotion = useReducedMotion();
  const pieces = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => {
        const angle = rand(i + 1) * Math.PI * 2;
        const spread = 120 + rand(i + 50) * 160;
        return {
          x: Math.cos(angle) * spread,
          y: Math.sin(angle) * spread * 0.6 - 60,
          fall: 220 + rand(i + 100) * 200,
          rotate: rand(i + 150) * 720 - 360,
          delay: rand(i + 200) * 0.25,
          color: COLORS[i % COLORS.length],
          size: 6 + rand(i + 250) * 6,
          round: i % 3 === 0,
        };
      }),
    []
  );

  return (
    <div className="relative w-28 h-28 mx-auto">
      {/* Confettis */}
      {!reduceMotion &&
        pieces.map((p, i) => (
          <motion.span
            key={i}
            aria-hidden
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0 }}
            animate={{
              x: [0, p.x, p.x * 1.1],
              y: [0, p.y, p.y + p.fall],
              opacity: [1, 1, 0],
              rotate: p.rotate,
              scale: 1,
            }}
            transition={{ duration: 2.4, delay: 0.35 + p.delay, ease: [0.22, 1, 0.36, 1], times: [0, 0.35, 1] }}
            className="absolute left-1/2 top-1/2 pointer-events-none"
            style={{
              width: p.size,
              height: p.round ? p.size : p.size * 0.45,
              background: p.color,
              borderRadius: p.round ? "9999px" : "2px",
              marginLeft: -p.size / 2,
              marginTop: -p.size / 2,
            }}
          />
        ))}

      {/* Halo */}
      <motion.div
        aria-hidden
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.6, 1.3], opacity: [0, 0.6, 0.35] }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="absolute inset-0 rounded-full bg-accent/40 blur-2xl"
      />

      {/* Médaillon */}
      <motion.div
        initial={{ scale: 0, rotate: -40 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 14 }}
        className="relative w-28 h-28 rounded-full bg-gradient-to-br from-[#F0D060] via-[#D4AF37] to-[#AA771C] flex items-center justify-center shadow-[0_15px_40px_rgba(212,175,55,0.45)] ring-4 ring-accent/20"
      >
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.35, type: "spring", stiffness: 300, damping: 15 }}
        >
          <Check size={52} strokeWidth={3} className="text-[#0F172A]" />
        </motion.span>
      </motion.div>

      {/* Couronne qui se pose */}
      <motion.div
        aria-hidden
        initial={{ y: -50, opacity: 0, rotate: -15 }}
        animate={{ y: 0, opacity: 1, rotate: 0 }}
        transition={{ delay: 0.55, type: "spring", stiffness: 220, damping: 11 }}
        className="absolute -top-7 left-1/2 -translate-x-1/2"
      >
        <Crown size={36} className="text-accent fill-accent/30 drop-shadow-lg" />
      </motion.div>
    </div>
  );
}
