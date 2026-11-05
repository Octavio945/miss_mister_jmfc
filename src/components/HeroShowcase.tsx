"use client";

// Hero de la page d'accueil : un candidat mis en avant au centre,
// le texte à gauche, le prix du vote et le choix Miss/Mister à droite.

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Crown, Facebook, Instagram } from "lucide-react";
import { TransitionLink as Link } from "@/components/TransitionLink";
import type { CarouselCandidate } from "@/components/CircularCarousel";

type Category = "MISS" | "MISTER";

interface Props {
  candidates: CarouselCandidate[];
  votePrice: number | null;
  editionYear: string | null;
  votingOpen: boolean;
  votingEnded: boolean;
  autoPlayMs?: number;
}

const FALLBACK_IMAGE = "/images/fashionable-man-woman-posing.png";

const SOCIALS = [
  { href: "https://www.facebook.com/profile.php?id=61572834736178", label: "Facebook JMFC", icon: Facebook },
  { href: "https://www.instagram.com/missmisterjmfc/", label: "Instagram JMFC", icon: Instagram },
];

export default function HeroShowcase({ candidates, votePrice, editionYear, votingOpen, votingEnded, autoPlayMs = 6000 }: Props) {
  const byCategory = useMemo(() => {
    const sortByNumber = (a: CarouselCandidate, b: CarouselCandidate) => a.number - b.number;
    return {
      MISS: candidates.filter((c) => c.category === "MISS").sort(sortByNumber),
      MISTER: candidates.filter((c) => c.category === "MISTER").sort(sortByNumber),
    };
  }, [candidates]);

  const [category, setCategory] = useState<Category>(byCategory.MISS.length > 0 ? "MISS" : "MISTER");
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);

  const list = byCategory[category];
  const total = list.length;
  const current = total > 0 ? list[index % total] : null;
  const next = total > 1 ? list[(index + 1) % total] : null;

  const go = useCallback(
    (step: number) => {
      if (total <= 1) return;
      setDirection(step);
      setIndex((i) => (i + step + total) % total);
    },
    [total]
  );

  const selectCategory = (cat: Category) => {
    if (cat === category) return;
    setDirection(1);
    setCategory(cat);
    setIndex(0);
  };

  // Défilement automatique, en pause au survol
  useEffect(() => {
    if (paused || total <= 1) return;
    const timer = setInterval(() => go(1), autoPlayMs);
    return () => clearInterval(timer);
  }, [paused, total, go, autoPlayMs]);

  const cta = votingEnded
    ? { href: "#resultats", label: "Voir les résultats" }
    : current
      ? { href: `/participants/${current.id}`, label: votingOpen ? "Voter maintenant" : "Voir son profil" }
      : { href: "/participants", label: "Découvrir les candidats" };

  return (
    <section
      className="w-full min-h-screen relative overflow-hidden bg-[#020617] text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Fond : dégradé nuit + halo doré derrière le candidat */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#13254A_0%,#0A1530_45%,#020617_100%)]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] md:w-[700px] md:h-[700px] bg-accent/15 rounded-full blur-[140px] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 md:pb-32 min-h-screen flex flex-col">
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-center gap-10 lg:gap-6">

          {/* ── Colonne gauche : texte ─────────────────────────────────── */}
          <div className="order-2 lg:order-1 space-y-6 text-center lg:text-left">
            {total > 1 && (
              <div className="hidden lg:flex gap-2">
                <ArrowButton label="Candidat précédent" onClick={() => go(-1)}><ChevronLeft size={18} /></ArrowButton>
                <ArrowButton label="Candidat suivant" onClick={() => go(1)}><ChevronRight size={18} /></ArrowButton>
              </div>
            )}

            <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full border border-accent/40 text-accent text-[11px] font-bold tracking-[0.2em] uppercase backdrop-blur-md">
              <Crown size={12} />
              Grande Finale · JMFC{editionYear ? ` ${editionYear}` : ""}
            </span>

            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-serif font-bold leading-[1.1] drop-shadow-2xl">
              Célébrons l&apos;Élégance,
              <span className="block gold-text">la Foi et la Culture</span>
            </h1>

            <p className="text-white/70 text-sm sm:text-base leading-relaxed max-w-md mx-auto lg:mx-0">
              Soutenez vos favoris pour faire briller la jeunesse de la Paroisse de Tchonvi lors de cette compétition prestigieuse.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <Link
                href={cta.href}
                className="group inline-flex items-center gap-2 pl-6 pr-5 py-3 rounded-full bg-white text-primary font-bold text-sm shadow-[0_0_30px_rgba(212,175,55,0.25)] hover:bg-accent transition-colors duration-300"
              >
                {cta.label}
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              {!votingEnded && (
                <Link href="/participants" className="text-sm font-semibold text-white/70 hover:text-accent transition-colors px-2 py-3">
                  Tous les candidats
                </Link>
              )}
            </div>
          </div>

          {/* ── Centre : candidat mis en avant ─────────────────────────── */}
          <div className="order-1 lg:order-2 flex flex-col items-center">
            <div className="relative w-[240px] h-[320px] sm:w-[300px] sm:h-[400px] xl:w-[340px] xl:h-[460px]">
              <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                <motion.div
                  key={current?.id ?? "fallback"}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 60, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: direction * -60, scale: 0.95 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 rounded-t-full rounded-b-[2rem] overflow-hidden border border-accent/40 shadow-[0_30px_80px_-20px_rgba(212,175,55,0.45)]"
                >
                  <Image
                    src={current?.imageUrl || FALLBACK_IMAGE}
                    alt={current ? current.name : "Miss et Mister JMFC"}
                    fill
                    priority
                    sizes="(min-width: 1280px) 340px, (min-width: 640px) 300px, 240px"
                    className="object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/70 via-transparent to-transparent" />
                </motion.div>
              </AnimatePresence>

              {current && (
                <span className="absolute -top-3 -right-3 z-10 w-14 h-14 rounded-full bg-accent text-primary font-serif font-bold text-xl flex items-center justify-center shadow-lg ring-4 ring-[#020617]">
                  {current.number}
                </span>
              )}
            </div>

            {/* Ombre au sol */}
            <div className="w-48 sm:w-64 h-4 mt-3 bg-black/60 rounded-[50%] blur-md" />

            {/* Flèches mobile */}
            {total > 1 && (
              <div className="flex lg:hidden gap-3 mt-4">
                <ArrowButton label="Candidat précédent" onClick={() => go(-1)}><ChevronLeft size={18} /></ArrowButton>
                <ArrowButton label="Candidat suivant" onClick={() => go(1)}><ChevronRight size={18} /></ArrowButton>
              </div>
            )}
          </div>

          {/* ── Colonne droite : prix + catégorie ──────────────────────── */}
          <div className="order-3 flex flex-col items-center lg:items-end gap-6 text-center lg:text-right">
            {votePrice !== null && (
              <div>
                <p className="text-4xl sm:text-5xl font-serif font-bold tabular-nums">
                  {votePrice.toLocaleString("fr-FR")}
                  <span className="text-lg sm:text-xl font-sans font-medium text-white/60 ml-2">FCFA</span>
                </p>
                <p className="text-white/50 text-sm mt-1">par vote · Mobile Money</p>
              </div>
            )}

            {byCategory.MISS.length > 0 && byCategory.MISTER.length > 0 && (
              <div className="space-y-3">
                <p className="text-white/70 text-sm">Choisissez la catégorie :</p>
                <div className="flex gap-2 justify-center lg:justify-end" role="group" aria-label="Catégorie">
                  {(["MISS", "MISTER"] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => selectCategory(cat)}
                      aria-pressed={category === cat}
                      className={`px-5 h-12 rounded-full text-sm font-bold transition-all duration-300 ${
                        category === cat
                          ? "bg-white text-primary shadow-lg"
                          : "bg-white/10 text-white/80 hover:bg-white/20 border border-white/10"
                      }`}
                    >
                      {cat === "MISS" ? "Miss" : "Mister"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {current && (
              <p className="text-white/50 text-xs tabular-nums">
                {String((index % total) + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
              </p>
            )}
          </div>
        </div>

        {/* ── Barre du bas : réseaux, nom du candidat, suivant ─────────── */}
        <div className="mt-10 grid grid-cols-[1fr_auto_1fr] items-end gap-4">
          <div className="flex gap-3">
            {SOCIALS.map(({ href, label, icon: Icon }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-white/60 hover:text-accent transition-colors"
              >
                <Icon size={18} />
              </a>
            ))}
          </div>

          <div className="text-center min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={current?.id ?? "tagline"}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                {current ? (
                  <>
                    <p className="font-serif text-lg sm:text-xl font-bold truncate">{current.name}</p>
                    <p className="text-accent text-xs tracking-[0.2em] uppercase">
                      {current.category === "MISS" ? "Miss" : "Mister"} N° {current.number}
                    </p>
                  </>
                ) : (
                  <p className="font-serif text-lg">L&apos;élégance, la foi et la culture</p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-end">
            {next && (
              <button
                type="button"
                onClick={() => go(1)}
                aria-label={`Voir ${next.name}`}
                className="group relative w-16 h-20 sm:w-20 sm:h-24 rounded-2xl overflow-hidden border border-white/15 hover:border-accent transition-colors"
              >
                <Image
                  src={next.imageUrl || FALLBACK_IMAGE}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover object-top opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Vague de transition vers la suite de la page */}
      <div className="absolute bottom-0 w-full overflow-hidden leading-none z-0 translate-y-[1px] pointer-events-none">
        <svg className="relative block w-full h-[50px] md:h-[80px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118,130.85,132.89,203.4,129.47,243.6,127.56,283.47,120.64,321.39,56.44Z" className="fill-background" />
        </svg>
      </div>
    </section>
  );
}

function ArrowButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/80 hover:bg-accent hover:text-primary hover:border-accent transition-all duration-300"
    >
      {children}
    </button>
  );
}
