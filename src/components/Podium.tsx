"use client";

// Podium animé à l'arrivée à l'écran :
// les marches montent dans l'ordre 3e → 2e → 1er, la médaille du premier tombe avec un rebond,
// et les votes comptent jusqu'à leur valeur.

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { TransitionLink as Link } from "@/components/TransitionLink";
import RankBadge from "@/components/RankBadge";
import { CountUp } from "@/components/AnimatedSection";

export interface PodiumCandidate {
  id: string;
  name: string;
  number: number;
  imageUrl: string | null;
  totalVotes: number;
}

interface PodiumProps {
  title: string;
  /** Candidats triés par votes décroissants ; seuls les 3 premiers sont affichés. */
  candidates: PodiumCandidate[];
}

const EASE = [0.16, 1, 0.3, 1] as const;
// Ordre d'apparition : 3e, puis 2e, puis 1er
const STEP_DELAY: Record<number, number> = { 3: 0, 2: 0.25, 1: 0.5 };

export default function Podium({ title, candidates }: PodiumProps) {
  const top = candidates.slice(0, 3);
  const ref = useRef<HTMLOListElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });

  return (
    <div className="w-full">
      <h3 className="text-center text-2xl md:text-3xl font-serif font-bold text-primary dark:text-white mb-10">
        {title}
      </h3>

      {top.length === 0 ? (
        <p className="text-center text-foreground/50">Aucun candidat pour le moment.</p>
      ) : (
        <ol ref={ref} className="grid grid-cols-3 items-end gap-3 sm:gap-5 max-w-xl mx-auto">
          {top.map((candidate, index) => {
            const rank = index + 1;
            const isFirst = rank === 1;
            const delay = STEP_DELAY[rank];

            return (
              <li
                key={candidate.id}
                // Ordre du DOM = 1, 2, 3 (lecteurs d'écran) ; ordre visuel = 2e, 1er, 3e
                className={`flex flex-col items-center text-center ${isFirst ? "order-2" : rank === 2 ? "order-1" : "order-3"}`}
              >
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={inView ? { opacity: 1, y: 0 } : undefined}
                  transition={{ duration: 0.8, delay: delay + 0.15, ease: EASE }}
                  className="w-full"
                >
                  <Link href={`/participants/${candidate.id}`} data-cursor="Voir" className="group w-full flex flex-col items-center">
                    <div
                      className={`relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-primary/10 shadow-lg transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-2xl ${
                        isFirst ? "ring-2 ring-accent shadow-accent/20 podium-shine" : "ring-1 ring-black/5 dark:ring-white/10"
                      }`}
                    >
                      {candidate.imageUrl ? (
                        <Image
                          src={candidate.imageUrl}
                          alt={candidate.name}
                          fill
                          sizes="(max-width: 640px) 33vw, 200px"
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          unoptimized={candidate.imageUrl.includes("dicebear")}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary/30 text-5xl font-serif font-bold">
                          {candidate.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Médaille : celle du premier tombe avec un rebond */}
                    <motion.div
                      initial={isFirst ? { opacity: 0, y: -60, rotate: -20 } : { opacity: 0, scale: 0.5 }}
                      animate={inView ? { opacity: 1, y: 0, rotate: 0, scale: 1 } : undefined}
                      transition={
                        isFirst
                          ? { type: "spring", stiffness: 260, damping: 12, delay: delay + 0.55 }
                          : { duration: 0.5, delay: delay + 0.45, ease: EASE }
                      }
                      className="-mt-6 relative z-10"
                    >
                      <RankBadge rank={rank} size={isFirst ? 44 : 36} />
                    </motion.div>

                    <p className={`mt-2 font-serif font-bold leading-tight text-primary dark:text-white ${isFirst ? "text-base sm:text-lg" : "text-sm sm:text-base"}`}>
                      {candidate.name.trim()}
                    </p>
                    <p className="text-xs text-foreground/50">N°{String(candidate.number).padStart(2, "0")}</p>
                    <p className={`mt-1 font-bold ${isFirst ? "text-accent text-lg" : "text-foreground/80"}`}>
                      <CountUp value={candidate.totalVotes} />
                      <span className="text-xs font-medium text-foreground/50"> votes</span>
                    </p>
                  </Link>
                </motion.div>

                {/* Marche du podium : monte depuis le sol */}
                <motion.div
                  aria-hidden
                  initial={{ scaleY: 0 }}
                  animate={inView ? { scaleY: 1 } : undefined}
                  transition={{ duration: 0.7, delay, ease: EASE }}
                  className={`mt-3 w-full origin-bottom rounded-t-xl bg-gradient-to-b ${
                    isFirst
                      ? "h-16 sm:h-20 from-accent/40 to-accent/10"
                      : rank === 2
                        ? "h-10 sm:h-14 from-slate-300/50 to-slate-300/10"
                        : "h-6 sm:h-10 from-amber-700/30 to-amber-700/5"
                  }`}
                />
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
