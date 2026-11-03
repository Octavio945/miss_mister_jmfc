import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, Images, Crown } from "lucide-react";
import { TransitionLink as Link } from "@/components/TransitionLink";
import { FadeIn } from "@/components/AnimatedSection";
import { prisma } from "@/lib/prisma";
import { getEditionYear, getPastEvents } from "@/lib/event";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Historique — Miss & Mister JMFC",
  description: "Les éditions passées du concours Miss & Mister JMFC : gagnants, candidats et photos.",
};

const formatDay = (date: Date) =>
  date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export default async function HistoriquePage() {
  const past = await getPastEvents();
  const editions = past.length
    ? await prisma.votingEvent.findMany({
        where: { id: { in: past.map((e) => e.id) } },
        orderBy: { createdAt: "desc" },
        include: {
          photos: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], take: 1 },
          participants: {
            orderBy: { totalVotes: "desc" },
            select: { id: true, name: true, category: true, imageUrl: true, totalVotes: true },
          },
          _count: { select: { photos: true } },
        },
      })
    : [];

  return (
    <div className="pt-24 pb-20 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-bold tracking-[0.3em] uppercase text-accent flex justify-center items-center gap-3 mb-4">
            <span className="w-10 h-[1px] bg-accent inline-block" />
            Notre histoire
            <span className="w-10 h-[1px] bg-accent inline-block" />
          </p>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary dark:text-white mb-4">
            Les éditions passées
          </h1>
          <p className="text-foreground/70 text-lg">
            Revivez chaque édition du concours : ses lauréats, ses candidats et ses plus beaux moments.
          </p>
        </div>

        {editions.length === 0 ? (
          <p className="text-center text-foreground/50 py-16">
            La première édition est en cours. Son histoire apparaîtra ici à la fin des votes.
          </p>
        ) : (
          <div className="space-y-10">
            {editions.map((edition, index) => {
              const miss = edition.participants.find((p) => p.category === "MISS");
              const mister = edition.participants.find((p) => p.category === "MISTER");
              const cover = edition.photos[0]?.imageUrl ?? miss?.imageUrl ?? mister?.imageUrl ?? null;
              const totalVotes = edition.participants.reduce((sum, p) => sum + p.totalVotes, 0);

              return (
                <FadeIn key={edition.id} direction="up" delay={Math.min(index, 3) * 0.1}>
                  <Link
                    href={`/historique/${edition.id}`}
                    className="group grid md:grid-cols-5 bg-white dark:bg-[#111] rounded-3xl overflow-hidden border border-black/5 dark:border-white/10 shadow-sm hover:shadow-xl transition-shadow"
                  >
                    <div className="relative md:col-span-2 aspect-[16/10] md:aspect-auto md:min-h-72 bg-primary/10">
                      {cover && (
                        <Image
                          src={cover}
                          alt={edition.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 40vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none"
                        />
                      )}
                      <span className="absolute top-4 left-4 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur text-accent font-serif font-bold text-lg">
                        {getEditionYear(edition)}
                      </span>
                    </div>

                    <div className="md:col-span-3 p-6 md:p-8 flex flex-col">
                      <h2 className="text-2xl md:text-3xl font-serif font-bold text-primary dark:text-white">
                        {edition.title}
                      </h2>
                      <p className="text-sm text-foreground/50 mt-1">
                        Votes du {formatDay(edition.startDate)} au {formatDay(edition.endDate)}
                      </p>
                      {edition.description && (
                        <p className="text-foreground/70 mt-4 line-clamp-3">{edition.description}</p>
                      )}

                      <div className="grid grid-cols-2 gap-4 mt-6">
                        {[
                          { label: "Miss", winner: miss },
                          { label: "Mister", winner: mister },
                        ].map(({ label, winner }) => (
                          <div key={label} className="flex items-center gap-3 p-3 rounded-2xl bg-accent/5 border border-accent/20">
                            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-primary/10 shrink-0">
                              {winner?.imageUrl && (
                                <Image src={winner.imageUrl} alt={winner.name} fill sizes="48px" className="object-cover" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] uppercase tracking-widest text-accent font-bold flex items-center gap-1">
                                <Crown size={11} /> {label}
                              </p>
                              <p className="font-serif font-bold text-sm text-primary dark:text-white truncate">
                                {winner?.name.trim() ?? "—"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-auto pt-6 flex items-center justify-between text-sm">
                        <span className="text-foreground/50 flex items-center gap-3 flex-wrap">
                          <span>{edition.participants.length} candidats</span>
                          <span>·</span>
                          <span>{totalVotes.toLocaleString("fr-FR")} votes</span>
                          {edition._count.photos > 0 && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                <Images size={14} /> {edition._count.photos} photos
                              </span>
                            </>
                          )}
                        </span>
                        <span className="flex items-center gap-1 font-medium text-primary dark:text-white group-hover:text-accent transition-colors">
                          Découvrir <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </FadeIn>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
