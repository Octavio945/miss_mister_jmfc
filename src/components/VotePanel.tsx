"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import type { Participant } from "@prisma/client";

interface Props {
  participant: Participant;
  eventActive: boolean;
  votePrice: number;
}

export default function VotePanel({ participant, eventActive, votePrice }: Props) {
  const router = useRouter();
  const [voteCount, setVoteCount] = useState(1);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const total = voteCount * votePrice;
  const isTooLow = total > 0 && total < 100;

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  };

  const handleVote = async () => {
    if (!eventActive) return;
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
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast("error", data.error ?? "Le service est momentanément indisponible. Veuillez réessayer.");
        return;
      }

      // FIX Bug 2 : fedapayId retiré des params URL
      // Il sera récupéré côté serveur via /api/checkout/init-popup
      const params = new URLSearchParams({
        ref: data.reference,
        amount: String(data.amount),
        eventId: participant.eventId,
        participantId: participant.id,
        participantName: participant.name,
        voteCount: String(voteCount),
        anonCode: data.anonCode ?? "",
        // fedapayId retiré intentionnellement — sécurité
      });

      router.push(`/checkout?${params.toString()}`);
    } catch {
      showToast("error", "La connexion a échoué. Vérifiez votre réseau et réessayez.");
    } finally {
      setLoading(false);
    }
  };

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
                  <span>Payer {total.toLocaleString()} FCFA</span>
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
              <CheckCircle2 size={16} />
              <span>{toast.msg}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}