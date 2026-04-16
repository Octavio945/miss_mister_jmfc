"use client";

// Carrousel circulaire 3D horizontal — les cartes tournent en cercle
// autour d'un axe vertical, animées par CSS transform + transition.

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trophy, ChevronLeft, ChevronRight } from "lucide-react";

// Rayons de l'ellipse 3D (px, avant d'éventuelles adaptations responsive)
const RADIUS_X = 360; // rayon horizontal
const RADIUS_Z = 140; // rayon de profondeur

export interface CarouselCandidate {
  id: string;
  name: string;
  number: number;
  imageUrl: string | null;
  totalVotes: number;
  category: "MISS" | "MISTER";
}

interface Props {
  candidates: CarouselCandidate[];
  autoPlayMs?: number; // intervalle de rotation auto (défaut 3500ms)
}

export default function CircularCarousel({ candidates, autoPlayMs = 3500 }: Props) {
  const total = candidates.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const goNext = useCallback(() => setActiveIndex((i) => (i + 1) % total), [total]);
  const goPrev = useCallback(() => setActiveIndex((i) => (i - 1 + total) % total), [total]);

  // Auto-rotation — pause quand la souris est dessus
  useEffect(() => {
    if (isHovered || total <= 1) return;
    timer.current = setInterval(goNext, autoPlayMs);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [isHovered, goNext, total, autoPlayMs]);

  // ──────────────────────────────────────────────────────────────────────────
  // Calcul des transforms CSS pour chaque carte
  // ──────────────────────────────────────────────────────────────────────────
  function getTransform(index: number) {
    // offset en nombre de "positions" par rapport à la carte active
    let offset = (index - activeIndex + total) % total;
    if (offset > total / 2) offset -= total; // normalise à [-n/2, n/2]

    const angle = (offset / total) * 2 * Math.PI; // angle en radians

    const x = Math.sin(angle) * RADIUS_X;          // position X
    const z = Math.cos(angle) * RADIUS_Z;          // profondeur Z
    const rotateY = -(offset / total) * 360;       // rotation Y (degrés)

    const depth = (z + RADIUS_Z) / (2 * RADIUS_Z); // facteur 0→1 (fond→avant)
    const scale   = 0.52 + 0.48 * depth;
    const opacity = 0.25 + 0.75 * depth;
    const zIndex  = Math.round(depth * 100);
    const isActive = index === activeIndex;

    return { x, z, rotateY, scale, opacity, zIndex, isActive };
  }

  if (total === 0) {
    return (
      <p className="text-center text-foreground/60 py-16">
        Aucun candidat enregistré pour le moment.
      </p>
    );
  }

  const activeCandidate = candidates[activeIndex];

  return (
    <div
      className="relative w-full flex flex-col items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── Scène 3D ─────────────────────────────────────────────────────── */}
      <div
        aria-label="Carrousel de candidats"
        className="relative w-full"
        style={{
          height: 480,
          perspective: "1100px",
          perspectiveOrigin: "50% 45%",
          // Empêche les débordements visuels sur les bords
          overflow: "hidden",
        }}
      >
        {candidates.map((candidate, index) => {
          const { x, z, rotateY, scale, opacity, zIndex, isActive } = getTransform(index);

          return (
            <div
              key={candidate.id}
              onClick={() => !isActive && setActiveIndex(index)}
              aria-label={isActive ? `Candidat actif : ${candidate.name}` : `Voir ${candidate.name}`}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 210,
                marginLeft: -105,
                marginTop: -185,
                transform: `translateX(${x}px) translateZ(${z}px) rotateY(${rotateY}deg) scale(${scale})`,
                opacity,
                zIndex,
                // Transition CSS fluide — pas de dépendance framer-motion pour le 3D
                transition:
                  "transform 0.75s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.75s ease",
                cursor: isActive ? "default" : "pointer",
                willChange: "transform, opacity",
              }}
            >
              {/* ── Carte ───────────────────────────────────────────────── */}
              <div
                className={`rounded-2xl overflow-hidden border-2 transition-colors duration-300 shadow-2xl
                  ${isActive
                    ? "border-accent shadow-[0_20px_60px_rgba(212,175,55,0.25)]"
                    : "border-white/10 dark:border-white/5"
                  }`}
              >
                {/* Photo */}
                <div className="relative bg-[#0f172a]" style={{ aspectRatio: "3/4" }}>
                  {candidate.imageUrl ? (
                    <Image
                      src={candidate.imageUrl}
                      alt={candidate.name}
                      fill
                      sizes="210px"
                      className="object-cover"
                      unoptimized={candidate.imageUrl.includes("dicebear")}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl font-serif font-bold text-white/20 bg-primary/20">
                      {candidate.name.charAt(0)}
                    </div>
                  )}

                  {/* Dégradé bas toujours présent */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                  {/* Badge catégorie (carte active uniquement) */}
                  {isActive && (
                    <div className="absolute top-3 left-3 bg-accent text-primary text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                      {candidate.category}
                    </div>
                  )}
                </div>

                {/* Infos bas de carte */}
                <div
                  className={`px-4 py-3 transition-colors duration-300 ${
                    isActive ? "bg-primary" : "bg-black/80"
                  }`}
                >
                  <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-0.5 ${isActive ? "text-accent" : "text-white/40"}`}>
                    N°{String(candidate.number).padStart(2, "0")}
                  </p>
                  <h4 className="text-white font-serif font-bold text-base leading-tight truncate">
                    {candidate.name}
                  </h4>
                  {isActive && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-white/60 text-xs">
                      <Trophy size={11} className="text-accent flex-shrink-0" />
                      <span>{candidate.totalVotes.toLocaleString()} votes</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── CTA carte active ──────────────────────────────────────────────── */}
      <div className="relative z-20 -mt-2 mb-8 text-center space-y-1">
        <p className="text-sm text-foreground/50 font-medium">
          {activeCandidate.name}
        </p>
        <Link href={`/participants/${activeCandidate.id}`}>
          <button className="px-7 py-2.5 rounded-full bg-accent text-primary font-bold text-sm hover:bg-accent/90 active:scale-95 transition-all shadow-lg hover:shadow-accent/30 hover:-translate-y-0.5">
            Voter pour ce candidat →
          </button>
        </Link>
      </div>

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-5">
        {/* Bouton précédent */}
        <button
          onClick={goPrev}
          aria-label="Candidat précédent"
          className="w-11 h-11 rounded-full border border-black/10 dark:border-white/10 flex items-center justify-center text-foreground/60 hover:border-accent hover:text-accent hover:bg-accent/5 transition-all"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Points de navigation */}
        <div className="flex items-center gap-2">
          {candidates.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              aria-label={`Aller au candidat ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? "w-6 h-2 bg-accent"
                  : "w-2 h-2 bg-foreground/20 hover:bg-accent/50"
              }`}
            />
          ))}
        </div>

        {/* Bouton suivant */}
        <button
          onClick={goNext}
          aria-label="Candidat suivant"
          className="w-11 h-11 rounded-full border border-black/10 dark:border-white/10 flex items-center justify-center text-foreground/60 hover:border-accent hover:text-accent hover:bg-accent/5 transition-all"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
