import { prisma } from "@/lib/prisma";
import { Trophy, CreditCard, Users, TrendingUp, BarChart3 } from "lucide-react";
import VotesBarChart from "@/components/admin/VotesBarChart";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const event = await prisma.votingEvent.findFirst({
    where: { isActive: true },
  });

  const [
    totalParticipants,
    totalTransactions,
    successTransactions,
    participants,
  ] = await Promise.all([
    prisma.participant.count({ where: { eventId: event?.id } }),
    prisma.transaction.count({ where: { eventId: event?.id } }),
    prisma.transaction.findMany({
      where: { eventId: event?.id, status: "SUCCESS" },
    }),
    prisma.participant.findMany({
      where: { eventId: event?.id },
      orderBy: { totalVotes: "desc" },
      take: 5,
    }),
  ])

  const missCandidates = await prisma.participant.findMany({
    where: { eventId: event?.id, category: "MISS" },
    orderBy: { totalVotes: "desc" },
  });

  const misterCandidates = await prisma.participant.findMany({
    where: { eventId: event?.id, category: "MISTER" },
    orderBy: { totalVotes: "desc" },
  });

  const totalAmount = successTransactions.reduce((acc, tx) => acc + tx.amount, 0);
  const totalVotes = participants.reduce((acc, p) => acc + p.totalVotes, 0);

  const renderLeaderboard = (title: string, list: any[]) => {
    return (
      <div className="bg-white dark:bg-[#111] rounded-3xl shadow-sm border border-black/5 dark:border-white/10 overflow-hidden flex-1">
        <div className="p-6 border-b border-black/5 dark:border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-bold font-serif">{title}</h2>
          <Trophy size={20} className="text-accent" />
        </div>
        <div className="overflow-x-auto">
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
              {list.length > 0 ? list.map((p, index) => {
                const isFirst = index === 0;
                // Calculate lead over next person (if any)
                const leadVotes = index < list.length - 1 ? (p.totalVotes - list[index + 1].totalVotes) : 0;
                
                return (
                  <tr key={p.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`font-mono font-bold w-8 h-8 rounded-full flex items-center justify-center ${isFirst ? 'bg-accent text-white shadow-md' : 'bg-primary/10 text-primary'}`}>
                        #{index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold flex items-center gap-3">
                      <span>{p.name}</span>
                      <span className="bg-black/5 dark:bg-white/10 px-2 py-1 rounded text-[10px] font-semibold uppercase shrink-0">
                        N°{p.number}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-primary dark:text-white">
                      {p.totalVotes.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-green-600 dark:text-green-400 text-sm">
                      {leadVotes > 0 ? `+${leadVotes.toLocaleString()}` : "-"}
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
      </div>
    );
  };

  return (
    <div className="p-6 md:p-10 space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-primary dark:text-white">Vue d&apos;ensemble</h1>
        <p className="text-foreground/60 mt-1">
          Statistiques en temps réel de l&apos;événement.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-[#111] p-6 rounded-3xl shadow-sm border border-black/5 dark:border-white/10">
          <div className="flex items-center space-x-3 mb-4 text-foreground/60">
            <CreditCard size={20} className="text-accent" />
            <h3 className="font-medium">Montant Récolté</h3>
          </div>
          <p className="text-3xl font-bold font-serif text-primary dark:text-white">
            {totalAmount.toLocaleString()} <span className="text-xl">FCFA</span>
          </p>
        </div>

        <div className="bg-white dark:bg-[#111] p-6 rounded-3xl shadow-sm border border-black/5 dark:border-white/10">
          <div className="flex items-center space-x-3 mb-4 text-foreground/60">
            <Trophy size={20} className="text-accent" />
            <h3 className="font-medium">Total Votes</h3>
          </div>
          <p className="text-3xl font-bold font-serif text-primary dark:text-white">
            {totalVotes.toLocaleString()}
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
            {successTransactions.length} <span className="text-xl text-foreground/50 font-normal">/ {totalTransactions}</span>
          </p>
        </div>
      </div>

      {/* Leaderboards */}
      <h2 className="text-2xl font-serif font-bold pt-4 text-primary dark:text-white">Classements Officiels</h2>
      <div className="flex flex-col lg:flex-row gap-6">
        {renderLeaderboard("Classement MISS", missCandidates)}
        {renderLeaderboard("Classement MISTER", misterCandidates)}
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
