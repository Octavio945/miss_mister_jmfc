"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, Info, CheckCircle2, X, Loader2 } from "lucide-react";

export interface AdminModalProps {
  title: string;
  message: string;
  type?: "info" | "danger" | "success";
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm?: () => void;
  onClose: () => void;
  /** Contenu optionnel sous le message (ex: champ de saisie) */
  children?: React.ReactNode;
}

export default function AdminModal({
  title,
  message,
  type = "info",
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  loading = false,
  onConfirm,
  onClose,
  children,
}: AdminModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Focus sur le bouton confirmer à l'ouverture
  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  // Fermer avec Échap
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [loading, onClose]);

  const iconMap = {
    danger:  <AlertTriangle size={28} className="text-red-500" />,
    info:    <Info size={28} className="text-primary" />,
    success: <CheckCircle2 size={28} className="text-green-500" />,
  };

  const confirmBtnClass = {
    danger:  "bg-red-500 hover:bg-red-600 text-white",
    info:    "bg-primary hover:bg-primary/90 text-white",
    success: "bg-green-600 hover:bg-green-700 text-white",
  }[type];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
    >
      <div className="bg-white dark:bg-[#111] rounded-3xl p-6 w-full max-w-md shadow-2xl border border-black/5 dark:border-white/10 animate-in zoom-in-95 duration-150">

        {/* En-tête */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {iconMap[type]}
            <h3 className="text-lg font-serif font-bold text-primary dark:text-white">{title}</h3>
          </div>
          {!loading && (
            <button
              onClick={onClose}
              className="text-foreground/40 hover:text-foreground transition-colors p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 -mt-1 -mr-1"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Message */}
        <p className="text-foreground/70 text-sm leading-relaxed mb-4">{message}</p>

        {/* Contenu additionnel (champs, etc.) */}
        {children && <div className="mb-5">{children}</div>}

        {/* Boutons */}
        <div className="flex gap-3 mt-2">
          {onConfirm ? (
            <>
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl font-medium border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50 text-sm"
              >
                {cancelLabel}
              </button>
              <button
                ref={confirmRef}
                onClick={onConfirm}
                disabled={loading}
                className={`flex-[2] px-4 py-2.5 rounded-xl font-medium transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50 text-sm ${confirmBtnClass}`}
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "En cours…" : confirmLabel}
              </button>
            </>
          ) : (
            <button
              ref={confirmRef}
              onClick={onClose}
              className={`w-full px-4 py-2.5 rounded-xl font-medium transition-colors text-sm ${confirmBtnClass}`}
            >
              {confirmLabel || "OK"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
