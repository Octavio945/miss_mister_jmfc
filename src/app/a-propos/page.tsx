import { CheckCircle2, Crown, Users, Heart } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CountUp, DrawLine, FadeIn, StaggerContainer, StaggerItem, TextReveal } from "@/components/AnimatedSection";

export const dynamic = "force-dynamic";

const OBJECTIVES = [
  "Valoriser la foi catholique en promouvant ses valeurs auprès des jeunes et des familles.",
  "Rapprocher les familles de l’Église.",
  "Développer les talents artistiques et culturels.",
  "Introduire les jeunes dans le monde de la beauté et de la culture béninoise.",
  "Inculquer des valeurs essentielles : respect de soi, discipline, rigueur et dynamisme.",
];

export default async function AboutPage() {
  // Chiffres clés, toutes éditions confondues
  const [editions, candidates, votes] = await Promise.all([
    prisma.votingEvent.count(),
    prisma.participant.count(),
    prisma.participant.aggregate({ _sum: { totalVotes: true } }),
  ]);
  const stats = [
    { icon: Crown, value: editions, label: editions > 1 ? "Éditions" : "Édition" },
    { icon: Users, value: candidates, label: "Candidats" },
    { icon: Heart, value: votes._sum.totalVotes ?? 0, label: "Votes du public" },
  ];

  return (
    <div className="pt-32 pb-20 bg-background min-h-screen flex flex-col items-center">
      <div className="max-w-4xl w-full mx-auto px-6 space-y-12">
        <div className="text-center">
          <FadeIn direction="down">
            <span className="inline-block py-1 px-3 rounded-full bg-accent/10 text-accent font-medium text-sm tracking-wider uppercase mb-4">
              Genèse et Objectifs
            </span>
          </FadeIn>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary dark:text-white">
            <TextReveal text="À Propos du Projet" delay={0.1} />
          </h1>
          <DrawLine className="w-32 mx-auto mt-6" delay={0.5} />
        </div>

        {/* Chiffres clés */}
        <StaggerContainer className="grid grid-cols-3 gap-3 sm:gap-6" delayOrder={0.15}>
          {stats.map(({ icon: Icon, value, label }) => (
            <StaggerItem key={label}>
              <div className="luxury-card rounded-3xl p-4 sm:p-6 text-center h-full">
                <Icon className="mx-auto text-accent mb-3" size={24} />
                <p className="text-2xl sm:text-4xl font-serif font-bold text-primary dark:text-white">
                  <CountUp value={value} />
                </p>
                <p className="text-[11px] sm:text-sm text-foreground/60 uppercase tracking-wider mt-1">{label}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <div className="bg-white dark:bg-black/50 p-8 md:p-12 rounded-3xl shadow-sm border border-black/5 dark:border-white/10 text-lg text-foreground/80 leading-relaxed space-y-6">
          <FadeIn>
            <p>
              Ce projet est né à l’initiative de <strong>Hervé AKOTONOU</strong>, Mister Fair Play JEPET ENSET 2025 et Responsable de l’événement Miss & Mister ENSET 2026.
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p>
              En observant les conditions de préparation des jeunes ainsi que leurs prestations lors du défilé de la nuit du 31 décembre 2025, nous avons été profondément impressionnés par leur détermination et leur éloquence.
              C’est ainsi que nous avons décidé de créer une plateforme permettant d’introduire ces jeunes dans le monde de la beauté et de la culture, tout en intégrant une forte dimension spirituelle.
            </p>
          </FadeIn>
          <FadeIn>
            <h2 className="text-2xl font-serif font-bold text-primary dark:text-white pt-6 border-t border-black/5 dark:border-white/10">
              Objectifs Principaux
            </h2>
          </FadeIn>
          <StaggerContainer className="space-y-3" delayOrder={0.12}>
            {OBJECTIVES.map((objective) => (
              <StaggerItem key={objective}>
                <p className="flex items-start gap-3">
                  <CheckCircle2 className="text-accent shrink-0 mt-1" size={20} />
                  <span>{objective}</span>
                </p>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </div>
    </div>
  );
}
