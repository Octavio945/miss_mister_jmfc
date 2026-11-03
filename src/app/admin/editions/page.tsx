import { prisma } from "@/lib/prisma";
import type { Participant } from "@prisma/client";
import { History, Download, Trophy, ExternalLink } from "lucide-react";
import EditionGallery from "@/components/admin/EditionGallery";
import { isEditionFinished } from "@/lib/event";

export const dynamic = "force-dynamic";

const formatDay = (date: Date) =>
  date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export default async function AdminEditions() {
  // La plus récente en premier : c'est l'édition en cours (voir src/lib/event.ts)
  const events = await prisma.votingEvent.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      participants: { orderBy: { totalVotes: "desc" } },
      photos: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
    },
  });

  // Montant encaissé et paiements en attente par édition
  const txStats = await prisma.transaction.groupBy({
    by: ["eventId", "status"],
    _count: { _all: true },
    _sum: { amount: true },
  });
  const statFor = (eventId: string, status: "SUCCESS" | "PENDING") =>
    txStats.find((s) => s.eventId === eventId && s.status === status);

  const renderRanking = (title: string, list: Participant[]) => (
    <div className="flex-1 min-w-0">
      <h4 className="font-bold font-serif mb-3 flex items-center gap-2">
        <Trophy size={16} className="text-accent" />
        {title}
      </h4>
      {list.length > 0 ? (
        <ol className="space-y-2">
          {list.map((p, index) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 text-sm"
            >
              <span className="truncate">
                <span className={`font-mono font-bold mr-2 ${index === 0 ? "text-accent" : "text-foreground/50"}`}>
                  #{index + 1}
                </span>
                {p.name.trim()}
                <span className="text-foreground/50 ml-2">N°{p.number}</span>
              </span>
              <span className="font-bold whitespace-nowrap">{p.totalVotes.toLocaleString("fr-FR")} votes</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-foreground/60">Aucun candidat</p>
      )}
    </div>
  );

  return (
    <div className="p-6 md:p-10 space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-primary dark:text-white flex items-center gap-3">
          <History size={32} />
          Éditions
        </h1>
        <p className="text-foreground/60 mt-1">
          Historique des concours. Ajoutez le récit et les photos de chaque édition : une fois terminée, elle apparaît dans la page publique « Historique ».
        </p>
      </div>

      {events.length === 0 && (
        <p className="text-foreground/60">Aucune édition n&apos;a encore été créée.</p>
      )}

      {events.map((event, index) => {
        const isCurrent = index === 0;
        const isPublic = isEditionFinished(event, events[0]?.id);
        const success = statFor(event.id, "SUCCESS");
        const pending = statFor(event.id, "PENDING");
        const totalVotes = event.participants.reduce((sum, p) => sum + p.totalVotes, 0);

        return (
          <section
            key={event.id}
            className="bg-white dark:bg-[#111] rounded-3xl shadow-sm border border-black/5 dark:border-white/10 p-6 md:p-8 space-y-6"
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl font-bold font-serif">{event.title}</h2>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                      isCurrent ? "bg-primary text-white" : "bg-black/10 dark:bg-white/10 text-foreground/70"
                    }`}
                  >
                    {isCurrent ? "En cours" : "Archivée"}
                  </span>
                </div>
                <p className="text-sm text-foreground/60 mt-1">
                  Votes du {formatDay(event.startDate)} au {formatDay(event.endDate)} · {event.votePrice} FCFA le vote
                </p>
              </div>

              <div className="flex gap-2 flex-wrap">
                {isPublic && (
                  <a
                    href={`/historique/${event.id}`}
                    target="_blank"
                    rel="noopener"
                    className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    <ExternalLink size={14} />
                    <span>Page publique</span>
                  </a>
                )}
                <a
                  href={`/api/admin/export?event=${event.id}&type=results`}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <Download size={14} />
                  <span>Résultats (CSV)</span>
                </a>
                <a
                  href={`/api/admin/export?event=${event.id}&type=transactions`}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <Download size={14} />
                  <span>Transactions (CSV)</span>
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Montant récolté", value: `${(success?._sum.amount ?? 0).toLocaleString("fr-FR")} FCFA` },
                { label: "Total votes", value: totalVotes.toLocaleString("fr-FR") },
                { label: "Paiements validés", value: String(success?._count._all ?? 0) },
                { label: "Paiements en attente", value: String(pending?._count._all ?? 0) },
              ].map((stat) => (
                <div key={stat.label} className="p-4 rounded-2xl bg-black/5 dark:bg-white/5">
                  <p className="text-xs uppercase tracking-wider text-foreground/60">{stat.label}</p>
                  <p className="text-xl font-bold font-serif text-primary dark:text-white mt-1">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              {renderRanking("Classement Miss", event.participants.filter((p) => p.category === "MISS"))}
              {renderRanking("Classement Mister", event.participants.filter((p) => p.category === "MISTER"))}
            </div>

            {!isPublic && (
              <p className="text-xs text-foreground/50">
                Cette édition sera visible dans l&apos;historique public dès la fin des votes.
              </p>
            )}
            <EditionGallery
              eventId={event.id}
              initialDescription={event.description}
              initialPhotos={event.photos.map(({ id, imageUrl, caption }) => ({ id, imageUrl, caption }))}
            />
          </section>
        );
      })}
    </div>
  );
}
