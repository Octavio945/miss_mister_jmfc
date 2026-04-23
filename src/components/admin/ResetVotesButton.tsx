"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ResetVotesButton() {
  const router = useRouter();
  const [step, setStep]       = useState<"idle" | "confirm" | "loading" | "done">("idle");
  const [error, setError]     = useState("");

  const handleReset = async () => {
    setStep("loading");
    setError("");
    try {
      const res = await fetch("/api/admin/reset-votes", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erreur inconnue");
        setStep("idle");
        return;
      }
      setStep("done");
      setTimeout(() => { setStep("idle"); router.refresh(); }, 2000);
    } catch {
      setError("Impossible de contacter le serveur.");
      setStep("idle");
    }
  };

  if (step === "done") {
    return (
      <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium">
        <span>Votes réinitialisés</span>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-red-600 dark:text-red-400 font-medium">Confirmer ?</span>
        <button
          onClick={handleReset}
          className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors"
        >
          Oui, remettre à 0
        </button>
        <button
          onClick={() => setStep("idle")}
          className="px-3 py-1.5 rounded-lg bg-black/10 dark:bg-white/10 text-sm font-medium hover:bg-black/20 transition-colors"
        >
          Annuler
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end space-y-1">
     {/* <button
        onClick={() => setStep("confirm")}
        disabled={step === "loading"}
        className="flex items-center space-x-2 px-4 py-2 rounded-xl border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
      >
        {step === "loading" ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Trash2 size={14} />
        )}
         <span>Réinitialiser les votes de test</span> 
      </button>*/}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
