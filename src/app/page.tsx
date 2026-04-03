import { TransitionLink as Link } from "@/components/TransitionLink";
import { ArrowRight, Trophy, Sparkles, CheckCircle2 } from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem, TiltCard, MagneticButton, TextReveal, ParallaxHeroImage } from "@/components/AnimatedSection";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import CountdownTimer from "@/components/CountdownTimer";

export const dynamic = "force-dynamic";

export default async function Home() {
  const event = await prisma.votingEvent.findFirst({
    orderBy: { createdAt: "desc" },
  });

  const participants = event
    ? await prisma.participant.findMany({
        where: { eventId: event.id },
        orderBy: { totalVotes: "desc" },
        take: 4, // Top 4 candidates for the homepage
      })
    : [];
  return (
    <>
      <div className="flex flex-col flex-1 items-center bg-background w-full">
        
        {/* HERO SECTION - PARALLAX & TEXT REVEAL */}
        <section className="w-full min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
          
          <ParallaxHeroImage 
            src="/images/fashionable-man-woman-posing.png" 
            alt="Miss et Mister JMFC" 
            imageClassName="object-cover object-center md:object-top opacity-60 w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#0F172A]/70 to-[#0F172A]/40 z-10"></div>
          
          <div className="max-w-5xl mx-auto text-center space-y-6 md:space-y-8 z-40 px-6 pt-32 pb-20 md:pb-32 relative">
            <FadeIn delay={0.1} direction="down" className="flex justify-center mb-6">
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-48 md:h-48 drop-shadow-2xl">
                <Image src="/images/logo.png" alt="Logo de l&apos;événement" fill className="object-contain" priority />
              </div>
            </FadeIn>
            
            <FadeIn delay={0.2} direction="down">
              <span className="inline-flex items-center space-x-1 sm:space-x-2 py-1.5 px-3 sm:px-4 rounded-full border border-accent/70 bg-black/40 backdrop-blur-md text-accent text-xs sm:text-sm font-bold tracking-[0.1em] sm:tracking-[0.2em] uppercase mb-4 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                <Sparkles size={14} className="hidden sm:block" />
                <span>Grande Finale • JMFC 2026</span>
                <Sparkles size={14} className="hidden sm:block" />
              </span>
            </FadeIn>
            
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-serif font-bold tracking-tight text-white leading-tight drop-shadow-2xl">
              <TextReveal text="Célébrons l&apos;Élégance, la Foi et la Culture" delay={0.4} />
            </h1>
            
            <FadeIn delay={1.4} direction="up">
              <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed drop-shadow-lg font-medium">
                Soutenez vos favoris pour faire briller la jeunesse de la Paroisse de Tchonvi lors de cette compétition prestigieuse.
              </p>
            </FadeIn>
            
            <FadeIn delay={1.6} direction="up" className="pt-8 flex justify-center">
              <Link href="/participants">
                <MagneticButton className="px-10 py-5 rounded-full bg-accent text-primary transition-all shadow-[0_0_30px_rgba(212,175,55,0.4)] font-bold text-lg flex items-center justify-center space-x-2 relative group overflow-hidden">
                  <div className="absolute inset-0 bg-white w-0 group-hover:w-full transition-all duration-500 ease-out z-0"></div>
                  <span className="relative z-10 group-hover:text-primary transition-colors duration-300">Voter maintenant</span>
                  <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform group-hover:text-primary" />
                </MagneticButton>
              </Link>
            </FadeIn>
          </div>
          
          <div className="absolute bottom-0 w-full overflow-hidden leading-none z-20 transform translate-y-[1px]">
            <svg className="relative block w-full h-[50px] md:h-[100px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118,130.85,132.89,203.4,129.47,243.6,127.56,283.47,120.64,321.39,56.44Z" className="fill-background"></path>
            </svg>
          </div>
        </section>

        {/* COMPTE À REBOURS */}
        <section className="w-full pb-20 pt-10 bg-background relative z-30 -mt-10">
          <div className="max-w-4xl mx-auto px-6">
            <FadeIn delay={0.3} direction="up">
              <div className="bg-white dark:bg-[#111] border-2 border-accent/20 rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col items-center text-center hover:border-accent/50 shadow-accent/10 transition-colors duration-700">
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
                    Votes du {new Date(event.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} au {new Date(event.endDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
              </div>
            </FadeIn>
          </div>
        </section>

        {/* NOTRE MISSION SECTION */}
        <section className="w-full py-24 bg-primary text-white overflow-hidden relative">
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center z-10 relative">
            <FadeIn direction="right" className="space-y-6">
              <h2 className="text-sm font-bold tracking-widest uppercase text-accent mb-2 flex items-center"><span className="w-8 h-[1px] bg-accent mr-3"></span> Notre Mission</h2>
              <div className="text-4xl md:text-5xl font-serif font-bold mb-6 leading-tight">
                <TextReveal text="Valoriser la beauté chrétienne et nos talents." />
              </div>
              <p className="text-white/80 text-lg leading-relaxed pt-2">
                Le concours Miss & Mister JMFC n&apos;est pas qu&apos;une aventure esthétique. C&apos;est une mission pastorale et culturelle 
                qui vise à inculquer aux jeunes des valeurs essentielles : le respect de soi, la discipline, la rigueur et le dynamisme.
              </p>
              <StaggerContainer className="space-y-4 pt-4" delayOrder={0.2}>
                {[
                  "Rapprocher les familles de l&apos;Église Catholique.",
                  "Mettre en lumière l&apos;héritage culturel Béninois.",
                  "Introduire les jeunes paroissiens dans le monde de l&apos;excellence."
                ].map((txt, i) => (
                  <StaggerItem key={i}>
                    <li className="flex items-center space-x-3 text-white/90 bg-white/5 p-4 rounded-xl hover:bg-white/10 transition-colors border border-white/5 hover:border-accent/30 hover:shadow-[0_0_15px_rgba(212,175,55,0.1)] duration-500">
                      <CheckCircle2 className="text-accent flex-shrink-0" size={24} />
                      <span className="font-medium">{txt}</span>
                    </li>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </FadeIn>
            
            <FadeIn direction="left" delay={0.4} className="relative aspect-square rounded-3xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-white/10 group">
              <div className="absolute inset-0 bg-accent/20 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
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

        {/* TOP CANDIDATS TEASER - 3D TILT CARDS */}
        <section className="w-full py-32 bg-background">
          <div className="max-w-7xl mx-auto px-6">
            <FadeIn direction="up">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-6">
                <div className="max-w-2xl">
                  <h2 className="text-sm font-bold tracking-[0.3em] uppercase text-accent mb-2 flex items-center"><span className="w-8 h-[1px] bg-accent mr-3"></span> Compétition</h2>
                  <h3 className="text-5xl md:text-6xl font-serif font-bold text-primary dark:text-white pt-2">Découvrez nos Candidats</h3>
                </div>
                <Link href="/participants">
                  <MagneticButton className="inline-flex items-center space-x-3 text-primary dark:text-white font-bold group px-8 py-4 border border-black/10 dark:border-white/10 rounded-full hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all shadow-sm">
                    <span>Explorer le catalogue</span>
                    <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                  </MagneticButton>
                </Link>
              </div>
            </FadeIn>

            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8" delayOrder={0.2}>
              {participants.map((candidate, i) => (
                <StaggerItem key={candidate.id}>
                  <TiltCard>
                    <div className="group flex flex-col bg-white dark:bg-black rounded-3xl overflow-hidden border border-black/5 dark:border-white/10 shadow-lg hover:shadow-2xl hover:border-accent/40 transition-all duration-300">
                      <div className="relative aspect-[4/5] overflow-hidden bg-black/5">
                        {candidate.imageUrl ? (
                          <Image 
                            src={candidate.imageUrl} 
                            alt={candidate.name} 
                            fill 
                            sizes="(max-width: 768px) 100vw, 25vw"
                            className="object-cover group-hover:scale-110 transition-transform duration-[1s] ease-out" 
                            unoptimized={candidate.imageUrl.includes("dicebear")}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary/30 text-7xl font-serif font-bold">
                            {candidate.name.charAt(0)}
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary via-primary/80 to-transparent p-6 translate-y-[20%] opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-out">
                          <Link href={`/participants/${candidate.id}`} className="text-white text-md font-bold flex items-center justify-between border-b border-accent/30 pb-2 hover:border-accent transition-colors">
                            <span>Voter pour ce profil</span>
                            <ArrowRight size={18} className="text-accent" />
                          </Link>
                        </div>
                      </div>
                      <div className="p-6 relative bg-white dark:bg-black z-20">
                        <p className="text-xs font-bold uppercase text-accent mb-2 tracking-[0.2em]">Candidat N°{String(candidate.number).padStart(2, "0")}</p>
                        <h4 className="text-2xl font-serif font-bold text-primary dark:text-white mb-2 truncate group-hover:text-accent transition-colors">{candidate.name}</h4>
                        <div className="text-sm font-medium flex items-center space-x-2 text-foreground/60">
                          <Trophy size={16} className="text-accent" />
                          <span>{candidate.totalVotes.toLocaleString()} Votes</span>
                        </div>
                      </div>
                    </div>
                  </TiltCard>
                </StaggerItem>
              ))}
              {participants.length === 0 && (
                 <div className="col-span-full text-center py-12 text-foreground/60">
                   <p>Aucun candidat enregistré pour le moment.</p>
                 </div>
              )}
            </StaggerContainer>
          </div>
        </section>

        {/* COMMENT VOTER - WORKFLOW */}
        <section id="comment-voter" className="w-full py-32 bg-primary/5 dark:bg-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <FadeIn direction="up">
              <div className="text-center mb-24">
                <h2 className="text-sm font-bold tracking-[0.3em] uppercase text-accent mb-3 flex justify-center items-center"><span className="w-12 h-[2px] bg-accent mr-4"></span> Expérience Utilisateur <span className="w-12 h-[2px] bg-accent ml-4"></span></h2>
                <h3 className="text-5xl md:text-6xl font-serif font-bold text-primary dark:text-white">Comment ça marche ?</h3>
              </div>
            </FadeIn>
            
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16" delayOrder={0.3}>
              <StaggerItem>
                <TiltCard className="h-full">
                  <div className="flex flex-col items-center text-center p-10 bg-white/5 rounded-3xl border border-black/5 dark:border-white/5 hover:border-accent/40 shadow-xl transition-colors h-full">
                    <div className="w-24 h-24 mb-8 rounded-full bg-black/5 dark:bg-white/5 border-2 border-accent/20 flex items-center justify-center text-accent shadow-inner text-4xl font-serif">
                      1
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold font-serif text-primary dark:text-white mb-4">La Sélection</h4>
                      <p className="text-foreground/70 leading-relaxed text-lg">Parcourez le catalogue immersif et laissez-vous séduire par l&apos;éloquence de votre candidat favori.</p>
                    </div>
                  </div>
                </TiltCard>
              </StaggerItem>

              <StaggerItem>
                <TiltCard className="h-full">
                  <div className="flex flex-col items-center text-center p-10 bg-white/5 rounded-3xl border border-black/5 dark:border-white/5 hover:border-accent/40 shadow-xl transition-colors h-full">
                    <div className="w-24 h-24 mb-8 rounded-full bg-black/5 dark:bg-white/5 border-2 border-accent/20 flex items-center justify-center text-accent shadow-inner text-4xl font-serif">
                      2
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold font-serif text-primary dark:text-white mb-4">L&apos;Identité</h4>
                      <p className="text-foreground/70 leading-relaxed text-lg">Déclinez votre identité en toute transparence ou optez pour l&apos;anonymat garanti par notre algorithme.</p>
                    </div>
                  </div>
                </TiltCard>
              </StaggerItem>

              <StaggerItem>
                <TiltCard className="h-full">
                  <div className="flex flex-col items-center text-center p-10 bg-white/5 rounded-3xl border border-black/5 dark:border-white/5 hover:border-accent/40 shadow-xl transition-colors h-full">
                    <div className="w-24 h-24 mb-8 rounded-full bg-black/5 dark:bg-white/5 border-2 border-accent/20 flex items-center justify-center text-accent shadow-inner text-4xl font-serif">
                      3
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold font-serif text-primary dark:text-white mb-4">Le Sortilège</h4>
                      <p className="text-foreground/70 leading-relaxed text-lg">Scellez votre vote en un clic grâce à l&apos;intégration fluide de Mobile Money, 100% sécurisée.</p>
                    </div>
                  </div>
                </TiltCard>
              </StaggerItem>
            </StaggerContainer>
          </div>
        </section>



      </div>
    </>
  );
}
