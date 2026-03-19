"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Crown } from "lucide-react";

export default function PageLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);

  // Déclencher le loader cinématique à chaque changement d'URL
  useEffect(() => {
    setLoading(true);
    // Masquer le loader après 1.2s de cinématique
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 1200);
    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

  return (
    <AnimatePresence mode="wait">
      {loading && (
        <motion.div
          key="loader"
          initial={{ y: "100%", borderTopLeftRadius: "50%", borderTopRightRadius: "50%" }}
          animate={{ y: "0%", borderTopLeftRadius: "0%", borderTopRightRadius: "0%" }}
          exit={{ y: "-100%", borderBottomLeftRadius: "50%", borderBottomRightRadius: "50%" }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }} 
          className="fixed inset-0 z-[99999] bg-[#020617] flex flex-col items-center justify-center text-white"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, rotate: -180 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ delay: 0.2, duration: 0.8, type: "spring", bounce: 0.5 }}
            className="flex flex-col items-center"
          >
            <Crown className="text-accent mb-6 drop-shadow-[0_0_15px_rgba(212,175,55,0.8)]" size={80} />
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="text-4xl md:text-5xl font-serif font-bold text-accent tracking-[0.3em] uppercase"
            >
              JMFC
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
               className="text-white/50 tracking-[0.5em] text-xs uppercase mt-4"
            >
              Édition 2026
            </motion.p>
          </motion.div>
          
          <motion.div className="absolute bottom-20 w-48 h-[2px] bg-white/10 overflow-hidden rounded-full">
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
              className="w-full h-full bg-gradient-to-r from-transparent via-accent to-transparent"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
