"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  XCircle,
  Loader2,
} from "lucide-react";

type PaymentStatus = "checking" | "success" | "failed";

export default function CheckoutPage() {
  const searchParams = useSearchParams();

  const participantId   = searchParams.get("participantId") ?? "";
  const participantName = searchParams.get("participantName") ?? "Candidat";
  const voteCount       = Number(searchParams.get("voteCount") ?? 1);
  const anonCode        = searchParams.get("anonCode") ?? "";
  const amount          = Number(searchParams.get("amount") ?? 0);
  const initialRef      = searchParams.get("ref") ?? "";
  const returning       = searchParams.get("returning") === "1";

  const [status, setStatus] = useState<PaymentStatus>("checking");
  const [pollMessage, setPollMessage] = useState("Vérification de votre paiement en cours…");

  const checkStatus = async (ref: string): Promise<string | null> => {
    try {
      const res  = await fetch(`/api/checkout/status?ref=${ref}`);
      const data = await res.json();
      return data.status ?? null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (!initialRef || !returning) return;

    let attempts = 0;
    const maxAttempts = 60;
    const interval = 3000;

    const poll = async () => {
      if (attempts === 0) {
        await new Promise((r) => setTimeout(r, 2000));
      }

      const result = await checkStatus(initialRef);

      if (result === "SUCCESS") {
        setStatus("success");
        return;
      }

      if (result === "FAILED") {
        setStatus("failed");
        return;
      }

      attempts++;
      if (attempts < maxAttempts) {
        const remaining = Math.round(((maxAttempts - attempts) * interval) / 1000);
        setPollMessage(`Vérification en cours… (encore ~${remaining}s)`);
        setTimeout(poll, interval);
      } else {
        setStatus("failed");
      }
    };

    poll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Paramètres manquants
  if (!initialRef || !returning) {
    return (
      <div className="pt-24 pb-20 bg-background min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <XCircle size={64} className="mx-auto text-red-400" />
          <h1 className="text-2xl font-bold">Session invalide</h1>
          <p className="text-foreground/60">Informations de paiement manquantes.</p>
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

  // Écran de vérification (polling)
  if (status === "checking") {
    return (
      <div className="pt-24 pb-20 bg-background min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center px-6 space-y-6">
          <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mx-auto shadow-lg">
            <Loader2 size={48} className="text-blue-500 animate-spin" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-primary dark:text-white">
            Confirmation en cours…
          </h1>
          <p className="text-foreground/70">{pollMessage}</p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 text-sm text-blue-700 dark:text-blue-300 flex items-start space-x-3">
            <ShieldCheck size={20} className="flex-shrink-0 mt-0.5" />
            <p>Ne fermez pas cette page. Nous attendons la confirmation de CinetPay.</p>
          </div>
        </div>
      </div>
    );
  }

  // Écran de succès
  if (status === "success") {
    return (
      <div className="pt-24 pb-20 bg-background min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center px-6 space-y-6">
          <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle2 size={48} className="text-green-500" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-primary dark:text-white">
            Votes confirmés !
          </h1>
          <p className="text-foreground/70">
            <strong>{voteCount} vote{voteCount > 1 ? "s" : ""}</strong> ont été ajoutés à{" "}
            <strong>{participantName}</strong>. Merci pour votre soutien !
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
            Réf: {initialRef}
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

  // Écran d'échec
  return (
    <div className="pt-24 pb-20 bg-background min-h-screen flex items-center justify-center">
      <div className="max-w-md mx-auto text-center px-6 space-y-6">
        <div className="w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
          <XCircle size={48} className="text-red-500" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-primary dark:text-white">
          Paiement non confirmé
        </h1>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-5 text-left space-y-2">
          <p className="font-bold text-red-700 dark:text-red-300 text-sm">Causes possibles :</p>
          <ul className="text-sm text-foreground/70 space-y-1.5 list-disc list-inside">
            <li>Fonds insuffisants sur votre compte Mobile Money</li>
            <li>Paiement annulé ou non confirmé</li>
            <li>Problème réseau temporaire</li>
          </ul>
        </div>
        <p className="text-sm text-foreground/50">
          Aucun vote n&apos;a été débité. Vous pouvez réessayer librement.
        </p>
        <Link
          href={participantId ? `/participants/${participantId}` : "/participants"}
          className="inline-flex items-center justify-center space-x-2 px-8 py-4 rounded-full bg-primary text-white hover:bg-primary/90 font-medium transition-all hover:-translate-y-0.5 shadow-lg"
        >
          <span>Réessayer</span>
        </Link>
      </div>
    </div>
  );
}
