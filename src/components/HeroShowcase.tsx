"use client";

// Hero de la page d'accueil : un candidat mis en avant au centre,
// le texte à gauche, le prix du vote et le choix Miss/Mister à droite.
//
// Animations :
// - entrée en cascade quand le rideau de chargement se lève ;
// - relief à la souris : photo, halo et étoiles bougent chacun selon leur profondeur ;
// - au défilement : la photo recule, le texte remonte plus vite et s'efface, le fond s'assombrit
//   (lié au défilement, donc tout revient en place quand on remonte).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Crown, Facebook, Instagram } from "lucide-react";
import { TransitionLink as Link } from "@/components/TransitionLink";
import { usePageRevealed } from "@/components/TransitionProvider";
import { MagneticButton, TextReveal } from "@/components/AnimatedSection";
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
const EASE = [0.16, 1, 0.3, 1] as const;

const SOCIALS = [
  { href: "https://www.facebook.com/profile.php?id=61572834736178", label: "Facebook JMFC", icon: Facebook },
  { href: "https://www.instagram.com/missmisterjmfc/", label: "Instagram JMFC", icon: Instagram },
];

const STARS = [
  { top: "14%", left: "8%", delay: "0s", dur: "3s" },
  { top: "24%", left: "93%", delay: "1s", dur: "4s" },
  { top: "62%", left: "4%", delay: "2s", dur: "3.5s" },
  { top: "72%", left: "90%", delay: "0.5s", dur: "5s" },
  { top: "40%", left: "30%", delay: "1.5s", dur: "4s" },
  { top: "33%", left: "70%", delay: "3s", dur: "3s" },
  { top: "84%", left: "42%", delay: "2.5s", dur: "4.5s" },
  { top: "9%", left: "56%", delay: "1s", dur: "3.5s" },
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
  const revealed = usePageRevealed();

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

  // ── Défilement : la scène s'éloigne quand on descend ──────────────────────
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const photoScale = useTransform(scrollYProgress, [0, 1], [1, 0.82]);
  const photoY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -170]);
  const sideY = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const fadeOut = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const shade = useTransform(scrollYProgress, [0, 1], [0, 0.7]);

  // ── Souris : relief en profondeur ─────────────────────────────────────────
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 60, damping: 18 });
  const smoothY = useSpring(mouseY, { stiffness: 60, damping: 18 });
  const photoMx = useTransform(smoothX, (v) => v * -18);
  const photoMy = useTransform(smoothY, (v) => v * -12);
  const haloMx = useTransform(smoothX, (v) => v * 50);
  const haloMy = useTransform(smoothY, (v) => v * 40);
  const starsMx = useTransform(smoothX, (v) => v * 90);
  const starsMy = useTransform(smoothY, (v) => v * 70);

  const onMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const onMouseLeave = () => {
    setPaused(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  // Entrée en cascade une fois le rideau levé
  const enter = (delay: number, y = 30) => ({
    initial: { opacity: 0, y },
    animate: revealed ? { opacity: 1, y: 0 } : { opacity: 0, y },
    transition: { duration: 0.9, delay, ease: EASE },
  });

  const cta = votingEnded
    ? { href: "#resultats", label: "Voir les résultats" }
    : current
      ? { href: `/participants/${current.id}`, label: votingOpen ? "Voter maintenant" : "Voir son profil" }
      : { href: "/participants", label: "Découvrir les candidats" };

  const frameClass = "relative block w-[240px] h-[320px] sm:w-[300px] sm:h-[400px] xl:w-[340px] xl:h-[460px]";
  const frame = (
    <>
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
            className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/70 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {current && (
        <span className="absolute -top-3 -right-3 z-10 w-14 h-14 rounded-full bg-accent text-primary font-serif font-bold text-xl flex items-center justify-center shadow-lg ring-4 ring-[#020617]">
          {current.number}
        </span>
      )}
    </>
  );

  return (
    <section
      ref={sectionRef}
      className="w-full min-h-screen relative overflow-hidden bg-[#020617] text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {/* Fond : dégradé nuit + halo doré derrière le candidat */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#13254A_0%,#0A1530_45%,#020617_100%)]" />
      <motion.div
        style={{ x: haloMx, y: haloMy }}
        className="absolute top-1/2 left-1/2 -ml-[260px] -mt-[260px] w-[520px] h-[520px] md:-ml-[350px] md:-mt-[350px] md:w-[700px] md:h-[700px] bg-accent/15 rounded-full blur-[140px] pointer-events-none"
      />
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }}
      />

      {/* Étoiles : la couche la plus « proche », elle bouge le plus avec la souris */}
      <motion.div style={{ x: starsMx, y: starsMy }} className="absolute inset-0 pointer-events-none" aria-hidden>
        {STARS.map((s, i) => (
          <span
            key={i}
            className="star-particle"
            style={{
              top: s.top,
              left: s.left,
              "--delay": s.delay,
              "--duration": s.dur,
              width: i % 3 === 0 ? "3px" : "2px",
              height: i % 3 === 0 ? "3px" : "2px",
            } as React.CSSProperties}
          />
        ))}
      </motion.div>

      {/* Assombrissement progressif pendant le défilement */}
      <motion.div style={{ opacity: shade }} className="absolute inset-0 bg-[#020617] pointer-events-none z-[5]" aria-hidden />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 md:pb-32 min-h-screen flex flex-col">
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-center gap-10 lg:gap-6">

          {/* ── Colonne gauche : texte ─────────────────────────────────── */}
          <motion.div style={{ y: textY, opacity: fadeOut }} className="order-2 lg:order-1 space-y-6 text-center lg:text-left">
            {total > 1 && (
              <motion.div {...enter(0.2)} className="hidden lg:flex gap-2">
                <ArrowButton label="Candidat précédent" onClick={() => go(-1)}><ChevronLeft size={18} /></ArrowButton>
                <ArrowButton label="Candidat suivant" onClick={() => go(1)}><ChevronRight size={18} /></ArrowButton>
              </motion.div>
            )}

            <motion.span
              {...enter(0.25)}
              className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full border border-accent/40 text-accent text-[11px] font-bold tracking-[0.2em] uppercase backdrop-blur-md badge-luxury"
            >
              <Crown size={12} />
              Grande Finale · JMFC{editionYear ? ` ${editionYear}` : ""}
            </motion.span>

            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-serif font-bold leading-[1.1] drop-shadow-2xl">
              <TextReveal text="Célébrons l'Élégance," play={revealed} delay={0.35} className="lg:justify-start" />
              <TextReveal text="la Foi et la Culture" play={revealed} delay={0.6} className="lg:justify-start" wordClassName="gold-text" />
            </h1>

            <motion.p {...enter(0.9)} className="text-white/70 text-sm sm:text-base leading-relaxed max-w-md mx-auto lg:mx-0">
              Soutenez vos favoris pour faire briller la jeunesse de la Paroisse de Tchonvi lors de cette compétition prestigieuse.
            </motion.p>

            <motion.div {...enter(1.05)} className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <MagneticButton>
                <Link
                  href={cta.href}
                  data-cursor={votingOpen && !votingEnded ? "Voter" : undefined}
                  className="group inline-flex items-center gap-2 pl-6 pr-5 py-3 rounded-full bg-white text-primary font-bold text-sm shadow-[0_0_30px_rgba(212,175,55,0.25)] hover:bg-accent transition-colors duration-300"
                >
                  {cta.label}
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </MagneticButton>
              {!votingEnded && (
                <Link href="/participants" className="text-sm font-semibold text-white/70 hover:text-accent transition-colors px-2 py-3">
                  Tous les candidats
                </Link>
              )}
            </motion.div>
          </motion.div>

          {/* ── Centre : candidat mis en avant ─────────────────────────── */}
          <motion.div style={{ scale: photoScale, y: photoY }} className="order-1 lg:order-2 flex flex-col items-center origin-top">
            <motion.div
              initial={{ opacity: 0, y: 80, scale: 0.9 }}
              animate={revealed ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 80, scale: 0.9 }}
              transition={{ duration: 1.1, delay: 0.15, ease: EASE }}
              className="flex flex-col items-center"
            >
              <motion.div style={{ x: photoMx, y: photoMy }}>
                {current ? (
                  <Link
                    href={`/participants/${current.id}`}
                    data-cursor="Voir"
                    aria-label={`Voir le profil de ${current.name}`}
                    className={`group ${frameClass}`}
                  >
                    {frame}
                  </Link>
                ) : (
                  <div className={frameClass}>{frame}</div>
                )}
              </motion.div>

              {/* Ombre au sol */}
              <div className="w-48 sm:w-64 h-4 mt-3 bg-black/60 rounded-[50%] blur-md" />
            </motion.div>

            {/* Flèches mobile */}
            {total > 1 && (
              <div className="flex lg:hidden gap-3 mt-4">
                <ArrowButton label="Candidat précédent" onClick={() => go(-1)}><ChevronLeft size={18} /></ArrowButton>
                <ArrowButton label="Candidat suivant" onClick={() => go(1)}><ChevronRight size={18} /></ArrowButton>
              </div>
            )}
          </motion.div>

          {/* ── Colonne droite : prix + catégorie ──────────────────────── */}
          <motion.div style={{ y: sideY, opacity: fadeOut }} className="order-3">
            <motion.div {...enter(0.7, 40)} className="flex flex-col items-center lg:items-end gap-6 text-center lg:text-right">
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
                        className="relative px-5 h-12 rounded-full text-sm font-bold border border-white/10"
                      >
                        {/* Pastille blanche qui glisse d'un bouton à l'autre */}
                        {category === cat && (
                          <motion.span
                            layoutId="hero-category-pill"
                            transition={{ type: "spring", stiffness: 400, damping: 32 }}
                            className="absolute inset-0 rounded-full bg-white shadow-lg"
                          />
                        )}
                        <span className={`relative z-10 transition-colors duration-300 ${category === cat ? "text-primary" : "text-white/80"}`}>
                          {cat === "MISS" ? "Miss" : "Mister"}
                        </span>
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
            </motion.div>
          </motion.div>
        </div>

        {/* ── Barre du bas : réseaux, nom du candidat, suivant ─────────── */}
        <motion.div style={{ opacity: fadeOut }} className="mt-10">
          <motion.div {...enter(1.2, 20)} className="grid grid-cols-[1fr_auto_1fr] items-end gap-4">
            <div className="flex gap-3">
              {SOCIALS.map(({ href, label, icon: Icon }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-white/60 hover:text-accent hover:-translate-y-0.5 transition-all"
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
                  data-cursor="Suivant"
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
          </motion.div>
        </motion.div>
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
