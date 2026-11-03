import { prisma } from "@/lib/prisma";
import { getCurrentEvent } from "@/lib/event";
import type { Participant } from "@prisma/client";
import { Trophy, CreditCard, Users, TrendingUp, BarChart3 } from "lucide-react";
import VotesBarChart from "@/components/admin/VotesBarChart";
import ResetVotesButton from "@/components/admin/ResetVotesButton";
import Pagination, { clampPage } from "@/components/admin/Pagination";

export const dynamic = "force-dynamic";

const LEADERBOARD_PAGE_SIZE = 10;

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ miss?: string; mister?: string }>;
}) {
  const params = await searchParams;
  // Édition en cours, même si les votes sont suspendus (isActive = false)
  const event = await getCurrentEvent();
  // Sans événement, "none" ne correspond à aucun id : les statistiques restent à zéro
  const eventId = event?.id ?? "none";

  const [
    totalParticipants,
    totalTransactions,
    successAggregate,
    totalVotesAggregate,
  ] = await Promise.all([
    prisma.participant.count({ where: { eventId } }),
    prisma.transaction.count({ where: { eventId } }),
    prisma.transaction.aggregate({
      where: { eventId, status: "SUCCESS" },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    // Somme réelle de TOUS les votes (pas seulement top 5)
    prisma.participant.aggregate({
      where: { eventId },
      _sum: { totalVotes: true },
    }),
  ])

  const missCandidates = await prisma.participant.findMany({
    where: { eventId, category: "MISS" },
    orderBy: { totalVotes: "desc" },
  });

  const misterCandidates = await prisma.participant.findMany({
    where: { eventId, category: "MISTER" },
    orderBy: { totalVotes: "desc" },
  });

  const totalAmount = successAggregate._sum.amount ?? 0;
  const successCount = successAggregate._count._all;
  const totalVotes = totalVotesAggregate._sum.totalVotes ?? 0;

  const leaderboardHref = (key: "miss" | "mister", target: number) => {
    const next = new URLSearchParams();
    if (params.miss && key !== "miss") next.set("miss", params.miss);
    if (params.mister && key !== "mister") next.set("mister", params.mister);
    if (target > 1) next.set(key, String(target));
    const query = next.toString();
    return query ? `/admin?${query}` : "/admin";
  };

  const renderLeaderboard = (title: string, list: Participant[], key: "miss" | "mister") => {
    const page = clampPage(Number(params[key]), list.length, LEADERBOARD_PAGE_SIZE);
    const offset = (page - 1) * LEADERBOARD_PAGE_SIZE;
    const pageItems = list.slice(offset, offset + LEADERBOARD_PAGE_SIZE);
    return (
      <div className="bg-white dark:bg-[#111] rounded-3xl shadow-sm border border-black/5 dark:border-white/10 overflow-hidden flex-1 flex flex-col">
        <div className="p-6 border-b border-black/5 dark:border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-bold font-serif">{title}</h2>
          <Trophy size={20} className="text-accent" />
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left">
            <thead className="bg-black/5 dark:bg-white/5 text-sm uppercase tracking-wider text-foreground/60">
              <tr>
                <th className="px-6 py-4 font-medium">Pos</th>
                <th className="px-6 py-4 font-medium">Candidat</th>
                <th className="px-6 py-4 font-medium text-right">Votes</th>
                <th className="px-6 py-4 font-medium text-right text-green-600 dark:text-green-400">Avance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {pageItems.length > 0 ? pageItems.map((p, i) => {
                // Rang et avance calculés sur la liste complète, pas seulement sur la page
                const index = offset + i;
                const isFirst = index === 0;
                const leadVotes = index < list.length - 1 ? (p.totalVotes - list[index + 1].totalVotes) : 0;

                return (
                  <tr key={p.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`font-mono font-bold w-8 h-8 rounded-full flex items-center justify-center ${isFirst ? 'bg-accent text-white shadow-md' : 'bg-primary/10 text-primary dark:bg-white/10 dark:text-white'}`}>
                        #{index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold">
                      {/* flex sur un div : un <td> en flex casse l'alignement du tableau */}
                      <div className="flex items-center gap-3">
                        <span>{p.name}</span>
                        <span className="bg-black/5 dark:bg-white/10 px-2 py-1 rounded text-[10px] font-semibold uppercase shrink-0">
                          N°{p.number}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-primary dark:text-white">
                      {p.totalVotes.toLocaleString("fr-FR")}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-green-600 dark:text-green-400 text-sm">
                      {leadVotes > 0 ? `+${leadVotes.toLocaleString("fr-FR")}` : "-"}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                   <td colSpan={4} className="px-6 py-8 text-center text-foreground/60">Aucun candidat</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          pageSize={LEADERBOARD_PAGE_SIZE}
          totalItems={list.length}
          hrefFor={(target) => leaderboardHref(key, target)}
          itemLabel="candidats"
        />
      </div>
    );
  };

  return (
    <div className="p-6 md:p-10 space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary dark:text-white">Vue d&apos;ensemble</h1>
          <p className="text-foreground/60 mt-1">
            Statistiques en temps réel de l&apos;événement.
          </p>
        </div>
        <ResetVotesButton />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-[#111] p-6 rounded-3xl shadow-sm border border-black/5 dark:border-white/10">
          <div className="flex items-center space-x-3 mb-4 text-foreground/60">
            <CreditCard size={20} className="text-accent" />
            <h3 className="font-medium">Montant Récolté</h3>
          </div>
          <p className="text-3xl font-bold font-serif text-primary dark:text-white">
            {totalAmount.toLocaleString("fr-FR")} <span className="text-xl">FCFA</span>
          </p>
        </div>

        <div className="bg-white dark:bg-[#111] p-6 rounded-3xl shadow-sm border border-black/5 dark:border-white/10">
          <div className="flex items-center space-x-3 mb-4 text-foreground/60">
            <Trophy size={20} className="text-accent" />
            <h3 className="font-medium">Total Votes</h3>
          </div>
          <p className="text-3xl font-bold font-serif text-primary dark:text-white">
            {totalVotes.toLocaleString("fr-FR")}
          </p>
        </div>

        <div className="bg-white dark:bg-[#111] p-6 rounded-3xl shadow-sm border border-black/5 dark:border-white/10">
          <div className="flex items-center space-x-3 mb-4 text-foreground/60">
            <Users size={20} className="text-accent" />
            <h3 className="font-medium">Candidats</h3>
          </div>
          <p className="text-3xl font-bold font-serif text-primary dark:text-white">
            {totalParticipants}
          </p>
        </div>

        <div className="bg-white dark:bg-[#111] p-6 rounded-3xl shadow-sm border border-black/5 dark:border-white/10">
          <div className="flex items-center space-x-3 mb-4 text-foreground/60">
            <TrendingUp size={20} className="text-green-500" />
            <h3 className="font-medium">Transactions Payées</h3>
          </div>
          <p className="text-3xl font-bold font-serif text-primary dark:text-white">
            {successCount} <span className="text-xl text-foreground/50 font-normal">/ {totalTransactions}</span>
          </p>
        </div>
      </div>

      {/* Leaderboards */}
      <h2 className="text-2xl font-serif font-bold pt-4 text-primary dark:text-white">Classements Officiels</h2>
      <div className="flex flex-col lg:flex-row gap-6">
        {renderLeaderboard("Classement MISS", missCandidates, "miss")}
        {renderLeaderboard("Classement MISTER", misterCandidates, "mister")}
      </div>

      {/* Graphs */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center space-x-3 text-primary dark:text-white">
          <BarChart3 size={24} className="text-accent" />
          <h2 className="text-2xl font-serif font-bold">Analyse Graphique des Votes</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <VotesBarChart data={missCandidates} title="Top Miss (Votes)" color="#d4af37" />
          <VotesBarChart data={misterCandidates} title="Top Mister (Votes)" color="#d4af37" />
        </div>
      </div>

    </div>
  );
}
