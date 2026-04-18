"use client";

import { useState, useMemo } from "react";
import { TransitionLink as Link } from "@/components/TransitionLink";
import Image from "next/image";
import { ArrowRight, Trophy, Hash, SortAsc } from "lucide-react";
import type { Participant } from "@prisma/client";

type Tab    = "all" | "miss" | "mister";
type SortBy = "number" | "votes";

interface Props {
  all: Participant[];
  misses: Participant[];
  misters: Participant[];
}

const MEDAL = ["🥇", "🥈", "🥉"];

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

  return (
    <>
      {/* Barre de contrôles : onglets + toggle tri */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-12">

        {/* Onglets catégorie */}
        <div className="flex space-x-3">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${
                tab === t.id
                  ? "bg-primary text-white shadow-md scale-105"
                  : "border border-black/10 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Toggle tri */}
        <div className="flex items-center bg-black/5 dark:bg-white/5 rounded-full p-1 gap-1">
          <button
            onClick={() => setSortBy("number")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              sortBy === "number"
                ? "bg-white dark:bg-[#222] shadow text-primary dark:text-white"
                : "text-foreground/50 hover:text-foreground"
            }`}
          >
            <Hash size={13} />
            Par numéro
          </button>
          <button
            onClick={() => setSortBy("votes")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              sortBy === "votes"
                ? "bg-white dark:bg-[#222] shadow text-primary dark:text-white"
                : "text-foreground/50 hover:text-foreground"
            }`}
          >
            <SortAsc size={13} />
            Classement votes
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="text-center text-foreground/50 py-20 text-lg">
          Aucun candidat dans cette catégorie pour le moment.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {list.map((candidate) => {
            const rank   = rankByVotes.get(candidate.id) ?? 0;
            const medal  = MEDAL[rank - 1] ?? null;
            const isTop3 = rank <= 3;

            return (
              <div
                key={candidate.id}
                className={`group flex flex-col bg-white dark:bg-black rounded-2xl overflow-hidden border shadow-sm hover:shadow-xl transition-all duration-300 ${
                  sortBy === "votes" && isTop3
                    ? "border-accent/40 dark:border-accent/30"
                    : "border-black/5 dark:border-white/10"
                }`}
              >
                {/* Image */}
                <div className="relative aspect-[4/5] overflow-hidden bg-black/5 dark:bg-white/5">
                  {candidate.imageUrl ? (
                    <Image
                      src={candidate.imageUrl}
                      alt={candidate.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      unoptimized={candidate.imageUrl.includes("dicebear")}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary/30 text-7xl font-serif font-bold">
                      {candidate.name.charAt(0)}
                    </div>
                  )}

                  {/* Badge numéro officiel */}
                  <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-primary flex items-center space-x-1 border border-white/20 shadow-sm">
                    <span>{candidate.category}</span>
                    <span className="text-accent">N°{String(candidate.number).padStart(2, "0")}</span>
                  </div>

                  {/* Badge rang votes (toujours visible) */}
                  {sortBy === "votes" && (
                    <div className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shadow-lg ${
                      rank === 1 ? "bg-yellow-400 text-yellow-900"
                      : rank === 2 ? "bg-gray-300 text-gray-800"
                      : rank === 3 ? "bg-amber-600 text-white"
                      : "bg-black/60 text-white text-sm"
                    }`}>
                      {medal ?? `#${rank}`}
                    </div>
                  )}
                </div>

                {/* Contenu */}
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-2xl font-serif font-bold text-primary dark:text-white mb-2">
                    {candidate.name}
                  </h3>

                  <div className="flex items-center space-x-2 text-foreground/60 mb-6">
                    <Trophy size={16} className="text-accent" />
                    <span className="font-medium">
                      {candidate.totalVotes.toLocaleString()} votes
                    </span>
                    {sortBy === "number" && rank <= 3 && (
                      <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-bold">
                        {medal} Top {rank}
                      </span>
                    )}
                  </div>

                  <div className="mt-auto">
                    <Link
                      href={`/participants/${candidate.id}`}
                      className="flex items-center justify-between w-full px-5 py-3 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors group/btn"
                    >
                      <span className="font-medium">
                        Voter {candidate.name.split(" ")[0]}
                      </span>
                      <ArrowRight
                        size={18}
                        className="group-hover/btn:translate-x-1 transition-transform"
                      />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
