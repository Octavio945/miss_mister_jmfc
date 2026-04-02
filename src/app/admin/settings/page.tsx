"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Save, AlertTriangle, Loader2 } from "lucide-react";

export default function AdminSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [eventData, setEventData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.event) {
          setEventData(data.event);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventData) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: eventData.id,
          isActive: eventData.isActive,
          votePrice: Number(eventData.votePrice),
          startDate: eventData.startDate,
          endDate: eventData.endDate,
        }),
      });

      if (!res.ok) throw new Error("Erreur lors de la sauvegarde.");
      setSuccess("Paramètres enregistrés avec succès.");
      router.refresh();
    } catch {
      setError("Les paramètres n'ont pas pu être sauvegardés.");
    } finally {
      setSaving(false);
    }
  };

  const formatDateForInput = (isoDate: string) => {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    const tzOffset = date.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
    return localISOTime;
  };

  const handleResetDB = async () => {
    if (!confirm("ATTENTION : Vous êtes sur le point de SUPPRIMER tous les candidats, votants et transactions de la base de données. Cette action est IRREVERSIBLE. Voulez-vous continuer ?")) {
      return;
    }

    setResetting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/reset", { method: "POST" });
      if (!res.ok) throw new Error("Erreur de nettoyage.");
      setSuccess("Toutes les données ont été purgées avec succès.");
      router.refresh();
    } catch {
      setError("Erreur lors du nettoyage de la base de données.");
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-primary dark:text-white flex items-center gap-3">
          <Settings size={32} />
          Paramètres
        </h1>
        <p className="text-foreground/60 mt-1">Gérez la configuration globale de l'événement.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-green-50 text-green-600 border border-green-200">
          {success}
        </div>
      )}

      {/* General Settings */}
      <div className="bg-white dark:bg-[#111] rounded-3xl p-8 shadow-sm border border-black/5 dark:border-white/10">
        <h2 className="text-xl font-bold font-serif mb-6 border-b border-black/5 dark:border-white/10 pb-4">
          Configuration de l'événement
        </h2>
        
        {eventData ? (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
              <div>
                <h3 className="font-bold">Statut de l'événement</h3>
                <p className="text-sm text-foreground/60">
                  Ouvrez ou fermez les votes. (Si fermé, les utilisateurs ne pourront plus voter).
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={eventData.isActive} 
                  onChange={(e) => setEventData({ ...eventData, isActive: e.target.checked })} 
                />
                <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
                <h3 className="font-bold mb-2">Date de début</h3>
                <p className="text-sm text-foreground/60 mb-4">
                  Quand débutent les votes.
                </p>
                <input
                  type="datetime-local"
                  value={formatDateForInput(eventData.startDate)}
                  onChange={(e) => setEventData({ ...eventData, startDate: e.target.value })}
                  className="w-full bg-white dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>

              <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
                <h3 className="font-bold mb-2">Date de fin</h3>
                <p className="text-sm text-foreground/60 mb-4">
                  Quand se terminent les votes.
                </p>
                <input
                  type="datetime-local"
                  value={formatDateForInput(eventData.endDate)}
                  onChange={(e) => setEventData({ ...eventData, endDate: e.target.value })}
                  className="w-full bg-white dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
            </div>

            <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
              <h3 className="font-bold mb-2">Prix unitaire du vote (FCFA)</h3>
              <p className="text-sm text-foreground/60 mb-4">
                Définissez le coût d'un (1) vote. Ce montant sera utilisé pour calculer le total lors du paiement.
              </p>
              <input
                type="number"
                min="0"
                value={eventData.votePrice}
                onChange={(e) => setEventData({ ...eventData, votePrice: Number(e.target.value) })}
                className="w-full md:w-1/3 bg-white dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 rounded-xl bg-primary text-white flex items-center space-x-2 font-medium hover:bg-primary/90 transition-all disabled:opacity-50 shadow-md"
              >
                {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                <span>Enregistrer</span>
              </button>
            </div>
          </form>
        ) : (
          <p className="text-foreground/60">Aucun événement n'a été trouvé.</p>
        )}
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 dark:bg-red-900/10 rounded-3xl p-8 border border-red-200 dark:border-red-900/50">
        <div className="flex items-center space-x-3 text-red-600 dark:text-red-500 mb-6 border-b border-red-200 dark:border-red-900/50 pb-4">
          <AlertTriangle size={24} />
          <h2 className="text-xl font-bold font-serif">Zone de Danger</h2>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="font-bold text-red-800 dark:text-red-400">Purger la base de données</h3>
            <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1 max-w-lg">
              Supprime définitivement tous les candidats, toutes les transactions, et tous les votants de l'événement. Action impossible à annuler. Idéal pour nettoyer après les tests.
            </p>
          </div>
          <button
            onClick={handleResetDB}
            disabled={resetting}
            className="px-6 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-all disabled:opacity-50 whitespace-nowrap shadow-md flex items-center space-x-2"
          >
            {resetting ? <Loader2 className="animate-spin" size={18} /> : <AlertTriangle size={18} />}
            <span>Nettoyer les données</span>
          </button>
        </div>
      </div>

    </div>
  );
}
