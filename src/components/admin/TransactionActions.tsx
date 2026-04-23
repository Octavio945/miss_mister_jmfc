"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";

interface Props {
  transactionId: string;
  status: string;
}

export default function TransactionActions({ transactionId, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (status !== "PENDING") return null;

  const handleAction = async (action: "validate" | "reject") => {
    if (!confirm(`Êtes-vous sûr de vouloir ${action === "validate" ? "valider" : "rejeter"} cette transaction ?`)) {
      return;
    }

    setLoading(true);
    try {
      const endpoint = action === "validate" ? "/api/admin/validate-payment" : "/api/admin/reject-payment";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Une erreur est survenue.");
      }
    } catch (error) {
      console.error(error);
      alert("Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center space-x-2">
      <button
        onClick={() => handleAction("validate")}
        disabled={loading}
        className="p-1.5 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white transition-all disabled:opacity-50"
        title="Valider le paiement"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
      </button>
      <button
        onClick={() => handleAction("reject")}
        disabled={loading}
        className="p-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
        title="Rejeter le paiement"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
      </button>
    </div>
  );
}
