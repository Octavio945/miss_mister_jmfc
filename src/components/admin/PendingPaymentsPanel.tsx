"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Clock, Check, X, Loader2, RefreshCw, Bell } from "lucide-react";

interface PendingTx {
  id: string;
  reference: string;
  amount: number;
  network: string | null;
  createdAt: string;
  voter: { name: string | null; phone: string | null; isAnonymous: boolean; anonCode: string | null } | null;
  items: { numberOfVotes: number; participant: { name: string } }[];
}

export default function PendingPaymentsPanel() {
  const router = useRouter();
  const [pending, setPending] = useState<PendingTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/pending-payments");
      if (res.ok) {
        const data = await res.json();
        setPending(data.pending ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
    // Rafraîchissement auto toutes les 30s
    const interval = setInterval(fetchPending, 30_000);
    return () => clearInterval(interval);
  }, [fetchPending]);

  const handleAction = async (transactionId: string, action: "validate" | "reject") => {
    const label = action === "validate" ? "valider" : "rejeter";
    if (!confirm(`Êtes-vous sûr de vouloir ${label} ce paiement ?`)) return;

    setActionId(transactionId);
    try {
      const endpoint = action === "validate"
        ? "/api/admin/validate-payment"
        : "/api/admin/reject-payment";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId }),
      });

      if (res.ok) {
        await fetchPending();
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Une erreur est survenue.");
      }
    } catch {
      alert("Erreur de connexion.");
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#111] rounded-3xl border border-black/5 dark:border-white/10 p-6 flex items-center space-x-3 text-foreground/50">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">Chargement des paiements en attente…</span>
      </div>
    );
  }

  if (pending.length === 0) {
    return (
      <div className="bg-white dark:bg-[#111] rounded-3xl border border-black/5 dark:border-white/10 p-6 flex items-center justify-between">
        <div className="flex items-center space-x-3 text-foreground/50">
          <Clock size={18} />
          <span className="text-sm">Aucun paiement en attente de validation.</span>
        </div>
        <button onClick={fetchPending} className="text-foreground/40 hover:text-primary transition-colors">
          <RefreshCw size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-orange-50 dark:bg-orange-900/10 rounded-3xl border border-orange-200 dark:border-orange-800 overflow-hidden">
      {/* En-tête */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-orange-200 dark:border-orange-800">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bell size={20} className="text-orange-600 dark:text-orange-400" />
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
              {pending.length}
            </span>
          </div>
          <h2 className="font-bold text-orange-800 dark:text-orange-300">
            {pending.length} paiement{pending.length > 1 ? "s" : ""} en attente de validation
          </h2>
        </div>
        <button
          onClick={fetchPending}
          className="text-orange-500 hover:text-orange-700 transition-colors"
          title="Rafraîchir"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Liste */}
      <div className="divide-y divide-orange-200 dark:divide-orange-800/50">
        {pending.map((tx) => {
          const item = tx.items[0];
          const candidat = item?.participant?.name ?? "Inconnu";
          const nbVotes  = item?.numberOfVotes ?? 0;
          const votant   = tx.voter?.isAnonymous
            ? `Anonyme (${tx.voter.anonCode ?? ""})`
            : tx.voter?.name || tx.voter?.phone || "Inconnu";

          const networkLabel = tx.network === "MTN"
            ? { label: "MTN", cls: "bg-yellow-400/20 text-yellow-700 dark:text-yellow-400" }
            : tx.network === "CELTIS"
            ? { label: "Celtis", cls: "bg-blue-500/20 text-blue-700 dark:text-blue-400" }
            : { label: tx.network ?? "?", cls: "bg-black/10 text-foreground/60" };

          const isActing = actionId === tx.id;

          return (
            <div key={tx.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center flex-wrap gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${networkLabel.cls}`}>
                    {networkLabel.label}
                  </span>
                  <span className="font-bold text-primary dark:text-white">
                    {tx.amount.toLocaleString("fr-FR")} FCFA
                  </span>
                  <span className="text-xs text-foreground/50 font-mono">{tx.reference}</span>
                </div>
                <p className="text-sm text-foreground/70">
                  <span className="font-medium">{candidat}</span>
                  <span className="text-foreground/40"> · {nbVotes} vote{nbVotes > 1 ? "s" : ""}</span>
                  <span className="text-foreground/40"> · {votant}</span>
                </p>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0">
                <button
                  onClick={() => handleAction(tx.id, "validate")}
                  disabled={!!actionId}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {isActing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>Valider</span>
                </button>
                <button
                  onClick={() => handleAction(tx.id, "reject")}
                  disabled={!!actionId}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {isActing ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                  <span>Rejeter</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
