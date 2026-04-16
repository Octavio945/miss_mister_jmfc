"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Script from "next/script";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  Clock,
  XCircle,
  Loader2,
  AlertCircle,
  WifiOff,
  Ban,
  SmartphoneNfc,
  RefreshCw,
} from "lucide-react";

type PaymentStatus = "waiting" | "success" | "failed";

interface PaymentError {
  message: string;
  detail: string;
  icon: "ban" | "wifi" | "phone" | "alert" | "cancel";
  canRetry: boolean;
}

// ── Traduit les codes d'erreur FedaPay/opérateur en messages lisibles ────────
function getPaymentError(result: any): PaymentError {
  const raw      = result?.transaction?.last_error_code ?? "";
  const code     = String(raw).toLowerCase();
  const status   = String(result?.transaction?.status ?? "").toLowerCase();
  const reason   = String(result?.reason ?? "").toLowerCase();

  // Utilisateur a fermé la popup
  if (reason === "dialog dismissed") {
    return {
      message: "Paiement annulé",
      detail: "Vous avez fermé la fenêtre de paiement. Cliquez sur le bouton pour réessayer.",
      icon: "cancel",
      canRetry: true,
    };
  }

  // Fonds insuffisants
  if (code.includes("insufficient") || code.includes("balance") || code.includes("solde") || code.includes("fonds")) {
    return {
      message: "Fonds insuffisants",
      detail: "Votre solde Mobile Money est insuffisant pour cette opération. Rechargez votre compte et réessayez.",
      icon: "ban",
      canRetry: true,
    };
  }

  // Non autorisé / opération refusée par l'opérateur
  if (code.includes("unauthorized") || code.includes("not_authorized") || code.includes("autorisation") || code.includes("forbidden")) {
    return {
      message: "Opération non autorisée",
      detail: "Votre opérateur (MTN/Moov) a refusé l'opération. Vérifiez que le service Mobile Money est activé sur votre numéro ou contactez votre opérateur.",
      icon: "ban",
      canRetry: true,
    };
  }

  // Problème réseau / timeout
  if (code.includes("network") || code.includes("timeout") || code.includes("reseau") || code.includes("connection") || code.includes("unavailable")) {
    return {
      message: "Problème de réseau",
      detail: "Une erreur réseau est survenue. Vérifiez votre connexion internet et réessayez dans quelques instants.",
      icon: "wifi",
      canRetry: true,
    };
  }

  // Numéro invalide ou non enregistré
  if (code.includes("invalid_phone") || code.includes("phone") || code.includes("numero") || code.includes("subscriber")) {
    return {
      message: "Numéro invalide",
      detail: "Le numéro de téléphone est invalide ou n'est pas enregistré sur Mobile Money. Vérifiez et réessayez.",
      icon: "phone",
      canRetry: true,
    };
  }

  // Annulé (pas de confirmation sur le téléphone)
  if (code.includes("cancel") || status === "canceled") {
    return {
      message: "Paiement non confirmé",
      detail: "Vous n'avez pas confirmé la notification sur votre téléphone. Réessayez et approuvez rapidement la demande MTN/Moov.",
      icon: "phone",
      canRetry: true,
    };
  }

  // Refusé par l'opérateur
  if (code.includes("declined") || code.includes("refused") || status === "declined") {
    return {
      message: "Paiement refusé",
      detail: "Votre opérateur a refusé le paiement. Vérifiez votre compte Mobile Money ou essayez avec un autre numéro.",
      icon: "ban",
      canRetry: true,
    };
  }

  // Expiré (délai dépassé pour confirmer)
  if (code.includes("expired") || code.includes("expire")) {
    return {
      message: "Délai expiré",
      detail: "Le délai de confirmation a expiré. Réessayez et approuvez rapidement la notification envoyée sur votre téléphone.",
      icon: "phone",
      canRetry: true,
    };
  }

  // PIN incorrect
  if (code.includes("pin") || code.includes("password") || code.includes("wrong_pin")) {
    return {
      message: "Code PIN incorrect",
      detail: "Le code PIN Mobile Money saisi est incorrect. Réessayez avec le bon code PIN.",
      icon: "ban",
      canRetry: true,
    };
  }

  // Limite dépassée (plafond journalier/mensuel)
  if (code.includes("limit") || code.includes("plafond") || code.includes("quota")) {
    return {
      message: "Plafond dépassé",
      detail: "Vous avez atteint votre plafond Mobile Money pour aujourd'hui. Réessayez demain ou utilisez un autre numéro.",
      icon: "ban",
      canRetry: false,
    };
  }

  // Erreur générique avec code si disponible
  return {
    message: "Paiement échoué",
    detail: raw
      ? `Erreur opérateur : ${raw}. Vérifiez votre solde Mobile Money et réessayez.`
      : "Le paiement n'a pas abouti. Vérifiez votre solde Mobile Money et réessayez, ou utilisez un autre numéro.",
    icon: "alert",
    canRetry: true,
  };
}

declare global {
  interface Window {
    FedaPay?: {
      init: (config: any) => { open: () => void };
    };
  }
}

export default function CheckoutPage() {
  const searchParams = useSearchParams();

  // Récupérer les paramètres de l'URL
  const participantId   = searchParams.get("participantId") ?? "";
  const participantName = searchParams.get("participantName") ?? "Candidat";
  const voteCount       = Number(searchParams.get("voteCount") ?? 1);
  const anonCode        = searchParams.get("anonCode") ?? "";
  const amount          = Number(searchParams.get("amount") ?? 0);
  const initialRef      = searchParams.get("ref") ?? "";

  // États
  const [status, setStatus]           = useState<PaymentStatus>("waiting");
  const [sdkReady, setSdkReady]       = useState(false);
  const [isLoading, setIsLoading]     = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [paymentError, setPaymentError] = useState<PaymentError | null>(null);

  // ── Vérifie le statut d'une transaction dans notre BDD ──────────────────
  const checkTransactionStatus = async (ref: string): Promise<string | null> => {
    try {
      console.log("🔍 Vérification du statut pour:", ref);
      const res  = await fetch(`/api/checkout/status?ref=${ref}`);
      const data = await res.json();
      console.log("📊 Statut reçu:", data.status);

      if (data.status === "SUCCESS") { setStatus("success"); return "success"; }
      if (data.status === "FAILED")  { setStatus("failed");  return "failed";  }
      return data.status; // "PENDING"
    } catch (err) {
      console.error("Erreur vérification statut:", err);
      return null;
    }
  };

  // ── Polling : attend la confirmation du webhook ──────────────────────────
  // FIX Bug 3 : délai initial de 2s + 60 tentatives (3 min) au lieu de 90s
  const startPolling = (ref: string) => {
    console.log("🔄 Démarrage du polling pour:", ref);
    let attempts = 0;
    const maxAttempts = 60;   // 60 × 3 s = 3 minutes
    const interval    = 3000;

    const poll = async () => {
      // Délai initial : laisse le temps au webhook d'arriver avant le 1er check
      if (attempts === 0) {
        await new Promise((r) => setTimeout(r, 2000));
      }

      const result = await checkTransactionStatus(ref);

      if (result === "success" || result === "failed") {
        console.log("✅ Polling terminé, résultat:", result);
        setIsLoading(false);
        return;
      }

      attempts++;
      if (attempts < maxAttempts) {
        console.log(`⏳ Tentative ${attempts}/${maxAttempts}...`);
        setTimeout(poll, interval);
      } else {
        console.log("⏰ Délai dépassé — paiement non confirmé après 3 min");
        setStatus("failed");
        setIsLoading(false);
      }
    };

    poll();
  };

  // ── Lance le popup FedaPay ───────────────────────────────────────────────
  // FIX Bug 2 : le fedapayId est récupéré depuis /api/checkout/init-popup
  // FIX Bug 4 : plus de vérification !fedapayId côté client
  const initPayment = async () => {
    if (!participantId || amount === 0) {
      setErrorMessage("Informations de paiement invalides.");
      return;
    }

    if (!window.FedaPay) {
      setErrorMessage("SDK FedaPay non chargé, veuillez rafraîchir la page.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setPaymentError(null);

    try {
      // Récupérer le fedapayId côté serveur via la référence
      console.log("🔑 Récupération de la session FedaPay...");
      const initRes  = await fetch(`/api/checkout/init-popup?ref=${initialRef}`);
      const initData = await initRes.json();

      if (!initRes.ok) {
        setErrorMessage(initData.error || "Session de paiement introuvable.");
        setIsLoading(false);
        return;
      }

      const fedapayId: number = initData.fedapayId;
      console.log("🚀 Ouverture du popup FedaPay avec l'ID:", fedapayId);

      const publicKey = process.env.NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY || "";
      const isSandbox = publicKey.includes("sandbox");

      const instance = window.FedaPay.init({
        public_key: publicKey,
        environment: isSandbox ? "sandbox" : "live",
        transaction: {
          id: fedapayId,
        },
        onComplete: function (result: any) {
          console.log("🏁 FedaPay terminé:", result);

          if (result.transaction?.status === "approved") {
            console.log("✅ Paiement approuvé, démarrage du polling...");
            setPaymentError(null);
            startPolling(initialRef);
          } else {
            console.log("❌ Paiement non abouti:", result);
            const err = getPaymentError(result);
            setPaymentError(err);
            setIsLoading(false);
            // On ne passe PAS en status "failed" — l'utilisateur peut réessayer
          }
        },
      });

      instance.open();
    } catch (err: any) {
      console.error("💥 Erreur:", err);
      setErrorMessage(err.message || "Une erreur est survenue.");
      setIsLoading(false);
    }
  };

  // ── Au chargement : vérifier si la transaction est déjà réglée ──────────
  // (cas où l'utilisateur revient après avoir fermé l'onglet)
  useEffect(() => {
    if (initialRef) {
      checkTransactionStatus(initialRef).then((result) => {
        if (result === "success") setStatus("success");
        // si PENDING on ne fait rien — l'utilisateur doit cliquer sur "Payer"
      });
    }

    // ✅ FIX Bug Loader Infini : Si le SDK est déjà chargé par une visite précédente,
    // on le marked comme prêt immédiatement sans attendre l'événement onLoad du Script Next.js
    if (typeof window !== "undefined" && window.FedaPay) {
      console.log("⚡ SDK FedaPay déjà présent dans window, prêt immédiatement.");
      setSdkReady(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Écran d'erreur — paramètres manquants ────────────────────────────────
  // FIX Bug 4 : condition simplifiée, fedapayId n'est plus vérifié ici
  if (!participantId || amount === 0 || !initialRef) {
    return (
      <div className="pt-24 pb-20 bg-background min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <XCircle size={64} className="mx-auto text-red-400" />
          <h1 className="text-2xl font-bold">Session invalide</h1>
          <p className="text-foreground/60">
            Informations de paiement manquantes.
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

  // ── Écran de succès ──────────────────────────────────────────────────────
  if (status === "success") {
    return (
      <div className="pt-24 pb-20 bg-background min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center px-6 space-y-6">
          <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle2 size={48} className="text-green-500" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-primary dark:text-white">
            Votes confirmés ! 🎉
          </h1>
          <p className="text-foreground/70">
            <strong>{voteCount} vote{voteCount > 1 ? "s" : ""}</strong> ont été
            ajoutés à <strong>{participantName}</strong>. Merci pour votre soutien !
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

  // ── Écran d'échec (timeout polling ou erreur définitive) ─────────────────
  if (status === "failed") {
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
            <p className="font-bold text-red-700 dark:text-red-300 text-sm">Que s&apos;est-il passé ?</p>
            <ul className="text-sm text-foreground/70 space-y-1.5 list-disc list-inside">
              <li>Fonds insuffisants sur votre compte Mobile Money</li>
              <li>Vous n&apos;avez pas confirmé la notification sur votre téléphone</li>
              <li>Opération non autorisée par l&apos;opérateur (MTN/Moov)</li>
              <li>Problème réseau temporaire</li>
            </ul>
          </div>
          <p className="text-sm text-foreground/50">
            Aucun vote n&apos;a été débité. Vous pouvez réessayer librement.
          </p>
          <Link
            href={`/participants/${participantId}`}
            className="inline-flex items-center justify-center space-x-2 px-8 py-4 rounded-full bg-primary text-white hover:bg-primary/90 font-medium transition-all hover:-translate-y-0.5 shadow-lg"
          >
            <RefreshCw size={16} />
            <span>Réessayer</span>
          </Link>
        </div>
      </div>
    );
  }

  // ── Écran principal de paiement ──────────────────────────────────────────
  return (
    <>
      <Script
        src="https://cdn.fedapay.com/checkout.js?v=1.1.7"
        strategy="afterInteractive"
        onLoad={() => {
          console.log("✅ SDK FedaPay chargé");
          setSdkReady(true);
        }}
        onError={() => {
          console.error("❌ Erreur chargement SDK FedaPay");
          setErrorMessage("Impossible de charger le système de paiement. Veuillez rafraîchir.");
        }}
      />

      <div className="pt-24 pb-20 bg-background min-h-screen">
        <div className="max-w-2xl mx-auto px-6">
          {/* Lien retour */}
          <Link
            href={participantId ? `/participants/${participantId}` : "/participants"}
            className="inline-flex items-center space-x-2 text-foreground/60 hover:text-accent font-medium mb-10 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Retour au profil</span>
          </Link>

          {/* Titre */}
          <div className="mb-10">
            <h1 className="text-4xl font-serif font-bold text-primary dark:text-white mb-3">
              Finalisation du Vote
            </h1>
            <p className="text-foreground/70">
              Procédez au paiement Mobile Money pour valider vos votes.
            </p>
          </div>

          {/* Carte de paiement */}
          <div className="bg-white dark:bg-[#111] rounded-3xl border border-black/5 dark:border-white/10 shadow-xl overflow-hidden mb-6">
            {/* Résumé */}
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
                  <span className="font-semibold text-white">
                    {voteCount > 0 ? Math.round(amount / voteCount).toLocaleString() : 0} FCFA
                  </span>
                </div>
                <div className="border-t border-white/20 pt-3 flex justify-between text-2xl font-bold">
                  <span>Total</span>
                  <span className="text-accent">{amount.toLocaleString()} FCFA</span>
                </div>
              </div>
            </div>

            {/* Infos et bouton */}
            <div className="p-8 space-y-4">
              <div className="flex items-start space-x-4 bg-primary/5 dark:bg-white/5 rounded-2xl p-5 border border-primary/10 dark:border-white/10">
                <Clock className="text-accent flex-shrink-0 mt-0.5" size={22} />
                <div>
                  <h4 className="font-bold text-primary dark:text-white">
                    Paiement sécurisé
                  </h4>
                  <p className="text-sm text-foreground/70 mt-1">
                    Cliquez sur le bouton ci-dessous pour ouvrir le formulaire de paiement.
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

              {/* Erreur SDK / réseau interne */}
              {errorMessage && !paymentError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start space-x-3">
                  <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-600 dark:text-red-400 text-sm">{errorMessage}</p>
                </div>
              )}

              {/* Carte d'erreur détaillée (erreurs opérateur) */}
              {paymentError && (
                <div className="rounded-2xl border overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                  {/* En-tête coloré selon le type */}
                  <div className={`flex items-center space-x-3 px-5 py-4 ${
                    paymentError.icon === "wifi"
                      ? "bg-orange-50 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-800"
                      : paymentError.icon === "cancel"
                      ? "bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800"
                      : "bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800"
                  }`}>
                    {paymentError.icon === "wifi"   && <WifiOff size={20} className="text-orange-500 flex-shrink-0" />}
                    {paymentError.icon === "phone"  && <SmartphoneNfc size={20} className="text-red-500 flex-shrink-0" />}
                    {paymentError.icon === "ban"    && <Ban size={20} className="text-red-500 flex-shrink-0" />}
                    {paymentError.icon === "cancel" && <XCircle size={20} className="text-yellow-500 flex-shrink-0" />}
                    {paymentError.icon === "alert"  && <AlertCircle size={20} className="text-red-500 flex-shrink-0" />}
                    <p className={`font-bold text-sm ${
                      paymentError.icon === "wifi"
                        ? "text-orange-700 dark:text-orange-300"
                        : paymentError.icon === "cancel"
                        ? "text-yellow-700 dark:text-yellow-300"
                        : "text-red-700 dark:text-red-300"
                    }`}>
                      {paymentError.message}
                    </p>
                  </div>
                  {/* Détail et action */}
                  <div className="bg-white dark:bg-[#1a1a1a] px-5 py-4 space-y-3">
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      {paymentError.detail}
                    </p>
                    {paymentError.canRetry && (
                      <button
                        onClick={() => { setPaymentError(null); initPayment(); }}
                        className="w-full py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary dark:text-white font-medium text-sm flex items-center justify-center space-x-2 transition-colors"
                      >
                        <RefreshCw size={15} />
                        <span>Réessayer le paiement</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Indicateur de polling en cours */}
              {isLoading && !paymentError && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center space-x-3">
                  <Loader2 size={18} className="animate-spin text-blue-500 flex-shrink-0" />
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    Vérification du paiement en cours… Cela peut prendre jusqu&apos;à 3 minutes.
                  </p>
                </div>
              )}

              {/* Bouton de paiement */}
              <div className="border-t border-black/5 dark:border-white/10 pt-4 space-y-3">
                <button
                  onClick={initPayment}
                  disabled={!sdkReady || isLoading}
                  className="w-full py-4 rounded-full bg-accent text-primary font-bold text-lg hover:bg-accent/90 transition-all flex items-center justify-center space-x-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {!sdkReady ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span>Chargement du paiement...</span>
                    </>
                  ) : isLoading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span>Vérification en cours...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard size={18} />
                      <span>Payer {amount.toLocaleString()} FCFA</span>
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-foreground/40">
                  Paiement 100% sécurisé via FedaPay · MTN · Moov
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}