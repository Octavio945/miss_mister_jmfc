"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Check, X, Loader2, RefreshCw, Inbox } from "lucide-react";
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

type ModalState =
  | { type: "confirm"; tx: PendingTx; action: "validate" | "reject" }
  | { type: "error"; message: string };

const POLL_MS = 30_000;
const PAGE_SIZE = 20;
// Date de la dernière ouverture de la cloche : les paiements plus récents sont « nouveaux »
const LAST_SEEN_KEY = "admin-notifications-last-seen";

const NETWORK_STYLE: Record<string, { label: string; cls: string }> = {
  MTN:    { label: "MTN",    cls: "bg-yellow-400/20 text-yellow-700 dark:text-yellow-400" },
  CELTIS: { label: "Celtis", cls: "bg-blue-500/20 text-blue-700 dark:text-blue-400" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (mins < 1)  return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return days < 30 ? `il y a ${days} j` : new Date(dateStr).toLocaleDateString("fr-FR");
}

function readLastSeen(): number {
  try {
    return Number(localStorage.getItem(LAST_SEEN_KEY)) || 0;
  } catch {
    return 0;
  }
}

function voterLabel(tx: PendingTx): string {
  if (tx.voter?.isAnonymous) return `Anonyme (${tx.voter.anonCode ?? ""})`;
  return tx.voter?.name || tx.voter?.phone || "Votant inconnu";
}

export default function NotificationBell() {
  const router = useRouter();
  const [pending, setPending] = useState<PendingTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [lastSeen, setLastSeen] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [modal, setModal] = useState<ModalState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/pending-payments", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        // Les plus récents en premier
        setPending(((data.pending ?? []) as PendingTx[]).reverse());
      }
    } catch {
      // Réseau indisponible : on garde la dernière liste connue
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Lecture différée : localStorage n'existe pas pendant le rendu serveur
    const timer = setTimeout(() => setLastSeen(readLastSeen()), 0);
    fetchPending();
    const interval = setInterval(fetchPending, POLL_MS);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchPending]);

  // Fermeture au clic extérieur et avec Échap (sauf pendant une confirmation)
  useEffect(() => {
    if (!open || modal) return;
    const onPointer = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, modal]);

  const unreadCount = pending.filter((tx) => new Date(tx.createdAt).getTime() > lastSeen).length;

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    setVisibleCount(PAGE_SIZE);
    fetchPending();
    // Marquer comme vus ; les surlignages « nouveau » restent visibles pendant cette ouverture
    try {
      localStorage.setItem(LAST_SEEN_KEY, String(Date.now()));
    } catch {
      // Stockage indisponible (navigation privée) : pas grave
    }
  };

  const close = () => {
    setOpen(false);
    setLastSeen(readLastSeen());
  };

  const executeAction = async () => {
    if (!modal || modal.type !== "confirm") return;
    setActionLoading(true);
    const endpoint = modal.action === "validate" ? "/api/admin/validate-payment" : "/api/admin/reject-payment";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: modal.tx.id }),
      });
      if (res.ok) {
        setModal(null);
        // Retrait immédiat de la liste, puis resynchronisation
        setPending((prev) => prev.filter((tx) => tx.id !== modal.tx.id));
        fetchPending();
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        setModal({ type: "error", message: data?.error || "Une erreur est survenue." });
        fetchPending();
      }
    } catch {
      setModal({ type: "error", message: "Erreur de connexion. Vérifiez votre réseau." });
    } finally {
      setActionLoading(false);
    }
  };

  const count = pending.length;
  const badge = count > 99 ? "99+" : String(count);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={count > 0 ? `Notifications : ${count} paiement${count > 1 ? "s" : ""} en attente` : "Notifications"}
        className={`relative p-2.5 rounded-full transition-colors ${
          open ? "bg-primary/10 text-primary dark:text-white" : "text-foreground/70 hover:bg-black/5 dark:hover:bg-white/10"
        }`}
      >
        <Bell size={22} />
        {count > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none flex items-center justify-center ring-2 ring-white dark:ring-[#111]">
            {badge}
          </span>
        )}
        {/* Signal animé : nouveaux paiements depuis la dernière ouverture */}
        {unreadCount > 0 && !open && (
          <span className="absolute top-0.5 right-0.5 w-[18px] h-[18px] rounded-full bg-red-500/60 animate-ping motion-reduce:hidden" aria-hidden />
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Paiements en attente"
          className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[26rem] z-50 bg-white dark:bg-[#111] rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* En-tête */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-black/5 dark:border-white/10">
            <div>
              <p className="font-bold text-primary dark:text-white">Notifications</p>
              <p className="text-xs text-foreground/50">
                {count > 0
                  ? `${count} paiement${count > 1 ? "s" : ""} à valider${unreadCount > 0 ? ` · ${unreadCount} nouveau${unreadCount > 1 ? "x" : ""}` : ""}`
                  : "Tout est à jour"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={fetchPending}
                className="p-2 rounded-lg text-foreground/40 hover:text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                title="Rafraîchir"
                aria-label="Rafraîchir"
              >
                <RefreshCw size={15} />
              </button>
              <button
                type="button"
                onClick={close}
                className="p-2 rounded-lg text-foreground/40 hover:text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Liste */}
          <div className="max-h-[min(65vh,32rem)] overflow-y-auto overscroll-contain">
            {loading ? (
              <div className="p-8 flex items-center justify-center gap-2 text-sm text-foreground/50">
                <Loader2 size={16} className="animate-spin" />
                Chargement…
              </div>
            ) : count === 0 ? (
              <div className="p-10 flex flex-col items-center text-center text-foreground/50">
                <Inbox size={32} className="mb-3 text-foreground/30" />
                <p className="text-sm font-medium">Aucun paiement en attente</p>
                <p className="text-xs mt-1">Les nouveaux paiements apparaîtront ici.</p>
              </div>
            ) : (
              <ul className="divide-y divide-black/5 dark:divide-white/5">
                {pending.slice(0, visibleCount).map((tx) => {
                  const votes = tx.items.reduce((sum, item) => sum + item.numberOfVotes, 0);
                  const candidat = tx.items[0]?.participant?.name?.trim() ?? "Candidat inconnu";
                  const net = NETWORK_STYLE[tx.network ?? ""] ?? { label: tx.network ?? "?", cls: "bg-black/10 text-foreground/60" };
                  const isNew = new Date(tx.createdAt).getTime() > lastSeen;

                  return (
                    <li key={tx.id} className={`px-4 py-3 ${isNew ? "bg-accent/5" : ""}`}>
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${isNew ? "bg-red-500" : "bg-transparent"}`}
                          aria-label={isNew ? "Nouveau" : undefined}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-foreground/80">
                            <span className="font-bold text-primary dark:text-white">{tx.amount.toLocaleString("fr-FR")} FCFA</span>
                            {" "}pour <span className="font-semibold">{candidat}</span>
                            <span className="text-accent font-semibold"> · +{votes} vote{votes > 1 ? "s" : ""}</span>
                          </p>
                          <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-xs text-foreground/50 mt-1">
                            <span className={`font-bold px-1.5 py-0.5 rounded ${net.cls}`}>{net.label}</span>
                            <span className="truncate max-w-[10rem]">{voterLabel(tx)}</span>
                            <span>·</span>
                            <span>{timeAgo(tx.createdAt)}</span>
                          </div>
                          <p className="font-mono text-[11px] text-foreground/40 mt-0.5">{tx.reference}</p>

                          <div className="flex items-center gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => setModal({ type: "confirm", tx, action: "validate" })}
                              disabled={actionLoading}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-colors disabled:opacity-50"
                            >
                              <Check size={13} />
                              Valider
                            </button>
                            <button
                              type="button"
                              onClick={() => setModal({ type: "confirm", tx, action: "reject" })}
                              disabled={actionLoading}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                            >
                              <X size={13} />
                              Rejeter
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {count > visibleCount && (
              <button
                type="button"
                onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                className="w-full py-3 text-sm font-medium text-primary dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-t border-black/5 dark:border-white/10"
              >
                Afficher {Math.min(PAGE_SIZE, count - visibleCount)} de plus ({count - visibleCount} restant{count - visibleCount > 1 ? "s" : ""})
              </button>
            )}
          </div>

          {/* Pied */}
          <Link
            href="/admin/transactions?status=PENDING"
            onClick={close}
            className="block px-4 py-3 text-center text-sm font-medium text-primary dark:text-white bg-black/[0.03] dark:bg-white/5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors border-t border-black/5 dark:border-white/10"
          >
            Voir toutes les transactions en attente
          </Link>
        </div>
      )}

      {/* Portail : la fenêtre recouvre toute la page, menu latéral compris */}
      {modal?.type === "confirm" && createPortal(
        <AdminModal
          type={modal.action === "validate" ? "success" : "danger"}
          title={modal.action === "validate" ? "Valider le paiement" : "Rejeter le paiement"}
          message={
            modal.action === "validate"
              ? `Valider le paiement de ${modal.tx.amount.toLocaleString("fr-FR")} FCFA (${modal.tx.reference}) pour « ${modal.tx.items[0]?.participant?.name?.trim() ?? "?"} » ? Les votes seront ajoutés au classement.`
              : `Rejeter le paiement de ${modal.tx.amount.toLocaleString("fr-FR")} FCFA (${modal.tx.reference}) ? Aucun vote ne sera ajouté.`
          }
          confirmLabel={modal.action === "validate" ? "Oui, valider" : "Oui, rejeter"}
          loading={actionLoading}
          onConfirm={executeAction}
          onClose={() => !actionLoading && setModal(null)}
        />,
        document.body
      )}

      {modal?.type === "error" && createPortal(
        <AdminModal
          type="danger"
          title="Erreur"
          message={modal.message}
          confirmLabel="OK"
          onClose={() => setModal(null)}
        />,
        document.body
      )}
    </div>
  );
}
