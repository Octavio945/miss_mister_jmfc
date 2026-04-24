"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Clock, Check, X, Loader2, RefreshCw, Bell, ChevronDown, ChevronRight, Trophy } from "lucide-react";
import AdminModal from "@/components/admin/AdminModal";

interface PendingTx {
  id: string;
  reference: string;
  amount: number;
  network: string | null;
  createdAt: string;
  voter: { name: string | null; phone: string | null; isAnonymous: boolean; anonCode: string | null } | null;
  items: { numberOfVotes: number; participant: { name: string } }[];
}

interface CandidatGroup {
  name: string;
  totalAmount: number;
  totalVotes: number;
  transactions: PendingTx[];
}

type ModalState =
  | { type: "confirm"; transactionId: string; action: "validate" | "reject"; candidat: string; amount: number; votes: number }
  | { type: "error"; message: string };

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (mins < 1)  return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  if (hours < 24) return `il y a ${hours}h`;
  return `il y a ${Math.floor(hours / 24)}j`;
}

const NETWORK_STYLE: Record<string, { label: string; cls: string }> = {
  MTN:    { label: "MTN",   cls: "bg-yellow-400/20 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-700" },
  CELTIS: { label: "Celtis", cls: "bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700" },
};

export default function PendingPaymentsPanel() {
  const router = useRouter();
  const [pending, setPending]           = useState<PendingTx[]>([]);
  const [loading, setLoading]           = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [modal, setModal]               = useState<ModalState | null>(null);
  const [openGroups, setOpenGroups]     = useState<Set<string>>(new Set());

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/pending-payments");
      if (res.ok) {
        const data = await res.json();
        const list: PendingTx[] = data.pending ?? [];
        setPending(list);
        // Ouvre automatiquement tous les groupes au premier chargement
        setOpenGroups((prev) => prev);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
    const interval = setInterval(fetchPending, 30_000);
    return () => clearInterval(interval);
  }, [fetchPending]);

  // Groupement par candidat
  const groups = useMemo<CandidatGroup[]>(() => {
    const map = new Map<string, CandidatGroup>();
    for (const tx of pending) {
      const name   = tx.items[0]?.participant?.name ?? "Inconnu";
      const votes  = tx.items[0]?.numberOfVotes ?? 0;
      const group  = map.get(name) ?? { name, totalAmount: 0, totalVotes: 0, transactions: [] };
      group.totalAmount += tx.amount;
      group.totalVotes  += votes;
      group.transactions.push(tx);
      map.set(name, group);
    }
    // Trier par nombre de transactions décroissant
    return Array.from(map.values()).sort((a, b) => b.transactions.length - a.transactions.length);
  }, [pending]);

  const toggleGroup = (name: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const executeAction = async () => {
    if (!modal || modal.type !== "confirm") return;
    setActionLoading(true);

    const endpoint = modal.action === "validate"
      ? "/api/admin/validate-payment"
      : "/api/admin/reject-payment";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: modal.transactionId }),
      });
      setModal(null);
      if (res.ok) {
        await fetchPending();
        router.refresh();
      } else {
        const data = await res.json();
        setModal({ type: "error", message: data.error || "Une erreur est survenue." });
      }
    } catch {
      setModal({ type: "error", message: "Erreur de connexion. Vérifiez votre réseau." });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#111] rounded-3xl border border-black/5 dark:border-white/10 p-6 flex items-center space-x-3 text-foreground/50">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">Chargement des notifications…</span>
      </div>
    );
  }

  if (pending.length === 0) {
    return (
      <div className="bg-white dark:bg-[#111] rounded-3xl border border-black/5 dark:border-white/10 p-5 flex items-center justify-between">
        <div className="flex items-center space-x-3 text-foreground/40">
          <Clock size={18} />
          <span className="text-sm">Aucun paiement en attente de validation.</span>
        </div>
        <button onClick={fetchPending} className="text-foreground/30 hover:text-primary transition-colors" title="Rafraîchir">
          <RefreshCw size={15} />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-orange-50 dark:bg-orange-900/10 rounded-3xl border border-orange-200 dark:border-orange-800 overflow-hidden">

        {/* ── En-tête global ─────────────────────────────────────────────── */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell size={20} className="text-orange-600 dark:text-orange-400" />
              <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 bg-orange-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                {pending.length}
              </span>
            </div>
            <div>
              <p className="font-bold text-orange-800 dark:text-orange-300 leading-tight">
                {pending.length} paiement{pending.length > 1 ? "s" : ""} en attente
              </p>
              <p className="text-xs text-orange-600/70 dark:text-orange-400/70">
                {groups.length} candidat{groups.length > 1 ? "s" : ""} concerné{groups.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button onClick={fetchPending} className="text-orange-500 hover:text-orange-700 transition-colors p-1.5 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30" title="Rafraîchir">
            <RefreshCw size={15} />
          </button>
        </div>

        {/* ── Accordéons par candidat ────────────────────────────────────── */}
        <div className="divide-y divide-orange-200 dark:divide-orange-800/50">
          {groups.map((group) => {
            const isOpen = openGroups.has(group.name);

            return (
              <div key={group.name}>

                {/* En-tête du groupe (cliquable) */}
                <button
                  onClick={() => toggleGroup(group.name)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-orange-100/50 dark:hover:bg-orange-900/20 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0">
                      {isOpen
                        ? <ChevronDown size={18} className="text-orange-500" />
                        : <ChevronRight size={18} className="text-orange-400" />
                      }
                    </div>
                    <Trophy size={16} className="text-orange-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-primary dark:text-white truncate">{group.name}</p>
                      <p className="text-xs text-foreground/50">
                        {group.transactions.length} paiement{group.transactions.length > 1 ? "s" : ""} · {group.totalVotes} vote{group.totalVotes > 1 ? "s" : ""} · {group.totalAmount.toLocaleString("fr-FR")} FCFA
                      </p>
                    </div>
                  </div>

                  {/* Badge nombre de paiements */}
                  <span className="flex-shrink-0 ml-3 min-w-[22px] h-[22px] px-1.5 bg-orange-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                    {group.transactions.length}
                  </span>
                </button>

                {/* Liste des paiements du groupe */}
                {isOpen && (
                  <div className="bg-white/60 dark:bg-black/20 divide-y divide-orange-100 dark:divide-orange-900/30">
                    {group.transactions.map((tx) => {
                      const votes  = tx.items[0]?.numberOfVotes ?? 0;
                      const votant = tx.voter?.isAnonymous
                        ? `Anonyme (${tx.voter.anonCode ?? ""})`
                        : tx.voter?.name || tx.voter?.phone || "Inconnu";
                      const net = NETWORK_STYLE[tx.network ?? ""] ?? { label: tx.network ?? "?", cls: "bg-black/10 text-foreground/60 border border-black/10" };

                      return (
                        <div key={tx.id} className="pl-14 pr-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex items-center flex-wrap gap-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${net.cls}`}>
                                {net.label}
                              </span>
                              <span className="font-bold text-sm text-primary dark:text-white">
                                {tx.amount.toLocaleString("fr-FR")} FCFA
                              </span>
                              <span className="text-xs font-semibold text-accent">
                                +{votes} vote{votes > 1 ? "s" : ""}
                              </span>
                            </div>
                            <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-xs text-foreground/50">
                              <span className="font-mono">{tx.reference}</span>
                              <span>·</span>
                              <span>{votant}</span>
                              <span>·</span>
                              <span className="text-orange-500 dark:text-orange-400">{timeAgo(tx.createdAt)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => setModal({ type: "confirm", transactionId: tx.id, action: "validate", candidat: group.name, amount: tx.amount, votes })}
                              disabled={actionLoading}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-colors disabled:opacity-50"
                            >
                              <Check size={13} />
                              Valider
                            </button>
                            <button
                              onClick={() => setModal({ type: "confirm", transactionId: tx.id, action: "reject", candidat: group.name, amount: tx.amount, votes })}
                              disabled={actionLoading}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                              <X size={13} />
                              Rejeter
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de confirmation */}
      {modal?.type === "confirm" && (
        <AdminModal
          type={modal.action === "validate" ? "success" : "danger"}
          title={modal.action === "validate" ? "Valider le paiement" : "Rejeter le paiement"}
          message={
            modal.action === "validate"
              ? `Valider le paiement de ${modal.amount.toLocaleString()} FCFA (+${modal.votes} vote${modal.votes > 1 ? "s" : ""}) pour "${modal.candidat}" ?`
              : `Rejeter le paiement de ${modal.amount.toLocaleString()} FCFA pour "${modal.candidat}" ? Aucun vote ne sera ajouté.`
          }
          confirmLabel={modal.action === "validate" ? "Oui, valider" : "Oui, rejeter"}
          loading={actionLoading}
          onConfirm={executeAction}
          onClose={() => !actionLoading && setModal(null)}
        />
      )}

      {/* Modal d'erreur */}
      {modal?.type === "error" && (
        <AdminModal
          type="danger"
          title="Erreur"
          message={modal.message}
          confirmLabel="OK"
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
