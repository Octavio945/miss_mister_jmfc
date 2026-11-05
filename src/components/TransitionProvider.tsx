"use client";

import React, { createContext, useContext, useState, useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";

interface TransitionContextType {
  triggerTransition: (href: string) => void;
  /** true quand le rideau est levé : les animations d'entrée peuvent démarrer */
  revealed: boolean;
}

const TransitionContext = createContext<TransitionContextType>({ triggerTransition: () => {}, revealed: true });

export const useTransition = () => useContext(TransitionContext);
export const usePageRevealed = () => useContext(TransitionContext).revealed;

// Courbe d'accélération du rideau (départ et arrivée doux)
const CURTAIN_EASE = [0.76, 0, 0.24, 1] as const;

/**
 * Inner component to handle route changes and update loading state.
 * This needs to be wrapped in Suspense because it uses useSearchParams.
 */
function TransitionHandler({
  loading,
  setLoading
}: {
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams, loading, setLoading]);

  return null;
}

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  // Rideau initial au premier load de l'application
  const [initialLoad, setInitialLoad] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setInitialLoad(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const triggerTransition = (href: string) => {
    if (pathname === href) return;
    setLoading(true);
  };

  // Pas de rideau dans l'espace admin
  const isAdmin = pathname?.startsWith("/admin");
  const isVisible = !isAdmin && (loading || initialLoad);

  return (
    // reducedMotion="user" : si l'appareil demande moins d'animations, framer-motion
    // supprime les déplacements et ne garde que les fondus
    <MotionConfig reducedMotion="user">
      <TransitionContext.Provider value={{ triggerTransition, revealed: !isVisible }}>
        <Suspense fallback={null}>
          <TransitionHandler loading={loading} setLoading={setLoading} />
        </Suspense>

        {children}

        {/* initial={false} : au premier affichage le rideau est déjà fermé, il ne fait que se lever */}
        <AnimatePresence initial={false}>
          {isVisible && (
            <motion.div
              key="curtain"
              role="status"
              aria-label="Chargement"
              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              exit={{ y: "-100%" }}
              transition={{ duration: 0.65, ease: CURTAIN_EASE }}
              className="fixed inset-0 z-[99999] bg-[#020617] flex flex-col items-center justify-center"
            >
              {/* Liserés dorés */}
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent" />
              <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-accent/15 rounded-full blur-[100px]" />

              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
                className="relative flex flex-col items-center gap-5"
              >
                <div className="relative w-24 h-24 sm:w-28 sm:h-28">
                  <Image src="/images/logo.png" alt="" fill sizes="112px" className="object-contain drop-shadow-2xl" priority />
                </div>
                <p className="font-serif text-accent text-sm tracking-[0.35em] uppercase">Miss &amp; Mister JMFC</p>
                {/* Trait de progression */}
                <div className="w-40 h-[2px] bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                    className="h-full origin-left bg-gradient-to-r from-[#BF953F] via-[#F0D060] to-[#AA771C]"
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </TransitionContext.Provider>
    </MotionConfig>
  );
}
