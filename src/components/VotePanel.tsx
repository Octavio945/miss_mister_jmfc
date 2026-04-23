"use client";

import { useState } from "react";
import {
  Trophy,
  Lock,
  User,
  UserX,
  Phone,
  Mail,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  Copy,
  MessageCircle,
  ArrowLeft,
  Smartphone,
} from "lucide-react";
import type { Participant } from "@prisma/client";

interface Props {
  participant: Participant;
  eventActive: boolean;
  votePrice: number;
}

type PaymentStep = "form" | "instructions";

export default function VotePanel({ participant, eventActive, votePrice }: Props) {
  const [voteCount, setVoteCount] = useState(1);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [network, setNetwork] = useState<"MTN" | "CELTIS" | "">("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  
  const [step, setStep] = useState<PaymentStep>("form");
  const [transaction, setTransaction] = useState<{ reference: string; amount: number; network: string } | null>(null);

  const total = voteCount * votePrice;
  const isTooLow = total > 0 && total < 100;

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("success", "Copié dans le presse-papier !");
  };

  const handleVote = async () => {
    if (!eventActive) return;
    if (!network) {
      showToast("error", "Veuillez choisir un réseau de paiement.");
      return;
    }
    setLoading(true);
    setToast(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: participant.id,
          voteCount,
          isAnonymous,
          voterName: name || null,
          voterPhone: phone || null,
          voterEmail: email || null,
          network,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast("error", data.error ?? "Le service est momentanément indisponible. Veuillez réessayer.");
        return;
      }

      setTransaction({
        reference: data.reference,
        amount: data.amount,
        network: data.network,
      });
      setStep("instructions");
    } catch {
      showToast("error", "La connexion a échoué. Vérifiez votre réseau et réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const confirmOnWhatsApp = async () => {
    if (!transaction) return;
    setLoading(true);

    try {
      // 1. Notifier l'admin via Telegram
      await fetch("/api/checkout/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: transaction.reference }),
      });

      // 2. Ouvrir WhatsApp
      const whatsappNumber = "22959131586";
      const message = `Bonjour, j'ai effectué un paiement Mobile Money pour le concours Miss & Mister JMFC.

📋 Référence : ${transaction.reference}
💰 Montant : ${transaction.amount.toLocaleString()} FCFA
📱 Réseau : ${transaction.network === "MTN" ? "MTN Bénin" : "Celtis Bénin"}
👤 Pour : ${participant.name}

Veuillez valider mon vote. Merci !`;

      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, "_blank");
    } catch (error) {
      console.error("WhatsApp error", error);
    } finally {
      setLoading(false);
    }
  };

  if (step === "instructions" && transaction) {
    const networkNumber = transaction.network === "MTN" ? "0159131586" : "44433058";
    const networkName = transaction.network === "MTN" ? "MTN Bénin" : "Celtis Bénin";

    return (
      <div className="bg-white dark:bg-[#111] p-6 md:p-8 lg:p-10 rounded-3xl shadow-xl border border-black/5 dark:border-white/5 sticky top-24 md:top-32 animate-in fade-in zoom-in-95 duration-300">
        <button 
          onClick={() => setStep("form")}
          className="flex items-center text-sm text-foreground/50 hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft size={16} className="mr-2" />
          Retour
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Smartphone className="text-accent" size={32} />
          </div>
          <h2 className="text-2xl font-serif font-bold">Dernière étape !</h2>
          <p className="text-foreground/60 text-sm mt-1">
            Envoyez les fonds manuellement pour valider vos votes.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-5 border border-black/5 dark:border-white/10">
            <p className="text-xs uppercase tracking-widest text-foreground/40 font-bold mb-1">Envoyez exactement</p>
            <p className="text-2xl font-bold text-primary dark:text-white">{transaction.amount.toLocaleString()} FCFA</p>
            <p className="text-sm text-foreground/60 mt-1">sur le numéro {networkName} :</p>
            <div className="flex items-center justify-between mt-2 bg-white dark:bg-black/40 rounded-xl px-4 py-3 border border-black/5 dark:border-white/10">
              <span className="font-mono font-bold text-lg">{networkNumber}</span>
              <button onClick={() => copyToClipboard(networkNumber)} className="text-primary hover:text-primary/80 transition-colors">
                <Copy size={20} />
              </button>
            </div>
          </div>

          <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-5 border border-black/5 dark:border-white/10">
            <p className="text-xs uppercase tracking-widest text-foreground/40 font-bold mb-1">Référence à mettre en description</p>
            <div className="flex items-center justify-between mt-2 bg-white dark:bg-black/40 rounded-xl px-4 py-3 border border-black/5 dark:border-white/10">
              <span className="font-mono font-bold text-primary dark:text-white">{transaction.reference}</span>
              <button onClick={() => copyToClipboard(transaction.reference)} className="text-primary hover:text-primary/80 transition-colors">
                <Copy size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={confirmOnWhatsApp}
            disabled={loading}
            className="w-full h-14 rounded-full bg-green-600 text-white flex items-center justify-center space-x-2 text-lg font-medium hover:bg-green-700 transition-all hover:-translate-y-0.5 shadow-lg"
          >
            {loading ? <Loader2 className="animate-spin" /> : <><MessageCircle size={22} /> <span>Confirmer sur WhatsApp</span></>}
          </button>
          <p className="text-[10px] text-center text-foreground/40 leading-tight">
            En cliquant, l'admin sera notifié. Envoyez ensuite votre capture d'écran sur WhatsApp pour une validation rapide.
          </p>
        </div>

        {/* Toast */}
        {toast && (
          <div className="mt-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center space-x-2 bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 size={16} />
            <span>{toast.msg}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#111] p-6 md:p-8 lg:p-10 rounded-3xl shadow-xl border border-black/5 dark:border-white/5 sticky top-24 md:top-32">

      {/* Score */}
      <div className="flex items-center justify-between mb-8 pb-8 border-b border-black/5 dark:border-white/10">
        <div>
          <p className="text-sm font-medium text-foreground/50 uppercase tracking-widest mb-1">
            Score Actuel
          </p>
          <div className="flex items-center space-x-3 text-3xl font-serif font-bold">
            <Trophy className="text-accent" size={32} />
            <span id="vote-score">{participant.totalVotes.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {!eventActive ? (
        <div className="text-center py-8 px-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-2xl">
          <p className="font-bold text-red-600 dark:text-red-400">Vote clôturé</p>
          <p className="text-sm text-foreground/60 mt-1">L&apos;événement n&apos;est plus actif.</p>
        </div>
      ) : (
        <>
          {/* Identity toggle */}
          <div className="mb-6">
            <h2 className="text-2xl font-serif font-bold mb-4">
              Voter pour {participant.name.split(" ")[0]}
            </h2>
            <div className="flex space-x-3 mb-6">
              <button
                id="identity-identified"
                onClick={() => setIsAnonymous(false)}
                className={`flex-1 py-3 px-3 rounded-xl font-medium border-2 transition-all flex flex-col items-center justify-center space-y-1 text-sm ${
                  !isAnonymous
                    ? "border-primary bg-primary/5 dark:bg-primary/20 text-primary dark:text-white"
                    : "border-black/5 dark:border-white/10 text-foreground/50 hover:bg-black/5"
                }`}
              >
                <User size={20} className={!isAnonymous ? "text-primary dark:text-white" : ""} />
                <span>S&apos;identifier</span>
              </button>
              <button
                id="identity-anonymous"
                onClick={() => setIsAnonymous(true)}
                className={`flex-1 py-3 px-3 rounded-xl font-medium border-2 transition-all flex flex-col items-center justify-center space-y-1 text-sm ${
                  isAnonymous
                    ? "border-accent bg-accent/5 text-accent"
                    : "border-black/5 dark:border-white/10 text-foreground/50 hover:bg-black/5"
                }`}
              >
                <UserX size={20} className={isAnonymous ? "text-accent" : ""} />
                <span>Anonyme</span>
              </button>
            </div>

            {!isAnonymous ? (
              <div className="space-y-4">
                <input
                  id="voter-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Prénom & Nom (optionnel)"
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <div className="relative">
                  <Phone className="absolute left-4 top-3.5 text-foreground/40" size={18} />
                  <input
                    id="voter-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+229 97 00 00 00"
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-foreground/40" size={18} />
                  <input
                    id="voter-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email (optionnel)"
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-5 px-4 bg-accent/5 border border-accent/20 rounded-2xl">
                <ShieldCheck className="mx-auto text-accent mb-2" size={36} />
                <p className="text-sm text-foreground/70">
                  Un code unique{" "}
                  <span className="font-mono font-bold text-primary dark:text-white bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded">
                    VOTER-XXXX
                  </span>{" "}
                  vous sera attribué.
                </p>
              </div>
            )}
          </div>

          {/* Network Selection */}
          <div className="mb-6 pt-4 border-t border-black/5 dark:border-white/10">
            <p className="text-sm font-medium text-foreground/70 mb-3">Choisissez votre réseau</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setNetwork("MTN")}
                className={`py-3 px-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center space-y-1 ${
                  network === "MTN"
                    ? "border-yellow-400 bg-yellow-400/10 text-yellow-700 dark:text-yellow-400"
                    : "border-black/5 dark:border-white/10 text-foreground/40 hover:bg-black/5"
                }`}
              >
                <div className="w-8 h-8 bg-yellow-400 rounded-full mb-1 flex items-center justify-center font-bold text-black text-[10px]">MTN</div>
                <span className="text-xs font-bold">MTN Bénin</span>
              </button>
              <button
                onClick={() => setNetwork("CELTIS")}
                className={`py-3 px-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center space-y-1 ${
                  network === "CELTIS"
                    ? "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-400"
                    : "border-black/5 dark:border-white/10 text-foreground/40 hover:bg-black/5"
                }`}
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full mb-1 flex items-center justify-center font-bold text-white text-[10px]">C</div>
                <span className="text-xs font-bold">Celtis Bénin</span>
              </button>
            </div>
          </div>

          {/* Vote counter + CTA */}
          <div className="border-t border-black/5 dark:border-white/10 pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-foreground/70 font-medium">Nombre de votes</span>
              <div className="flex items-center space-x-4 bg-black/5 dark:bg-white/5 rounded-full px-2 py-1">
                <button
                  id="vote-minus"
                  onClick={() => setVoteCount(Math.max(1, voteCount - 1))}
                  className="w-8 h-8 rounded-full bg-white dark:bg-black/40 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center font-bold shadow-sm"
                >
                  −
                </button>
                <span className="w-8 text-center font-bold text-lg">{voteCount}</span>
                <button
                  id="vote-plus"
                  onClick={() => setVoteCount(voteCount + 1)}
                  className="w-8 h-8 rounded-full bg-accent text-primary hover:bg-accent/90 flex items-center justify-center font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xl font-bold">
              <span>Total</span>
              <span className={`transition-colors ${isTooLow ? "text-red-500" : "text-accent"}`}>
                {total.toLocaleString()} FCFA
              </span>
            </div>

            {isTooLow && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-xs text-red-600 dark:text-red-400 space-y-1">
                <p className="font-bold">Montant trop faible</p>
                <p>Le montant minimum par vote est de 100 FCFA. Ajoutez quelques votes supplémentaires pour continuer.</p>
              </div>
            )}

            <button
              id="vote-submit"
              onClick={handleVote}
              disabled={loading || isTooLow}
              className="w-full h-14 rounded-full bg-primary text-white flex items-center justify-center space-x-2 text-lg font-medium hover:bg-primary/90 transition-all hover:-translate-y-0.5 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <Loader2 size={22} className="animate-spin" />
              ) : (
                <>
                  <Lock size={18} />
                  <span>Obtenir la référence</span>
                </>
              )}
            </button>
          </div>

          {/* Toast */}
          {toast && (
            <div
              className={`mt-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2 ${
                toast.type === "success"
                  ? "bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-400"
                  : "bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400"
              }`}
            >
              {toast.type === "success" ? <CheckCircle2 size={16} /> : <ShieldCheck size={16} />}
              <span>{toast.msg}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}