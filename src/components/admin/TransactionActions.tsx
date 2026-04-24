"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";
import AdminModal from "@/components/admin/AdminModal";

interface Props {
  transactionId: string;
  status: string;
}

type ModalState = { action: "validate" | "reject" } | { type: "error"; message: string } | null;

export default function TransactionActions({ transactionId, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);

  if (status !== "PENDING") return null;

  const handleAction = async () => {
    if (!modal || !("action" in modal)) return;
    const action = modal.action;

    setLoading(true);
    try {
      const endpoint = action === "validate"
        ? "/api/admin/validate-payment"
        : "/api/admin/reject-payment";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId }),
      });

      setModal(null);

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        setModal({ type: "error", message: data.error || "Une erreur est survenue." });
      }
    } catch {
      setModal(null);
      setTimeout(() => setModal({ type: "error", message: "Erreur de connexion." }), 50);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-center space-x-2">
        <button
          onClick={() => setModal({ action: "validate" })}
          disabled={loading}
          className="p-1.5 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white transition-all disabled:opacity-50"
          title="Valider le paiement"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
        </button>
        <button
          onClick={() => setModal({ action: "reject" })}
          disabled={loading}
          className="p-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
          title="Rejeter le paiement"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
        </button>
      </div>

      {/* Modal de confirmation */}
      {modal && "action" in modal && (
        <AdminModal
          type={modal.action === "validate" ? "success" : "danger"}
          title={modal.action === "validate" ? "Valider le paiement" : "Rejeter le paiement"}
          message={
            modal.action === "validate"
              ? "Confirmer la validation de ce paiement ? Les votes seront ajoutés immédiatement au candidat."
              : "Confirmer le rejet de ce paiement ? Aucun vote ne sera ajouté."
          }
          confirmLabel={modal.action === "validate" ? "Oui, valider" : "Oui, rejeter"}
          loading={loading}
          onConfirm={handleAction}
          onClose={() => setModal(null)}
        />
      )}

      {/* Modal d'erreur */}
      {modal && "type" in modal && modal.type === "error" && (
        <AdminModal
          type="danger"
          title="Erreur"
          message={modal.message}
          confirmLabel="OK"
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
