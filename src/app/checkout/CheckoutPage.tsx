"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Clock,
  XCircle,
  Loader2,
} from "lucide-react";

type PaymentStatus = "waiting" | "success" | "failed";

export default function CheckoutPage() {
  const searchParams = useSearchParams();

  const reference = searchParams.get("ref") ?? "";
  const amount = Number(searchParams.get("amount") ?? 0);
  const participantId = searchParams.get("participantId") ?? "";
  const participantName = searchParams.get("participantName") ?? "Candidat";
  const voteCount = Number(searchParams.get("voteCount") ?? 1);
  const anonCode = searchParams.get("anonCode") ?? "";

  const [status, setStatus] = useState<PaymentStatus>("waiting");
  const [polling, setPolling] = useState(false);

  // ── Simulated polling (replace with real FedaPay payment URL in Phase 2+) ──
  const handleSimulateSuccess = async () => {
    setPolling(true);
    // Simulate a delay like a real payment confirmation
    await new Promise((r) => setTimeout(r, 2000));
    setStatus("success");
    setPolling(false);
  };

  const handleSimulateFail = async () => {
    setPolling(true);
    await new Promise((r) => setTimeout(r, 1000));
    setStatus("failed");
    setPolling(false);
  };

  if (!reference) {
    return (
      <div className="pt-24 pb-20 bg-background min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <XCircle size={64} className="mx-auto text-red-400" />
          <h1 className="text-2xl font-bold">Session invalide</h1>
          <p className="text-foreground/60">
            Votre session de paiement est expirée ou invalide.
          </p>
          <Link
            href="/participants"
            className="inline-flex items-center space-x-2 text-primary hover:underline font-medium"
          >
            <ArrowLeft size={16} />
            <span>Retour aux candidats</span>
          </Link>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="pt-24 pb-20 bg-background min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center px-6 space-y-6">
          <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mx-auto">
            <CheckCircle2 size={48} className="text-green-500" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-primary dark:text-white">
            Votes confirmés !
          </h1>
          <p className="text-foreground/70">
            <strong>{voteCount} vote{voteCount > 1 ? "s" : ""}</strong> ont été
            ajoutés à <strong>{participantName}</strong>.
          </p>
          {anonCode && (
            <div className="bg-accent/10 border border-accent/30 rounded-xl px-6 py-4">
              <p className="text-sm text-foreground/60 mb-1">Votre code anonyme</p>
              <p className="font-mono font-bold text-xl text-primary dark:text-white tracking-widest">
                {anonCode}
              </p>
              <p className="text-xs text-foreground/50 mt-1">
                Conservez ce code pour prouver votre vote si nécessaire.
              </p>
            </div>
          )}
          <div className="bg-black/5 dark:bg-white/5 rounded-xl px-6 py-3 text-sm text-foreground/50 font-mono">
            Réf: {reference}
          </div>
          <Link
            href="/participants"
            className="inline-flex items-center justify-center space-x-2 px-8 py-4 rounded-full bg-primary text-white hover:bg-primary/90 font-medium transition-all hover:-translate-y-0.5 shadow-lg"
          >
            <span>Voir tous les candidats</span>
          </Link>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="pt-24 pb-20 bg-background min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center px-6 space-y-6">
          <div className="w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
            <XCircle size={48} className="text-red-500" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-primary dark:text-white">
            Paiement échoué
          </h1>
          <p className="text-foreground/70">
            Le paiement n&apos;a pas pu être confirmé. Aucun vote n&apos;a été débité.
          </p>
          <Link
            href={`/participants/${participantId}`}
            className="inline-flex items-center justify-center space-x-2 px-8 py-4 rounded-full bg-primary text-white hover:bg-primary/90 font-medium transition-all"
          >
            <ArrowLeft size={16} />
            <span>Réessayer</span>
          </Link>
        </div>
      </div>
    );
  }

  // ── Waiting state ─────────────────────────────────────────────────────────
  return (
    <div className="pt-24 pb-20 bg-background min-h-screen">
      <div className="max-w-2xl mx-auto px-6">

        <Link
          href={participantId ? `/participants/${participantId}` : "/participants"}
          className="inline-flex items-center space-x-2 text-foreground/60 hover:text-accent font-medium mb-10 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Retour au profil</span>
        </Link>

        <div className="mb-10">
          <h1 className="text-4xl font-serif font-bold text-primary dark:text-white mb-3">
            Finalisation du Vote
          </h1>
          <p className="text-foreground/70">
            Procédez au paiement Mobile Money pour valider vos votes.
          </p>
        </div>

        {/* Summary card */}
        <div className="bg-white dark:bg-[#111] rounded-3xl border border-black/5 dark:border-white/10 shadow-xl overflow-hidden mb-6">

          <div className="bg-primary p-8 text-white">
            <h2 className="text-xl font-serif font-bold mb-6 border-b border-white/10 pb-4">
              Résumé de la commande
            </h2>
            <div className="space-y-3 text-white/80">
              <div className="flex justify-between">
                <span>Candidat</span>
                <span className="font-semibold text-white">{participantName}</span>
              </div>
              <div className="flex justify-between">
                <span>Votes</span>
                <span className="font-semibold text-white">× {voteCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Prix unitaire</span>
                <span className="font-semibold text-white">100 FCFA</span>
              </div>
              <div className="border-t border-white/20 pt-3 flex justify-between text-2xl font-bold">
                <span>Total</span>
                <span className="text-accent">{amount.toLocaleString()} FCFA</span>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-4">
            <div className="flex items-start space-x-4 bg-primary/5 dark:bg-white/5 rounded-2xl p-5 border border-primary/10 dark:border-white/10">
              <Clock className="text-accent flex-shrink-0 mt-0.5" size={22} />
              <div>
                <h4 className="font-bold text-primary dark:text-white">
                  En attente de paiement
                </h4>
                <p className="text-sm text-foreground/70 mt-1">
                  Réf: <span className="font-mono text-primary dark:text-white">{reference}</span>
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 bg-accent/5 border border-accent/20 rounded-2xl p-5">
              <ShieldCheck className="text-accent flex-shrink-0 mt-0.5" size={22} />
              <div>
                <h4 className="font-bold">Paiement sécurisé Mobile Money</h4>
                <p className="text-sm text-foreground/70 mt-1">
                  MTN, Moov — via FedaPay
                </p>
              </div>
            </div>

            {/* 
              ─────────────────────────────────────────────────────────────────
              TODO Phase 2+ : Remplacer ces boutons de simulation par le lien
              de paiement FedaPay retourné par /api/checkout (paymentUrl).
              ─────────────────────────────────────────────────────────────────
            */}
            <div className="border-t border-black/5 dark:border-white/10 pt-4 space-y-3">
              <p className="text-xs text-center text-foreground/40 uppercase tracking-widest font-medium">
                Mode démo — à remplacer par FedaPay
              </p>
              <button
                id="simulate-success"
                onClick={handleSimulateSuccess}
                disabled={polling}
                className="w-full py-4 rounded-full bg-accent text-primary font-bold text-lg hover:bg-accent/90 transition-all flex items-center justify-center space-x-2 shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {polling ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    <Lock size={18} />
                    <span>Simuler Paiement Réussi</span>
                  </>
                )}
              </button>
              <button
                id="simulate-fail"
                onClick={handleSimulateFail}
                disabled={polling}
                className="w-full py-3 rounded-full border-2 border-red-300 dark:border-red-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-all disabled:opacity-50"
              >
                Simuler Échec
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
