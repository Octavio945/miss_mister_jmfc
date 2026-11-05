import { TransitionLink as Link } from "@/components/TransitionLink";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
  TiltCard,
  MagneticButton,
  TextReveal,
} from "@/components/AnimatedSection";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getCurrentEvent, getEditionYear } from "@/lib/event";
import CountdownTimer from "@/components/CountdownTimer";
import Podium from "@/components/Podium";
import HeroShowcase from "@/components/HeroShowcase";
import CircularCarousel from "@/components/CircularCarousel";
import type { CarouselCandidate } from "@/components/CircularCarousel";

export const dynamic = "force-dynamic";

export default async function Home() {
  const event = await getCurrentEvent();

  const ranked: CarouselCandidate[] = event
    ? await prisma.participant.findMany({
        where: { eventId: event.id },
        orderBy: { totalVotes: "desc" },
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
  const participants = ranked.slice(0, 10);
  const topMiss = ranked.filter((p) => p.category === "MISS");
  const topMister = ranked.filter((p) => p.category === "MISTER");

  const now = new Date();
  const votingOpen = !!event && event.isActive && now >= event.startDate && now <= event.endDate;
  const votingEnded = !!event && now > event.endDate;

  return (
    <div className="flex flex-col flex-1 items-center bg-background w-full">

      {/* ═══════════════════════════════════════════════════════════════════
          HERO — candidat mis en avant
      ═══════════════════════════════════════════════════════════════════ */}
      <HeroShowcase
        candidates={ranked}
        votePrice={event?.votePrice ?? null}
        editionYear={event ? String(getEditionYear(event)) : null}
        votingOpen={votingOpen}
        votingEnded={votingEnded}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          COMPTE À REBOURS — carte luxe
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="w-full pb-24 pt-20 bg-background relative z-30">
        <div className="max-w-4xl mx-auto px-6">
          <FadeIn delay={0.2} direction="up">
            {/* Ornement supérieur */}
            <div className="flex justify-center mb-8">
              <div className="ornament-line text-accent/60 text-xs font-bold tracking-[0.3em] uppercase">
                Compte à rebours
              </div>
            </div>
            <div className="relative rounded-3xl overflow-hidden glow-pulse border border-accent/20">
              {/* Fond glassmorphism */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent/5" />
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

              <div className="relative p-8 md:p-12 flex flex-col items-center text-center">
                {event ? (
                  <CountdownTimer
                    endDate={event.endDate}
                    startDate={event.startDate}
                    isActive={event.isActive}
                    resultsHref="#resultats"
                  />
                ) : (
                  <>
                    <h2 className="text-2xl font-serif font-bold text-primary dark:text-white mb-4">Prochaine édition</h2>
                    <p className="text-foreground/60">Les votes ne sont pas encore ouverts. Revenez bientôt !</p>
                  </>
                )}
                {event && (
                  <p className="mt-6 text-xs text-foreground/40 tracking-wide">
                    Votes du{" "}
                    {new Date(event.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    {" "}au{" "}
                    {new Date(event.endDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CLASSEMENT — Podiums Miss & Mister
      ═══════════════════════════════════════════════════════════════════ */}
      {event && ranked.length > 0 && (
        <section id="resultats" className="w-full py-24 bg-background scroll-mt-24 relative overflow-hidden">
          {/* Halo de fond */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/4 rounded-full blur-[150px] pointer-events-none" />

          <div className="max-w-6xl mx-auto px-6 relative z-10">
            <FadeIn direction="up">
              <div className="text-center mb-16 space-y-5">
                <div className="ornament-line text-accent text-xs font-bold tracking-[0.3em] uppercase">
                  {votingEnded ? "Résultats officiels" : "En direct"}
                </div>
                <h2 className="text-4xl md:text-6xl font-serif font-bold text-primary dark:text-white">
                  {votingEnded ? (
                    <span className="gold-text">Classement final</span>
                  ) : (
                    "Le classement"
                  )}
                </h2>
                <p className="text-foreground/60 max-w-xl mx-auto text-lg">
                  {votingEnded
                    ? "Merci pour votre mobilisation. Voici les candidats les plus soutenus par le public."
                    : "Les votes validés sont ajoutés au classement au fur et à mesure."}
                </p>
              </div>
            </FadeIn>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-10">
              <FadeIn direction="up" delay={0.1}>
                <Podium title="Miss" candidates={topMiss} />
              </FadeIn>
              <FadeIn direction="up" delay={0.2}>
                <Podium title="Mister" candidates={topMister} />
              </FadeIn>
            </div>

            <div className="text-center mt-14">
              <Link
                href="/participants"
                className="inline-flex items-center gap-2 font-semibold text-accent hover:text-accent/80 transition-colors group"
              >
                <span className="border-b border-accent/40 group-hover:border-accent transition-colors">Voir le classement complet</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          CANDIDATS — Carrousel 3D
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="w-full py-28 bg-background overflow-hidden relative">
        {/* Ligne déco haut */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent/20 to-transparent" />

        <div className="max-w-6xl mx-auto px-6">
          <FadeIn direction="up">
            <div className="text-center mb-16 space-y-5">
              <div className="ornament-line text-accent text-xs font-bold tracking-[0.3em] uppercase">
                Compétition
              </div>
              <h2 className="text-5xl md:text-6xl font-serif font-bold text-primary dark:text-white">
                Nos Candidats
              </h2>
              <p className="text-foreground/60 text-lg max-w-xl mx-auto leading-relaxed">
                {votingOpen
                  ? "Découvrez les candidats et votez pour votre favori(e) avant la clôture."
                  : "Découvrez les candidates et candidats de cette édition."}
              </p>
            </div>
          </FadeIn>

          <FadeIn direction="up" delay={0.2}>
            <CircularCarousel candidates={participants} />
          </FadeIn>

          <FadeIn direction="up" delay={0.3}>
            <div className="text-center mt-14">
              <Link href="/participants">
                <MagneticButton className="group relative inline-flex items-center gap-3 px-10 py-4 rounded-full border border-accent/30 overflow-hidden font-bold transition-all shadow-sm hover:shadow-[0_0_30px_rgba(212,175,55,0.2)]">
                  <div className="absolute inset-0 bg-accent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <span className="relative z-10 text-primary dark:text-white group-hover:text-primary transition-colors duration-300">Voir tous les candidats</span>
                  <ArrowRight size={18} className="relative z-10 text-primary dark:text-white group-hover:text-primary group-hover:translate-x-2 transition-all duration-300" />
                </MagneticButton>
              </Link>
            </div>
          </FadeIn>
        </div>

        {/* Ligne déco bas */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          NOTRE MISSION
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="w-full py-28 bg-primary text-white overflow-hidden relative">
        {/* Pattern déco */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-20 items-center relative z-10">
          <FadeIn direction="right" className="space-y-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-10 h-[1px] bg-accent" />
                <span className="text-accent text-xs font-bold tracking-[0.3em] uppercase">Notre Mission</span>
              </div>
              <div className="text-4xl md:text-5xl font-serif font-bold leading-tight">
                <TextReveal text="Valoriser la beauté chrétienne et nos talents." />
              </div>
            </div>

            <p className="text-white/75 text-lg leading-relaxed">
              Le concours Miss & Mister JMFC n&apos;est pas qu&apos;une aventure esthétique.
              C&apos;est une mission pastorale et culturelle qui vise à inculquer aux jeunes des
              valeurs essentielles : le respect de soi, la discipline, la rigueur et le dynamisme.
            </p>

            <StaggerContainer className="space-y-3 pt-2" delayOrder={0.2}>
              {[
                "Rapprocher les familles de l'Église Catholique.",
                "Mettre en lumière l'héritage culturel Béninois.",
                "Introduire les jeunes paroissiens dans le monde de l'excellence.",
              ].map((txt, i) => (
                <StaggerItem key={i}>
                  <li className="flex items-center gap-4 text-white/90 bg-white/5 p-4 rounded-2xl hover:bg-white/10 transition-all duration-500 border border-white/5 hover:border-accent/30 hover:shadow-[0_0_20px_rgba(212,175,55,0.08)] list-none group">
                    <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/25 transition-colors">
                      <CheckCircle2 className="text-accent" size={16} />
                    </div>
                    <span className="font-medium">{txt}</span>
                  </li>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </FadeIn>

          <FadeIn direction="left" delay={0.4} className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.6)] border border-white/10 group">
            {/* Overlay dégradé */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent z-10" />
            <div className="absolute inset-0 bg-accent/0 group-hover:bg-accent/10 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            {/* Cadre doré */}
            <div className="absolute inset-0 border-2 border-accent/0 group-hover:border-accent/20 transition-colors duration-700 z-20 rounded-3xl" />
            <Image
              src="/images/outdoor-portrait-stylish-woman-black-blazer-suit-white-classic-hat.jpg"
              alt="Notre mission et nos valeurs"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover scale-100 group-hover:scale-110 transition-transform duration-[2.5s] ease-out origin-center"
            />
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          COMMENT VOTER — 3 étapes
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="comment-voter" className="w-full py-32 bg-background relative overflow-hidden">
        {/* Halos de fond */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/6 rounded-full blur-[150px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/4 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <FadeIn direction="up">
            <div className="text-center mb-24 space-y-5">
              <div className="ornament-line text-accent text-xs font-bold tracking-[0.3em] uppercase">
                Mode d&apos;emploi
              </div>
              <h2 className="text-5xl md:text-6xl font-serif font-bold text-primary dark:text-white">
                Voter en{" "}
                <span className="gold-text">3 étapes</span>
              </h2>
            </div>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8" delayOrder={0.25}>
            {[
              {
                num: "01",
                title: "Choisissez",
                desc: "Parcourez les candidats et ouvrez la fiche de votre favori(e).",
                icon: "👁️",
              },
              {
                num: "02",
                title: "Indiquez vos votes",
                desc: "Choisissez le nombre de votes et votre réseau, MTN ou Celtis. Vous pouvez voter de façon anonyme.",
                icon: "✋",
              },
              {
                num: "03",
                title: "Payez par Mobile Money",
                desc: "Envoyez le montant indiqué avec votre référence, puis confirmez sur WhatsApp. Vos votes sont ajoutés dès la validation.",
                icon: "💳",
              },
            ].map(({ num, title, desc }, index) => (
              <StaggerItem key={num}>
                <TiltCard className="h-full">
                  <div className="luxury-card flex flex-col items-center text-center p-10 rounded-3xl h-full relative overflow-hidden group">
                    {/* Numéro décoratif en fond */}
                    <span className="absolute -top-4 -right-2 text-8xl font-serif font-bold text-accent/5 select-none pointer-events-none">
                      {num}
                    </span>

                    {/* Cercle numéro */}
                    <div className="relative w-20 h-20 mb-8 rounded-full flex items-center justify-center border-2 border-accent/30 bg-gradient-to-br from-accent/10 to-accent/5 shadow-[0_0_30px_rgba(212,175,55,0.15)] group-hover:shadow-[0_0_40px_rgba(212,175,55,0.3)] transition-shadow duration-500">
                      <span className="text-3xl font-serif font-bold text-accent">{num}</span>
                    </div>

                    <h4 className="text-2xl font-bold font-serif text-primary dark:text-white mb-4">{title}</h4>
                    <p className="text-foreground/65 leading-relaxed">{desc}</p>

                    {/* Connecteur entre les cartes (visible sur desktop) */}
                    {index < 2 && (
                      <div className="hidden md:block absolute top-1/2 -right-4 z-10 transform -translate-y-1/2">
                        <div className="w-8 h-[1px] bg-accent/30" />
                      </div>
                    )}
                  </div>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CTA FINAL — Bannière luxe
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="w-full py-28 bg-primary relative overflow-hidden">
        {/* Halos dorés */}
        <div className="absolute -top-32 -left-32 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />
        {/* Ligne décorative supérieure */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

        {/* Pattern de fond */}
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />

        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <FadeIn direction="up" className="space-y-8">
            <div className="ornament-line text-accent text-xs font-bold tracking-[0.3em] uppercase">
              {votingEnded ? "Merci" : "Votes ouverts"}
            </div>

            <h2 className="text-4xl md:text-6xl font-serif font-bold text-white leading-tight">
              {votingEnded ? (
                <>
                  <span className="gold-text">Merci pour</span>
                  <br />votre soutien.
                </>
              ) : (
                <>
                  <span className="gold-text">Chaque vote</span>
                  <br />compte.
                </>
              )}
            </h2>

            <p className="text-white/65 text-lg leading-relaxed max-w-xl mx-auto">
              {votingEnded
                ? "Le concours est terminé. Retrouvez le classement final et les portraits de tous les candidats."
                : "Le résultat est entre les mains du public. Montrez votre soutien avant la clôture des votes."}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/participants">
                <MagneticButton className="group relative px-12 py-5 rounded-full font-bold text-lg flex items-center justify-center gap-3 overflow-hidden shadow-[0_0_40px_rgba(212,175,55,0.3)]">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#BF953F] via-[#D4AF37] to-[#AA771C]" />
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <span className="relative z-10 text-primary transition-colors duration-300">
                    {votingEnded ? "Voir les candidats" : "Voter maintenant"}
                  </span>
                  <ArrowRight size={20} className="relative z-10 text-primary group-hover:translate-x-1 transition-transform duration-300" />
                </MagneticButton>
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

    </div>
  );
}
