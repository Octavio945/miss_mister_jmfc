import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function AdminTransactions() {
  const event = await prisma.votingEvent.findFirst({
    where: { isActive: true },
  });

  const transactions = event
    ? await prisma.transaction.findMany({
        where: { eventId: event.id },
        orderBy: { createdAt: "desc" },
        include: {
          voter: true,
          items: {
            include: { participant: true },
          },
        },
      })
    : [];

  return (
    <div className="p-6 md:p-10 space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-primary dark:text-white">Transactions</h1>
        <p className="text-foreground/60 mt-1">
          Historique de tous les paiements (réussis et en attente).
        </p>
      </div>

      <div className="bg-white dark:bg-[#111] rounded-3xl shadow-sm border border-black/5 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-black/5 dark:bg-white/5 uppercase tracking-wider text-foreground/60">
              <tr>
                <th className="px-6 py-4 font-medium">Référence</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Votant</th>
                <th className="px-6 py-4 font-medium">Votes pour</th>
                <th className="px-6 py-4 font-medium text-right">Montant</th>
                <th className="px-6 py-4 font-medium text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {transactions.map((tx) => {
                const targetParticipant = tx.items[0]?.participant;
                const isSuccess = tx.status === "SUCCESS";

                return (
                  <tr key={tx.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-foreground/70">
                      {tx.reference}
                    </td>
                    <td className="px-6 py-4">
                      {format(new Date(tx.createdAt), "dd MMM yyyy à HH:mm", { locale: fr })}
                    </td>
                    <td className="px-6 py-4">
                      {tx.voter ? (
                        tx.voter.isAnonymous ? (
                          <span className="text-foreground/50 italic">Anonyme ({tx.voter.anonCode})</span>
                        ) : (
                          <span className="font-medium">{tx.voter.name || tx.voter.phone || "Inconnu"}</span>
                        )
                      ) : (
                        <span className="text-foreground/40 italic">Inconnu</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {targetParticipant ? (
                        <span className="bg-primary/10 text-primary dark:bg-white/10 dark:text-white px-2 py-1 rounded text-xs font-bold">
                          {targetParticipant.name} (x{tx.items[0]?.numberOfVotes})
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-bold">
                      {tx.amount.toLocaleString()} FCFA
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                          isSuccess
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800"
                            : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-foreground/60">
                    Aucune transaction trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
