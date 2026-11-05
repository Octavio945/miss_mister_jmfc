"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Bell, X, Loader2, RefreshCw, Inbox, CheckCircle2 } from "lucide-react";

// Paiement confirmé par FedaPay : les votes sont déjà ajoutés, la cloche ne fait qu'informer
interface Payment {
  id: string;
  reference: string;
  amount: number;
  paymentMethod: string | null;
  paidAt: string | null;
  createdAt: string;
  voter: { name: string | null; phone: string | null; isAnonymous: boolean; anonCode: string | null } | null;
  items: { numberOfVotes: number; participant: { name: string } }[];
}

const POLL_MS = 30_000;
const PAGE_SIZE = 20;
// Date de la dernière ouverture de la cloche : les paiements plus récents sont « nouveaux »
const LAST_SEEN_KEY = "admin-notifications-last-seen";

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

function voterLabel(tx: Payment): string {
  if (tx.voter?.isAnonymous) return `Anonyme (${tx.voter.anonCode ?? ""})`;
  return tx.voter?.name || tx.voter?.phone || "Votant inconnu";
}

function methodLabel(method: string | null): string | null {
  if (!method) return null;
  const value = method.toLowerCase();
  if (value.includes("mtn")) return "MTN";
  if (value.includes("moov")) return "Moov";
  if (value.includes("celti")) return "Celtiis";
  return method.replace(/_/g, " ").toUpperCase();
}

const paidTime = (tx: Payment) => new Date(tx.paidAt ?? tx.createdAt).getTime();

export default function NotificationBell() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [lastSeen, setLastSeen] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchPayments = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setPayments((data.payments ?? []) as Payment[]);
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
    fetchPayments();
    const interval = setInterval(fetchPayments, POLL_MS);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchPayments]);

  // Fermeture au clic extérieur et avec Échap
  useEffect(() => {
    if (!open) return;
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
  }, [open]);

  const unreadCount = payments.filter((tx) => paidTime(tx) > lastSeen).length;

  const markSeen = () => {
    try {
      localStorage.setItem(LAST_SEEN_KEY, String(Date.now()));
    } catch {
      // Stockage indisponible (navigation privée) : pas grave
    }
  };

  const toggle = () => {
    if (open) {
      close();
      return;
    }
    setOpen(true);
    setVisibleCount(PAGE_SIZE);
    fetchPayments();
    // Marquer comme vus ; les surlignages « nouveau » restent visibles pendant cette ouverture
    markSeen();
  };

  const close = () => {
    setOpen(false);
    setLastSeen(readLastSeen());
  };

  const count = payments.length;
  const badge = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={unreadCount > 0 ? `Notifications : ${unreadCount} nouveau${unreadCount > 1 ? "x" : ""} paiement${unreadCount > 1 ? "s" : ""}` : "Notifications"}
        className={`relative p-2.5 rounded-full transition-colors ${
          open ? "bg-primary/10 text-primary dark:text-white" : "text-foreground/70 hover:bg-black/5 dark:hover:bg-white/10"
        }`}
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <>
            <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none flex items-center justify-center ring-2 ring-white dark:ring-[#111]">
              {badge}
            </span>
            {!open && (
              <span className="absolute top-0.5 right-0.5 w-[18px] h-[18px] rounded-full bg-red-500/60 animate-ping motion-reduce:hidden" aria-hidden />
            )}
          </>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Paiements reçus"
          className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[26rem] z-50 bg-white dark:bg-[#111] rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* En-tête */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-black/5 dark:border-white/10">
            <div>
              <p className="font-bold text-primary dark:text-white">Paiements reçus</p>
              <p className="text-xs text-foreground/50">
                {unreadCount > 0
                  ? `${unreadCount} nouveau${unreadCount > 1 ? "x" : ""} · votes ajoutés automatiquement`
                  : "Votes ajoutés automatiquement par FedaPay"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={fetchPayments}
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
                <p className="text-sm font-medium">Aucun paiement reçu pour le moment</p>
                <p className="text-xs mt-1">Chaque paiement confirmé apparaîtra ici.</p>
              </div>
            ) : (
              <ul className="divide-y divide-black/5 dark:divide-white/5">
                {payments.slice(0, visibleCount).map((tx) => {
                  const votes = tx.items.reduce((sum, item) => sum + item.numberOfVotes, 0);
                  const candidat = tx.items[0]?.participant?.name?.trim() ?? "Candidat inconnu";
                  const method = methodLabel(tx.paymentMethod);
                  const isNew = paidTime(tx) > lastSeen;

                  return (
                    <li key={tx.id} className={`px-4 py-3 ${isNew ? "bg-accent/5" : ""}`}>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 size={16} className={`mt-0.5 flex-shrink-0 ${isNew ? "text-green-500" : "text-foreground/25"}`} aria-hidden />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-foreground/80">
                            <span className="font-bold text-primary dark:text-white">{tx.amount.toLocaleString("fr-FR")} FCFA</span>
                            {" "}pour <span className="font-semibold">{candidat}</span>
                            <span className="text-accent font-semibold"> · +{votes} vote{votes > 1 ? "s" : ""}</span>
                          </p>
                          <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-xs text-foreground/50 mt-1">
                            {method && (
                              <span className="font-bold px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-foreground/70">{method}</span>
                            )}
                            <span className="truncate max-w-[10rem]">{voterLabel(tx)}</span>
                            <span>·</span>
                            <span>{timeAgo(tx.paidAt ?? tx.createdAt)}</span>
                          </div>
                          <p className="font-mono text-[11px] text-foreground/40 mt-0.5">{tx.reference}</p>
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
                Afficher {Math.min(PAGE_SIZE, count - visibleCount)} de plus
              </button>
            )}
          </div>

          {/* Pied */}
          <Link
            href="/admin/transactions"
            onClick={close}
            className="block px-4 py-3 text-center text-sm font-medium text-primary dark:text-white bg-black/[0.03] dark:bg-white/5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors border-t border-black/5 dark:border-white/10"
          >
            Voir toutes les transactions
          </Link>
        </div>
      )}
    </div>
  );
}
