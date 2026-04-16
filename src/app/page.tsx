import { TransitionLink as Link } from "@/components/TransitionLink";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
  TiltCard,
  MagneticButton,
  TextReveal,
  ParallaxHeroImage,
} from "@/components/AnimatedSection";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import CountdownTimer from "@/components/CountdownTimer";
import CircularCarousel from "@/components/CircularCarousel";
import type { CarouselCandidate } from "@/components/CircularCarousel";

export const dynamic = "force-dynamic";

export default async function Home() {
  const event = await prisma.votingEvent.findFirst({
    orderBy: { createdAt: "desc" },
  });

  // On récupère tous les candidats pour le carrousel (max 10)
  const participants: CarouselCandidate[] = event
    ? await prisma.participant.findMany({
        where: { eventId: event.id },
        orderBy: { totalVotes: "desc" },
        take: 10,
        select: {
          id: true,
          name: true,
          number: true,
          imageUrl: true,
          totalVotes: true,
          category: true,
        },
      })
    : [];

  return (
    <div className="flex flex-col flex-1 items-center bg-background w-full">

      {/* ═══════════════════════════════════════════════════════════════════
          HERO — Parallax + Text Reveal
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="w-full min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        <ParallaxHeroImage
          src="/images/fashionable-man-woman-posing.png"
          alt="Miss et Mister JMFC"
          imageClassName="object-cover object-center md:object-top opacity-60 w-full h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#0F172A]/70 to-[#0F172A]/40 z-10" />

        <div className="max-w-5xl mx-auto text-center space-y-6 md:space-y-8 z-40 px-6 pt-32 pb-20 md:pb-32 relative">
          <FadeIn delay={0.1} direction="down" className="flex justify-center mb-6">
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-48 md:h-48 drop-shadow-2xl">
              <Image
                src="/images/logo.png"
                alt="Logo de l'événement"
                fill
                className="object-contain"
                priority
              />
            </div>
          </FadeIn>

          <FadeIn delay={0.2} direction="down">
            <span className="inline-flex items-center space-x-2 py-1.5 px-4 rounded-full border border-accent/70 bg-black/40 backdrop-blur-md text-accent text-xs sm:text-sm font-bold tracking-[0.15em] uppercase mb-4 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
              <Sparkles size={14} className="hidden sm:block" />
              <span>Grande Finale · JMFC 2026</span>
              <Sparkles size={14} className="hidden sm:block" />
            </span>
          </FadeIn>

          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-serif font-bold tracking-tight text-white leading-tight drop-shadow-2xl">
            <TextReveal text="Célébrons l'Élégance, la Foi et la Culture" delay={0.4} />
          </h1>

          <FadeIn delay={1.4} direction="up">
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed drop-shadow-lg font-medium">
              Soutenez vos favoris pour faire briller la jeunesse de la Paroisse de Tchonvi lors de cette compétition prestigieuse.
            </p>
          </FadeIn>

          <FadeIn delay={1.6} direction="up" className="pt-8 flex justify-center">
            <Link href="/participants">
              <MagneticButton className="px-10 py-5 rounded-full bg-accent text-primary transition-all shadow-[0_0_30px_rgba(212,175,55,0.4)] font-bold text-lg flex items-center justify-center space-x-2 relative group overflow-hidden">
                <div className="absolute inset-0 bg-white w-0 group-hover:w-full transition-all duration-500 ease-out z-0" />
                <span className="relative z-10 group-hover:text-primary transition-colors duration-300">
                  Voter maintenant
                </span>
                <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform group-hover:text-primary" />
              </MagneticButton>
            </Link>
          </FadeIn>
        </div>

        {/* Vague de transition */}
        <div className="absolute bottom-0 w-full overflow-hidden leading-none z-20 translate-y-[1px]">
          <svg className="relative block w-full h-[50px] md:h-[100px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118,130.85,132.89,203.4,129.47,243.6,127.56,283.47,120.64,321.39,56.44Z" className="fill-background" />
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          COMPTE À REBOURS
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="w-full pb-20 pt-10 bg-background relative z-30 -mt-10">
        <div className="max-w-4xl mx-auto px-6">
          <FadeIn delay={0.3} direction="up">
            <div className="bg-white dark:bg-[#111] border-2 border-accent/20 rounded-3xl p-8 md:p-12 shadow-2xl shadow-accent/5 flex flex-col items-center text-center hover:border-accent/50 transition-colors duration-700">
              <h2 className="text-2xl font-serif font-bold text-primary dark:text-white mb-8">
                {event ? "Clôture des votes dans :" : "Aucun événement actif"}
              </h2>
              {event ? (
                <CountdownTimer endDate={event.endDate} startDate={event.startDate} isActive={event.isActive} />
              ) : (
                <p className="text-foreground/60">Les votes ne sont pas encore ouverts.</p>
              )}
              {event && (
                <p className="mt-6 text-xs text-foreground/40">
                  Votes du{" "}
                  {new Date(event.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  {" "}au{" "}
                  {new Date(event.endDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              )}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CARROUSEL CANDIDATS — centré, animation 3D circulaire
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="w-full py-24 bg-background overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">

          {/* Titre centré */}
          <FadeIn direction="up">
            <div className="text-center mb-16 space-y-4">
              <p className="text-sm font-bold tracking-[0.3em] uppercase text-accent flex justify-center items-center gap-3">
                <span className="w-10 h-[1px] bg-accent inline-block" />
                Compétition
                <span className="w-10 h-[1px] bg-accent inline-block" />
              </p>
              <h3 className="text-5xl md:text-6xl font-serif font-bold text-primary dark:text-white">
                Nos Candidats
              </h3>
              <p className="text-foreground/60 text-lg max-w-xl mx-auto">
                Découvrez les participants et votez pour votre favori avant la clôture.
              </p>
            </div>
          </FadeIn>

          {/* Carrousel 3D */}
          <FadeIn direction="up" delay={0.2}>
            <CircularCarousel candidates={participants} />
          </FadeIn>

          {/* Lien vers tous les candidats */}
          <FadeIn direction="up" delay={0.3}>
            <div className="text-center mt-12">
              <Link href="/participants">
                <MagneticButton className="inline-flex items-center gap-3 text-primary dark:text-white font-bold group px-8 py-4 border border-black/10 dark:border-white/10 rounded-full hover:bg-primary hover:text-white dark:hover:bg-white dark:hover:text-black transition-all shadow-sm">
                  <span>Voir tous les candidats</span>
                  <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                </MagneticButton>
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          NOTRE MISSION
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="w-full py-24 bg-primary text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center relative z-10">
          <FadeIn direction="right" className="space-y-6">
            <h2 className="text-sm font-bold tracking-widest uppercase text-accent flex items-center">
              <span className="w-8 h-[1px] bg-accent mr-3" />
              Notre Mission
            </h2>
            <div className="text-4xl md:text-5xl font-serif font-bold leading-tight">
              <TextReveal text="Valoriser la beauté chrétienne et nos talents." />
            </div>
            <p className="text-white/80 text-lg leading-relaxed pt-2">
              Le concours Miss &amp; Mister JMFC n&apos;est pas qu&apos;une aventure esthétique.
              C&apos;est une mission pastorale et culturelle qui vise à inculquer aux jeunes des
              valeurs essentielles : le respect de soi, la discipline, la rigueur et le dynamisme.
            </p>
            <StaggerContainer className="space-y-4 pt-4" delayOrder={0.2}>
              {[
                "Rapprocher les familles de l'Église Catholique.",
                "Mettre en lumière l'héritage culturel Béninois.",
                "Introduire les jeunes paroissiens dans le monde de l'excellence.",
              ].map((txt, i) => (
                <StaggerItem key={i}>
                  <li className="flex items-center space-x-3 text-white/90 bg-white/5 p-4 rounded-xl hover:bg-white/10 transition-colors border border-white/5 hover:border-accent/30 hover:shadow-[0_0_15px_rgba(212,175,55,0.1)] duration-500 list-none">
                    <CheckCircle2 className="text-accent flex-shrink-0" size={22} />
                    <span className="font-medium">{txt}</span>
                  </li>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </FadeIn>

          <FadeIn direction="left" delay={0.4} className="relative aspect-square rounded-3xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-white/10 group">
            <div className="absolute inset-0 bg-accent/20 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <Image
              src="/images/outdoor-portrait-stylish-woman-black-blazer-suit-white-classic-hat.jpg"
              alt="Notre mission et nos valeurs"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover scale-100 group-hover:scale-125 transition-transform duration-[2s] ease-out origin-center"
            />
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          COMMENT VOTER — 3 étapes
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="comment-voter" className="w-full py-32 bg-primary/5 dark:bg-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <FadeIn direction="up">
            <div className="text-center mb-24">
              <h2 className="text-sm font-bold tracking-[0.3em] uppercase text-accent mb-3 flex justify-center items-center">
                <span className="w-12 h-[2px] bg-accent mr-4" />
                Expérience Utilisateur
                <span className="w-12 h-[2px] bg-accent ml-4" />
              </h2>
              <h3 className="text-5xl md:text-6xl font-serif font-bold text-primary dark:text-white">
                Comment ça marche ?
              </h3>
            </div>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16" delayOrder={0.3}>
            {[
              {
                num: "1",
                title: "La Sélection",
                desc: "Parcourez le catalogue immersif et laissez-vous séduire par l'éloquence de votre candidat favori.",
              },
              {
                num: "2",
                title: "L'Identité",
                desc: "Déclinez votre identité en toute transparence ou optez pour l'anonymat garanti par notre algorithme.",
              },
              {
                num: "3",
                title: "Le Vote",
                desc: "Scellez votre vote en un clic grâce à l'intégration fluide de Mobile Money, 100% sécurisée.",
              },
            ].map(({ num, title, desc }) => (
              <StaggerItem key={num}>
                <TiltCard className="h-full">
                  <div className="flex flex-col items-center text-center p-10 bg-white/5 rounded-3xl border border-black/5 dark:border-white/5 hover:border-accent/40 shadow-xl transition-colors h-full">
                    <div className="w-24 h-24 mb-8 rounded-full bg-black/5 dark:bg-white/5 border-2 border-accent/20 flex items-center justify-center text-accent shadow-inner text-4xl font-serif">
                      {num}
                    </div>
                    <h4 className="text-2xl font-bold font-serif text-primary dark:text-white mb-4">{title}</h4>
                    <p className="text-foreground/70 leading-relaxed text-lg">{desc}</p>
                  </div>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CTA FINAL — Bannière de clôture
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="w-full py-24 bg-primary relative overflow-hidden">
        {/* Halo dorés décoratifs */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-accent/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-accent/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <FadeIn direction="up" className="space-y-8">
            <p className="text-accent text-sm font-bold tracking-[0.3em] uppercase flex justify-center items-center gap-3">
              <span className="w-8 h-[1px] bg-accent" />
              Dernière chance
              <span className="w-8 h-[1px] bg-accent" />
            </p>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-white leading-tight">
              Chaque vote compte.<br />Faites la différence.
            </h2>
            <p className="text-white/70 text-lg leading-relaxed">
              Le résultat est entre les mains du public. Montrez votre soutien avant la clôture des votes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/participants">
                <MagneticButton className="px-10 py-4 rounded-full bg-accent text-primary font-bold text-lg flex items-center justify-center gap-2 hover:bg-accent/90 transition-all shadow-[0_0_30px_rgba(212,175,55,0.3)] group">
                  <span>Voter maintenant</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </MagneticButton>
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

    </div>
  );
}
