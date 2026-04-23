"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  MessageCircle,
} from "lucide-react";

type PageStatus = "waiting" | "success" | "failed";

export default function CheckoutPage() {
  const searchParams = useSearchParams();

  const participantId   = searchParams.get("participantId") ?? "";
  const participantName = searchParams.get("participantName") ?? "Candidat";
  const voteCount       = Number(searchParams.get("voteCount") ?? 1);
  const anonCode        = searchParams.get("anonCode") ?? "";
  const amount          = Number(searchParams.get("amount") ?? 0);
  const initialRef      = searchParams.get("ref") ?? "";
  const network         = searchParams.get("network") ?? "";

  const [pageStatus, setPageStatus] = useState<PageStatus>("waiting");

  const checkStatus = async (): Promise<string | null> => {
    try {
      const res  = await fetch(`/api/checkout/status?ref=${initialRef}`);
      const data = await res.json();
      return data.status ?? null;
    } catch {
      return null;
    }
  };

  // Polling toutes les 5s — attend la validation de l'admin
  useEffect(() => {
    if (!initialRef) return;

    const poll = async () => {
      const result = await checkStatus();
      if (result === "SUCCESS") { setPageStatus("success"); return; }
      if (result === "FAILED")  { setPageStatus("failed");  return; }
      setTimeout(poll, 5000);
    };

    // Premier check après 3s, puis toutes les 5s
    const timer = setTimeout(poll, 3000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!initialRef) {
    return (
      <div className="pt-24 pb-20 bg-background min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <XCircle size={64} className="mx-auto text-red-400" />
          <h1 className="text-2xl font-bold">Session invalide</h1>
          <p className="text-foreground/60">Informations de paiement manquantes.</p>
          <Link href="/participants" className="inline-flex items-center space-x-2 text-primary hover:underline font-medium">
            <ArrowLeft size={16} />
            <span>Retour aux candidats</span>
          </Link>
        </div>
      </div>
    );
  }

  // ── Succès ────────────────────────────────────────────────────────────────
  if (pageStatus === "success") {
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
            <strong>{voteCount} vote{voteCount > 1 ? "s" : ""}</strong> ont été ajoutés pour{" "}
            <strong>{participantName}</strong>. Merci pour votre soutien !
          </p>
          {anonCode && (
            <div className="bg-accent/10 border border-accent/30 rounded-xl px-6 py-4">
              <p className="text-sm text-foreground/60 mb-1">Votre code anonyme</p>
              <p className="font-mono font-bold text-xl text-primary dark:text-white tracking-widest">
                {anonCode}
              </p>
              <p className="text-xs text-foreground/50 mt-1">Conservez ce code pour prouver votre vote.</p>
            </div>
          )}
          <div className="bg-black/5 dark:bg-white/5 rounded-xl px-6 py-3 text-sm text-foreground/50 font-mono">
            Réf : {initialRef}
          </div>
          <Link
            href="/participants"
            className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-primary text-white hover:bg-primary/90 font-medium transition-all hover:-translate-y-0.5 shadow-lg"
          >
            Voir tous les candidats
          </Link>
        </div>
      </div>
    );
  }

  // ── Échec / Rejet ─────────────────────────────────────────────────────────
  if (pageStatus === "failed") {
    return (
      <div className="pt-24 pb-20 bg-background min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center px-6 space-y-6">
          <div className="w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
            <XCircle size={48} className="text-red-500" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-primary dark:text-white">
            Paiement non validé
          </h1>
          <p className="text-foreground/70">
            Votre paiement n&apos;a pas pu être confirmé. Aucun vote n&apos;a été débité.
          </p>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-5 text-left text-sm text-foreground/70 space-y-1">
            <p className="font-bold text-red-700 dark:text-red-300 mb-2">Que faire ?</p>
            <ul className="list-disc list-inside space-y-1.5">
              <li>Vérifiez que vous avez bien envoyé le montant exact</li>
              <li>Vérifiez que la bonne référence était en description</li>
              <li>Contactez l&apos;admin sur WhatsApp si nécessaire</li>
            </ul>
          </div>
          <Link
            href={participantId ? `/participants/${participantId}` : "/participants"}
            className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-primary text-white hover:bg-primary/90 font-medium transition-all hover:-translate-y-0.5 shadow-lg"
          >
            Réessayer
          </Link>
        </div>
      </div>
    );
  }

  // ── En attente de validation admin ────────────────────────────────────────
  const networkLabel = network === "MTN" ? "MTN Bénin" : network === "CELTIS" ? "Celtis Bénin" : network;
  const whatsappNumber = "22959131586";
  const whatsappMsg = encodeURIComponent(
    `Bonjour, j'ai envoyé ${amount.toLocaleString()} FCFA via ${networkLabel} pour ${voteCount} vote${voteCount > 1 ? "s" : ""} pour ${participantName}.\n\nRéférence : ${initialRef}\n\nMerci de valider mon vote.`
  );

  return (
    <div className="pt-24 pb-20 bg-background min-h-screen flex items-center justify-center">
      <div className="max-w-md mx-auto px-6 space-y-6">

        <div className="text-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto shadow-lg">
            <Clock size={48} className="text-orange-500" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-primary dark:text-white">
            En attente de validation
          </h1>
          <p className="text-foreground/70">
            L&apos;admin va vérifier votre paiement et valider vos votes sous peu.
          </p>
        </div>

        {/* Résumé */}
        <div className="bg-white dark:bg-[#111] rounded-2xl border border-black/5 dark:border-white/10 p-5 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-foreground/60">Candidat</span>
            <span className="font-bold">{participantName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground/60">Votes</span>
            <span className="font-bold">{voteCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground/60">Montant</span>
            <span className="font-bold">{amount.toLocaleString()} FCFA</span>
          </div>
          {networkLabel && (
            <div className="flex justify-between">
              <span className="text-foreground/60">Réseau</span>
              <span className="font-bold">{networkLabel}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-black/5 dark:border-white/10">
            <span className="text-foreground/60">Référence</span>
            <span className="font-mono font-bold text-primary dark:text-white text-xs">{initialRef}</span>
          </div>
        </div>

        {/* Polling indicator */}
        <div className="flex items-center space-x-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-4 text-sm text-orange-700 dark:text-orange-300">
          <Loader2 size={18} className="animate-spin flex-shrink-0" />
          <p>Cette page se met à jour automatiquement. Ne la fermez pas.</p>
        </div>

        {/* Contact WhatsApp si besoin */}
        <a
          href={`https://wa.me/${whatsappNumber}?text=${whatsappMsg}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center space-x-2 py-3 rounded-full border-2 border-green-500 text-green-600 dark:text-green-400 font-medium hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
        >
          <MessageCircle size={18} />
          <span>Contacter l&apos;admin sur WhatsApp</span>
        </a>

      </div>
    </div>
  );
}
