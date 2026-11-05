"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Save, AlertTriangle, Loader2, CalendarPlus } from "lucide-react";
import AdminModal from "@/components/admin/AdminModal";

type EventData = {
  id: string;
  title: string;
  isActive: boolean;
  votePrice: number;
  startDate: string;
  endDate: string;
};

const EMPTY_EDITION = { title: "", startDate: "", endDate: "", votePrice: 100 };

const inputClass =
  "w-full bg-white dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50";

export default function AdminSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);
  const [showEditionModal, setShowEditionModal] = useState(false);

  const [eventData, setEventData] = useState<EventData | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [newEdition, setNewEdition] = useState(EMPTY_EDITION);

  const loadSettings = () =>
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.event) {
          setEventData(data.event);
          setPendingCount(data.pendingCount ?? 0);
        }
      })
      .finally(() => setLoading(false));

  useEffect(() => {
    loadSettings();
  }, []);

  // Les champs datetime-local donnent une heure locale sans fuseau : on la convertit en ISO
  const toIso = (value: string) => {
    const date = new Date(value);
    return isNaN(date.getTime()) ? "" : date.toISOString();
  };

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
          title: eventData.title,
          isActive: eventData.isActive,
          votePrice: Number(eventData.votePrice),
          startDate: toIso(eventData.startDate),
          endDate: toIso(eventData.endDate),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Les paramètres n'ont pas pu être sauvegardés.");
      }
      setSuccess("Paramètres enregistrés avec succès.");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Les paramètres n'ont pas pu être sauvegardés.");
    } finally {
      setSaving(false);
    }
  };

  const formatDateForInput = (isoDate: string) => {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return "";
    const tzOffset = date.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
    return localISOTime;
  };

  const handleResetDB = async () => {
    setShowResetModal(false);
    setResetting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/reset", { method: "POST" });
      if (!res.ok) throw new Error("Erreur de nettoyage.");
      setSuccess("Les données de l'édition en cours ont été purgées avec succès.");
      await loadSettings();
      router.refresh();
    } catch {
      setError("Erreur lors du nettoyage de la base de données.");
    } finally {
      setResetting(false);
    }
  };

  const handleCreateEdition = async () => {
    setShowEditionModal(false);
    setCreating(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newEdition.title,
          votePrice: Number(newEdition.votePrice),
          startDate: toIso(newEdition.startDate),
          endDate: toIso(newEdition.endDate),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "La nouvelle édition n'a pas pu être créée.");
      }

      setNewEdition(EMPTY_EDITION);
      await loadSettings();
      setSuccess("Nouvelle édition créée. L'édition précédente est archivée dans « Éditions ». Ajoutez maintenant les candidats.");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "La nouvelle édition n'a pas pu être créée.");
    } finally {
      setCreating(false);
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
    <div className="p-6 md:p-10 space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-primary dark:text-white flex items-center gap-3">
          <Settings size={32} />
          Paramètres
        </h1>
        <p className="text-foreground/60 mt-1">Gérez la configuration globale de l&apos;événement.</p>
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

      {/* Deux colonnes sur grand écran : configuration à gauche, actions d'édition à droite */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 items-start">

      {/* General Settings */}
      <div className="xl:col-span-3 bg-white dark:bg-[#111] rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 dark:border-white/10">
        <h2 className="text-xl font-bold font-serif mb-6 border-b border-black/5 dark:border-white/10 pb-4">
          Configuration de l&apos;édition en cours
        </h2>

        {eventData ? (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
              <h3 className="font-bold mb-2">Titre de l&apos;édition</h3>
              <p className="text-sm text-foreground/60 mb-4">
                Nom du concours, affiché dans l&apos;historique et les exports.
              </p>
              <input
                type="text"
                value={eventData.title}
                onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                className={inputClass}
                minLength={3}
                maxLength={120}
                required
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
              <div>
                <h3 className="font-bold">Statut de l&apos;événement</h3>
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
                  className={inputClass}
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
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
              <h3 className="font-bold mb-2">Prix unitaire du vote (FCFA)</h3>
              <p className="text-sm text-foreground/60 mb-4">
                Définissez le coût d&apos;un (1) vote. Ce montant sera utilisé pour calculer le total lors du paiement.
              </p>
              <input
                type="number"
                min="1"
                step="1"
                value={eventData.votePrice}
                onChange={(e) => setEventData({ ...eventData, votePrice: Number(e.target.value) })}
                className={`${inputClass} md:w-1/3`}
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
          <p className="text-foreground/60">Aucun événement n&apos;a été trouvé. Créez une édition ci-dessous.</p>
        )}
      </div>

      <div className="xl:col-span-2 space-y-8">

      {/* Nouvelle édition */}
      <div className="bg-white dark:bg-[#111] rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 dark:border-white/10">
        <h2 className="text-xl font-bold font-serif mb-2 flex items-center gap-3">
          <CalendarPlus size={22} className="text-accent" />
          Lancer une nouvelle édition
        </h2>
        <p className="text-sm text-foreground/60 mb-6 border-b border-black/5 dark:border-white/10 pb-4">
          Démarre un nouveau concours avec zéro candidat et zéro vote. L&apos;édition actuelle n&apos;est pas supprimée :
          elle est archivée et reste consultable dans « Éditions ».
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setShowEditionModal(true);
          }}
          className="space-y-6"
        >
          <div>
            <label htmlFor="new-edition-title" className="font-bold block mb-2">Titre</label>
            <input
              id="new-edition-title"
              type="text"
              placeholder="Élection Miss & Mister JMFC 2027"
              value={newEdition.title}
              onChange={(e) => setNewEdition({ ...newEdition, title: e.target.value })}
              className={inputClass}
              minLength={3}
              maxLength={120}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="new-edition-start" className="font-bold block mb-2">Début des votes</label>
              <input
                id="new-edition-start"
                type="datetime-local"
                value={newEdition.startDate}
                onChange={(e) => setNewEdition({ ...newEdition, startDate: e.target.value })}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label htmlFor="new-edition-end" className="font-bold block mb-2">Fin des votes</label>
              <input
                id="new-edition-end"
                type="datetime-local"
                value={newEdition.endDate}
                min={newEdition.startDate || undefined}
                onChange={(e) => setNewEdition({ ...newEdition, endDate: e.target.value })}
                className={inputClass}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="new-edition-price" className="font-bold block mb-2">Prix du vote (FCFA)</label>
              <input
                id="new-edition-price"
                type="number"
                min="1"
                step="1"
                value={newEdition.votePrice}
                onChange={(e) => setNewEdition({ ...newEdition, votePrice: Number(e.target.value) })}
                className={inputClass}
                required
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="px-8 py-3 rounded-xl bg-accent text-white flex items-center space-x-2 font-medium hover:opacity-90 transition-all disabled:opacity-50 shadow-md"
            >
              {creating ? <Loader2 className="animate-spin" size={20} /> : <CalendarPlus size={20} />}
              <span>Créer la nouvelle édition</span>
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 dark:bg-red-900/10 rounded-3xl p-6 md:p-8 border border-red-200 dark:border-red-900/50">
        <div className="flex items-center space-x-3 text-red-600 dark:text-red-500 mb-6 border-b border-red-200 dark:border-red-900/50 pb-4">
          <AlertTriangle size={24} />
          <h2 className="text-xl font-bold font-serif">Zone de Danger</h2>
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <h3 className="font-bold text-red-800 dark:text-red-400">Purger l&apos;édition en cours</h3>
            <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">
              Supprime définitivement tous les candidats, toutes les transactions et tous les votants de l&apos;édition en cours. Les éditions archivées ne sont pas touchées. Action impossible à annuler. Idéal pour nettoyer après les tests — pour démarrer un nouveau concours, utilisez plutôt « Lancer une nouvelle édition ».
            </p>
          </div>
          <button
            onClick={() => setShowResetModal(true)}
            disabled={resetting}
            className="self-start px-6 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-all disabled:opacity-50 whitespace-nowrap shadow-md flex items-center space-x-2"
          >
            {resetting ? <Loader2 className="animate-spin" size={18} /> : <AlertTriangle size={18} />}
            <span>Nettoyer les données</span>
          </button>
        </div>
      </div>

      </div>
      </div>

      {showResetModal && (
        <AdminModal
          type="danger"
          title="Purger l'édition en cours"
          message={`ATTENTION : cette action va SUPPRIMER définitivement tous les candidats, votants et transactions de « ${eventData?.title ?? "l'édition en cours"} ». Elle est IRRÉVERSIBLE. Êtes-vous absolument sûr de vouloir continuer ?`}
          confirmLabel="Oui, tout supprimer"
          cancelLabel="Annuler"
          loading={resetting}
          onConfirm={handleResetDB}
          onClose={() => setShowResetModal(false)}
        />
      )}

      {showEditionModal && (
        <AdminModal
          type="info"
          title="Lancer une nouvelle édition"
          message={
            `« ${newEdition.title.trim()} » deviendra le concours affiché sur le site, sans candidat ni vote.` +
            (eventData ? ` « ${eventData.title} » sera archivée et ses votes définitivement fermés.` : "") +
            (pendingCount > 0
              ? ` Attention : ${pendingCount} paiement(s) de l'édition actuelle ne sont pas finalisés (le votant n'a pas terminé le paiement FedaPay).`
              : "")
          }
          confirmLabel="Créer l'édition"
          cancelLabel="Annuler"
          loading={creating}
          onConfirm={handleCreateEdition}
          onClose={() => setShowEditionModal(false)}
        />
      )}
    </div>
  );
}
