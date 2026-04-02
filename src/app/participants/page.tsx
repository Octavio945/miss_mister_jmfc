import { TransitionLink as Link } from "@/components/TransitionLink";
import Image from "next/image";
import { ArrowRight, Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import ParticipantsFilter from "@/components/ParticipantsFilter";

export const dynamic = "force-dynamic";

export default async function ParticipantsPage() {
  const event = await prisma.votingEvent.findFirst({
    where: { isActive: true },
  });

  const participants = event
    ? await prisma.participant.findMany({
        where: { eventId: event.id },
        orderBy: { totalVotes: "desc" },
      })
    : [];

  const misses = participants.filter((p) => p.category === "MISS");
  const misters = participants.filter((p) => p.category === "MISTER");

  return (
    <div className="pt-24 pb-20 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary dark:text-white mb-4">
            Candidats Officiels
          </h1>
          <p className="text-foreground/70 text-lg">
            Découvrez les visages de l&apos;édition 2026. Soutenez votre
            candidat(e) favori(e) et contribuez au rayonnement de notre
            paroisse.
          </p>
          {event && (
            <p className="mt-3 text-sm font-medium text-accent">
              {participants.length} candidat{participants.length !== 1 ? "s" : ""}{" "}
              · {participants.reduce((s, p) => s + p.totalVotes, 0).toLocaleString()} votes enregistrés
            </p>
          )}
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
