import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import TransactionActions from "@/components/admin/TransactionActions";
import TransactionFilters from "@/components/admin/TransactionFilters";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminTransactions({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; sort?: string }>;
}) {
  const { q = "", status = "ALL", sort = "date_desc" } = await searchParams;

  const event = await prisma.votingEvent.findFirst({ where: { isActive: true } });

  // Construction du filtre Prisma
  const where: Prisma.TransactionWhereInput = event ? { eventId: event.id } : { id: "none" };

  if (status !== "ALL") {
    where.status = status as "PENDING" | "SUCCESS" | "FAILED";
  }

  if (q.trim()) {
    where.OR = [
      { reference: { contains: q, mode: "insensitive" } },
      { voter: { name:  { contains: q, mode: "insensitive" } } },
      { voter: { phone: { contains: q, mode: "insensitive" } } },
      { items: { some: { participant: { name: { contains: q, mode: "insensitive" } } } } },
    ];
  }

  const orderBy: Prisma.TransactionOrderByWithRelationInput =
    sort === "date_asc"    ? { createdAt: "asc" }  :
    sort === "amount_desc" ? { amount: "desc" }     :
    sort === "amount_asc"  ? { amount: "asc" }      :
                             { createdAt: "desc" };

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy,
    include: {
      voter: true,
      items: { include: { participant: true } },
    },
  });

  return (
    <div className="p-6 md:p-10 space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-primary dark:text-white">Transactions</h1>
        <p className="text-foreground/60 mt-1">Historique de tous les paiements.</p>
      </div>

      {/* Barre de filtres */}
      <TransactionFilters total={transactions.length} />

      {/* Tableau */}
      <div className="bg-white dark:bg-[#111] rounded-3xl shadow-sm border border-black/5 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-black/5 dark:bg-white/5 uppercase tracking-wider text-foreground/60 text-xs">
              <tr>
                <th className="px-6 py-4 font-medium">Référence</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium text-center">Réseau</th>
                <th className="px-6 py-4 font-medium">Votant</th>
                <th className="px-6 py-4 font-medium">Votes pour</th>
                <th className="px-6 py-4 font-medium text-right">Montant</th>
                <th className="px-6 py-4 font-medium text-center">Statut</th>
                <th className="px-6 py-4 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {transactions.map((tx) => {
                const targetParticipant = tx.items[0]?.participant;

                return (
                  <tr key={tx.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-foreground/70 text-xs">
                      {tx.reference}
                    </td>
                    <td className="px-6 py-4 text-foreground/70">
                      {format(new Date(tx.createdAt), "dd MMM yyyy à HH:mm", { locale: fr })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {tx.network === "MTN" ? (
                        <span className="bg-yellow-400/20 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded text-[10px] font-bold">MTN</span>
                      ) : tx.network === "CELTIS" ? (
                        <span className="bg-blue-500/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded text-[10px] font-bold">CELTIS</span>
                      ) : (
                        <span className="text-foreground/30 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {tx.voter ? (
                        tx.voter.isAnonymous ? (
                          <span className="text-foreground/50 italic text-xs">Anonyme ({tx.voter.anonCode})</span>
                        ) : (
                          <div>
                            <p className="font-medium">{tx.voter.name || "—"}</p>
                            {tx.voter.phone && <p className="text-xs text-foreground/50 font-mono">{tx.voter.phone}</p>}
                          </div>
                        )
                      ) : (
                        <span className="text-foreground/40 italic text-xs">Inconnu</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {targetParticipant ? (
                        <span className="bg-primary/10 text-primary dark:bg-white/10 dark:text-white px-2 py-1 rounded text-xs font-bold">
                          {targetParticipant.name} ×{tx.items[0]?.numberOfVotes}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-6 py-4 text-right font-bold">
                      {tx.amount.toLocaleString()} <span className="text-foreground/40 font-normal text-xs">FCFA</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                        tx.status === "SUCCESS"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800"
                          : tx.status === "FAILED"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800"
                          : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800"
                      }`}>
                        {tx.status === "SUCCESS" ? "Payé" : tx.status === "FAILED" ? "Échoué" : "En attente"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <TransactionActions transactionId={tx.id} status={tx.status} />
                    </td>
                  </tr>
                );
              })}

              {transactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-foreground/40">
                    <p className="font-medium">Aucune transaction trouvée.</p>
                    {(q || status !== "ALL") && (
                      <p className="text-xs mt-1">Essayez de modifier vos filtres.</p>
                    )}
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
