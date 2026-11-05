import { prisma } from "@/lib/prisma";
import { getCurrentEvent } from "@/lib/event";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import TransactionFilters from "@/components/admin/TransactionFilters";
import Pagination, { clampPage } from "@/components/admin/Pagination";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;
const STATUSES = ["PENDING", "SUCCESS", "FAILED"] as const;

// Moyen de paiement renvoyé par FedaPay (mtn_open, moov, celtiis_bj…) ou réseau des anciens paiements manuels
function paymentLabel(method: string | null, network: string | null): { label: string; cls: string } | null {
  const value = (method ?? network ?? "").toLowerCase();
  if (!value) return null;
  if (value.includes("mtn")) return { label: "MTN", cls: "bg-yellow-400/20 text-yellow-700 dark:text-yellow-400" };
  if (value.includes("moov")) return { label: "Moov", cls: "bg-sky-500/20 text-sky-700 dark:text-sky-400" };
  if (value.includes("celti")) return { label: "Celtiis", cls: "bg-blue-500/20 text-blue-700 dark:text-blue-400" };
  return { label: value.replace(/_/g, " ").toUpperCase(), cls: "bg-black/10 dark:bg-white/10 text-foreground/70" };
}

export default async function AdminTransactions({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; sort?: string; page?: string }>;
}) {
  const params = await searchParams;
  const { q = "", sort = "date_desc" } = params;
  // Un statut inconnu dans l'URL est ignoré au lieu de provoquer une erreur
  const status = STATUSES.find((s) => s === params.status) ?? "ALL";

  // Édition en cours, même si les votes sont suspendus (isActive = false)
  const event = await getCurrentEvent();

  // Construction du filtre Prisma
  const where: Prisma.TransactionWhereInput = event ? { eventId: event.id } : { id: "none" };

  if (status !== "ALL") {
    where.status = status;
  }

  if (q.trim()) {
    where.OR = [
      { reference: { contains: q, mode: "insensitive" } },
      { voter: { name:  { contains: q, mode: "insensitive" } } },
      { voter: { phone: { contains: q, mode: "insensitive" } } },
      { items: { some: { participant: { name: { contains: q, mode: "insensitive" } } } } },
    ];
  }

  const primaryOrder: Prisma.TransactionOrderByWithRelationInput =
    sort === "date_asc"    ? { createdAt: "asc" }  :
    sort === "amount_desc" ? { amount: "desc" }     :
    sort === "amount_asc"  ? { amount: "asc" }      :
                             { createdAt: "desc" };
  // Tri secondaire stable : à montant égal, l'ordre ne change pas d'une page à l'autre
  const orderBy = [primaryOrder, { id: "asc" as const }];

  const totalCount = await prisma.transaction.count({ where });
  const page = clampPage(Number(params.page), totalCount, PAGE_SIZE);

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy,
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: {
      voter: true,
      items: { include: { participant: true } },
    },
  });

  // Conserve recherche, statut et tri en changeant de page
  const hrefFor = (target: number) => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (status !== "ALL") next.set("status", status);
    if (sort !== "date_desc") next.set("sort", sort);
    if (target > 1) next.set("page", String(target));
    const query = next.toString();
    return query ? `/admin/transactions?${query}` : "/admin/transactions";
  };

  return (
    <div className="p-6 md:p-10 space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-primary dark:text-white">Transactions</h1>
        <p className="text-foreground/60 mt-1">
          Historique de tous les paiements. Les votes sont ajoutés automatiquement dès que FedaPay confirme le paiement.
        </p>
      </div>

      {/* Barre de filtres */}
      <TransactionFilters total={totalCount} />

      {/* Tableau */}
      <div className="bg-white dark:bg-[#111] rounded-3xl shadow-sm border border-black/5 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-black/5 dark:bg-white/5 uppercase tracking-wider text-foreground/60 text-xs">
              <tr>
                <th className="px-6 py-4 font-medium">Référence</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium text-center">Moyen</th>
                <th className="px-6 py-4 font-medium">Votant</th>
                <th className="px-6 py-4 font-medium">Votes pour</th>
                <th className="px-6 py-4 font-medium text-right">Montant</th>
                <th className="px-6 py-4 font-medium text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {transactions.map((tx) => {
                const targetParticipant = tx.items[0]?.participant;
                const method = paymentLabel(tx.paymentMethod, tx.network);

                return (
                  <tr key={tx.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-foreground/70 text-xs">
                      {tx.reference}
                    </td>
                    <td className="px-6 py-4 text-foreground/70">
                      {format(new Date(tx.createdAt), "dd MMM yyyy à HH:mm", { locale: fr })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {method ? (
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${method.cls}`}>{method.label}</span>
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
                      {tx.amount.toLocaleString("fr-FR")} <span className="text-foreground/40 font-normal text-xs">FCFA</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                        tx.status === "SUCCESS"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800"
                          : tx.status === "FAILED"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800"
                          : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800"
                      }`}>
                        {tx.status === "SUCCESS" ? "Payé" : tx.status === "FAILED" ? "Échoué" : "Non finalisé"}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {transactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-foreground/40">
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
        <Pagination page={page} pageSize={PAGE_SIZE} totalItems={totalCount} hrefFor={hrefFor} itemLabel="transactions" />
      </div>
    </div>
  );
}
