import { prisma } from "@/lib/prisma";
import { getCurrentEvent, getEditionYear } from "@/lib/event";
import ParticipantsFilter from "@/components/ParticipantsFilter";
import { CountUp, DrawLine, FadeIn, TextReveal } from "@/components/AnimatedSection";

export const dynamic = "force-dynamic";

export default async function ParticipantsPage() {
  const event = await getCurrentEvent();

  // Toujours récupérer par numéro — le tri par votes se fait côté client
  const participants = event
    ? await prisma.participant.findMany({
        where: { eventId: event.id },
        orderBy: { number: "asc" },
      })
    : [];

  const misses = participants.filter((p) => p.category === "MISS");
  const misters = participants.filter((p) => p.category === "MISTER");

  return (
    <div className="pt-24 pb-20 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary dark:text-white mb-4">
            <TextReveal text="Candidats Officiels" />
          </h1>
          <DrawLine className="w-32 mx-auto mb-6" delay={0.4} />
          <FadeIn delay={0.3}>
          <p className="text-foreground/70 text-lg">
            Découvrez les visages de l&apos;édition{event ? ` ${getEditionYear(event)}` : ""}. Soutenez votre
            candidat(e) favori(e) et contribuez au rayonnement de notre
            paroisse.
          </p>
          {event && (
            <p className="mt-3 text-sm font-medium text-accent">
              <CountUp value={participants.length} /> candidat{participants.length !== 1 ? "s" : ""}{" "}
              · <CountUp value={participants.reduce((s, p) => s + p.totalVotes, 0)} /> votes enregistrés
            </p>
          )}
          </FadeIn>
        </div>

        {/* Client component for tab filtering */}
        <ParticipantsFilter
          all={participants}
          misses={misses}
          misters={misters}
        />

      </div>
    </div>
  );
}
