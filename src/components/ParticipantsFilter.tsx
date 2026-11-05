"use client";

import { useState, useMemo, useRef } from "react";
import { TransitionLink as Link } from "@/components/TransitionLink";
import Image from "next/image";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Trophy, Hash, SortAsc } from "lucide-react";
import type { Participant } from "@prisma/client";
import RankBadge from "@/components/RankBadge";
import { useRevealInView } from "@/components/AnimatedSection";

type Tab    = "all" | "miss" | "mister";
type SortBy = "number" | "votes";

interface Props {
  all: Participant[];
  misses: Participant[];
  misters: Participant[];
}

const EASE = [0.16, 1, 0.3, 1] as const;
const PILL_SPRING = { type: "spring", stiffness: 400, damping: 34 } as const;

export default function ParticipantsFilter({ all, misses, misters }: Props) {
  const [tab,    setTab]    = useState<Tab>("all");
  const [sortBy, setSortBy] = useState<SortBy>("number");

  const base = tab === "miss" ? misses : tab === "mister" ? misters : all;

  // Tri côté client — "number" = ordre officiel, "votes" = classement live
  const list = useMemo(() => {
    if (sortBy === "votes") {
      return [...base].sort((a, b) => b.totalVotes - a.totalVotes);
    }
    return [...base].sort((a, b) => a.number - b.number);
  }, [base, sortBy]);

  // Rang global par votes (pour afficher la position même en tri par numéro)
  const rankByVotes = useMemo(() => {
    const sorted = [...base].sort((a, b) => b.totalVotes - a.totalVotes);
    const map = new Map<string, number>();
    sorted.forEach((p, i) => map.set(p.id, i + 1));
    return map;
  }, [base]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "all",    label: "Tous"   },
    { id: "miss",   label: "Miss"   },
    { id: "mister", label: "Mister" },
  ];

  const sorts: { id: SortBy; label: string; icon: typeof Hash }[] = [
    { id: "number", label: "Par numéro", icon: Hash },
    { id: "votes", label: "Classement votes", icon: SortAsc },
  ];

  return (
    <>
      {/* Barre de contrôles : onglets + toggle tri */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-12">

        {/* Onglets catégorie : la pastille glisse d'un onglet à l'autre */}
        <div className="flex gap-2 p-1 rounded-full border border-black/10 dark:border-white/15">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-pressed={tab === t.id}
              className="relative px-6 py-2 rounded-full font-medium"
            >
              {tab === t.id && (
                <motion.span layoutId="participants-tab" transition={PILL_SPRING} className="absolute inset-0 rounded-full bg-primary shadow-md" />
              )}
              <span className={`relative z-10 transition-colors duration-300 ${tab === t.id ? "text-white" : "text-foreground/70 hover:text-foreground"}`}>
                {t.label}
              </span>
            </button>
          ))}
        </div>

        {/* Toggle tri */}
        <div className="flex items-center bg-black/5 dark:bg-white/5 rounded-full p-1 gap-1">
          {sorts.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSortBy(id)}
              aria-pressed={sortBy === id}
              className="relative flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium"
            >
              {sortBy === id && (
                <motion.span layoutId="participants-sort" transition={PILL_SPRING} className="absolute inset-0 rounded-full bg-white dark:bg-[#222] shadow" />
              )}
              <span className={`relative z-10 flex items-center gap-1.5 transition-colors ${sortBy === id ? "text-primary dark:text-white" : "text-foreground/50 hover:text-foreground"}`}>
                <Icon size={13} />
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <p className="text-center text-foreground/50 py-20 text-lg">
          Aucun candidat dans cette catégorie pour le moment.
        </p>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout" initial={false}>
            {list.map((candidate, index) => (
              <CardSlot key={candidate.id} index={index}>
                <CandidateCard
                  candidate={candidate}
                  rank={rankByVotes.get(candidate.id) ?? 0}
                  sortBy={sortBy}
                />
              </CardSlot>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </>
  );
}

/**
 * Emplacement d'une carte : apparition en vague (colonne par colonne) à l'arrivée à l'écran,
 * glissement vers sa nouvelle place quand le filtre ou le tri change.
 */
function CardSlot({ index, children }: { index: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useRevealInView(ref);
  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 50, scale: 0.96 }}
      animate={visible ? { opacity: 1, y: 0, scale: 1 } : undefined}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.25 } }}
      transition={{ duration: 0.7, delay: (index % 3) * 0.1, ease: EASE, layout: { duration: 0.5, ease: EASE } }}
    >
      {children}
    </motion.div>
  );
}

/** Carte qui s'incline vers la souris, avec un reflet doré qui suit le curseur. */
function CandidateCard({ candidate, rank, sortBy }: { candidate: Participant; rank: number; sortBy: SortBy }) {
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(py, [0, 1], [6, -6]), { stiffness: 220, damping: 20 });
  const rotateY = useSpring(useTransform(px, [0, 1], [-6, 6]), { stiffness: 220, damping: 20 });
  const sheen = useTransform(
    [px, py],
    ([x, y]: number[]) => `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(240,208,96,0.22), transparent 55%)`
  );
  const isTop3 = rank <= 3;

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const rect = ref.current!.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  };
  const onLeave = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      className={`group relative h-full flex flex-col bg-white dark:bg-black rounded-2xl overflow-hidden border shadow-sm hover:shadow-2xl transition-shadow duration-500 ${
        sortBy === "votes" && isTop3
          ? "border-accent/40 dark:border-accent/30"
          : "border-black/5 dark:border-white/10"
      }`}
    >
      {/* Reflet doré qui suit la souris */}
      <motion.div
        aria-hidden
        style={{ background: sheen }}
        className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
      />

      {/* Image */}
      <Link
        href={`/participants/${candidate.id}`}
        data-cursor="Voir"
        aria-label={`Voir le profil de ${candidate.name}`}
        className="relative block aspect-[4/5] overflow-hidden bg-black/5 dark:bg-white/5"
      >
        {candidate.imageUrl ? (
          <Image
            src={candidate.imageUrl}
            alt={candidate.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            unoptimized={candidate.imageUrl.includes("dicebear")}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary/30 text-7xl font-serif font-bold">
            {candidate.name.charAt(0)}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Badge numéro officiel */}
        <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-primary flex items-center space-x-1 border border-white/20 shadow-sm">
          <span>{candidate.category}</span>
          <span className="text-accent">N°{String(candidate.number).padStart(2, "0")}</span>
        </div>

        {/* Médaille de rang (tri par votes) */}
        <AnimatePresence>
          {sortBy === "votes" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.4, rotate: -30 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.4 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="absolute top-3 right-3"
            >
              <RankBadge rank={rank} size={40} />
            </motion.div>
          )}
        </AnimatePresence>
      </Link>

      {/* Contenu */}
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-2xl font-serif font-bold text-primary dark:text-white mb-2">
          {candidate.name}
        </h3>

        <div className="flex items-center space-x-2 text-foreground/60 mb-6">
          <Trophy size={16} className="text-accent" />
          <span className="font-medium">
            {candidate.totalVotes.toLocaleString("fr-FR")} votes
          </span>
          {sortBy === "number" && rank <= 3 && (
            <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-bold">
              Top {rank}
            </span>
          )}
        </div>

        <div className="mt-auto">
          <Link
            href={`/participants/${candidate.id}`}
            data-cursor="Voter"
            className="relative overflow-hidden flex items-center justify-between w-full px-5 py-3 rounded-xl bg-primary text-white transition-colors group/btn"
          >
            {/* Remplissage doré au survol */}
            <span aria-hidden className="absolute inset-0 bg-gradient-to-r from-[#BF953F] via-[#D4AF37] to-[#AA771C] -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-500 ease-out" />
            <span className="relative font-medium group-hover/btn:text-primary transition-colors duration-300">
              Voter {candidate.name.split(" ")[0]}
            </span>
            <ArrowRight
              size={18}
              className="relative group-hover/btn:translate-x-1 group-hover/btn:text-primary transition-all duration-300"
            />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
