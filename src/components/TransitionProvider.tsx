"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Crown } from "lucide-react";

interface TransitionContextType {
  triggerTransition: (href: string) => void;
}

const TransitionContext = createContext<TransitionContextType>({ triggerTransition: () => {} });

export const useTransition = () => useContext(TransitionContext);

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Lever le rideau une fois la route changée et l'appariement fait (fin de transition Next.js)
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 500); // laisse la page s'afficher puis lève le rideau
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Rideau initial au premier load de l'application
  const [initialLoad, setInitialLoad] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setInitialLoad(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const triggerTransition = (href: string) => {
    if (pathname === href) return;
    setLoading(true);
  };

  const isVisible = loading || initialLoad;

  return (
    <TransitionContext.Provider value={{ triggerTransition }}>
      {children}
      
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }} 
            className="fixed inset-0 z-[99999] bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center text-accent"
          >
            <div className="w-12 h-12 flex items-center justify-center relative">
              <div className="absolute inset-0 border-4 border-accent/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </TransitionContext.Provider>
  );
}
