"use client";

import { useState } from "react";
import { TransitionLink as Link } from "@/components/TransitionLink";
import Image from "next/image";
import { ArrowRight, Trophy } from "lucide-react";
import type { Participant } from "@prisma/client";

type Tab = "all" | "miss" | "mister";

interface Props {
  all: Participant[];
  misses: Participant[];
  misters: Participant[];
}

export default function ParticipantsFilter({ all, misses, misters }: Props) {
  const [tab, setTab] = useState<Tab>("all");

  const list = tab === "miss" ? misses : tab === "mister" ? misters : all;

  const tabs: { id: Tab; label: string }[] = [
    { id: "all", label: "Tous" },
    { id: "miss", label: "Miss" },
    { id: "mister", label: "Mister" },
  ];

  return (
    <>
      {/* Filter Tabs */}
      <div className="flex justify-center space-x-4 mb-12">
        {tabs.map((t) => (
          <button
            key={t.id}
            id={`filter-${t.id}`}
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

      {list.length === 0 ? (
        <p className="text-center text-foreground/50 py-20 text-lg">
          Aucun candidat dans cette catégorie pour le moment.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {list.map((candidate) => (
            <div
              key={candidate.id}
              className="group flex flex-col bg-white dark:bg-black rounded-2xl overflow-hidden border border-black/5 dark:border-white/10 shadow-sm hover:shadow-xl transition-all duration-300"
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
                <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-primary flex items-center space-x-1 border border-white/20 shadow-sm">
                  <span>{candidate.category}</span>
                  <span className="text-accent">N°{String(candidate.number).padStart(2, "0")}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-2xl font-serif font-bold text-primary dark:text-white mb-2">
                  {candidate.name}
                </h3>

                <div className="flex items-center space-x-2 text-foreground/60 mb-6">
                  <Trophy size={16} className="text-accent" />
                  <span className="font-medium">
                    {candidate.totalVotes.toLocaleString()} votes actuels
                  </span>
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
          ))}
        </div>
      )}
    </>
  );
}
