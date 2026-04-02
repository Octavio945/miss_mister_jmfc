"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Save } from "lucide-react";

export default function NewParticipantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    category: "MISS",
    number: 1,
    description: "",
    imageUrl: "",
  });

  // We hardcode eventId for now, assuming there's only one active event
  // In a real app we'd fetch the active event or pass it via props/context.
  const [eventId, setEventId] = useState("");

  // Quick fetch to get the current event id on mount
  useState(() => {
    fetch("/api/participants/event") // We can just make a quick endpoint or let the server handle it
      .catch(() => {});
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Small trick: We don't have the eventId readily available since it's a client component.
      // Easiest is to let a server action or API route bind the active event automatically if not passed.
      // Wait, our API route expects `eventId`. We should fetch the active event first.
      
      const resEvent = await fetch("/api/participants/active-event");
      if (!resEvent.ok) throw new Error("Aucun événement actif trouvé.");
      const { event } = await resEvent.json();

      const res = await fetch("/api/admin/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          number: Number(formData.number),
          eventId: event.id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Une erreur est survenue.");
      }

      router.push("/admin/participants");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Erreur serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      <div>
        <Link href="/admin/participants" className="inline-flex items-center space-x-2 text-foreground/60 hover:text-primary mb-6 transition-colors">
          <ArrowLeft size={16} />
          <span>Retour aux candidats</span>
        </Link>
        <h1 className="text-3xl font-serif font-bold text-primary dark:text-white">Nouveau Candidat</h1>
      </div>

      <div className="bg-white dark:bg-[#111] rounded-3xl p-8 shadow-sm border border-black/5 dark:border-white/10">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Nom et Prénom</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50"
                placeholder="Ex: Amina K."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Catégorie</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as "MISS" | "MISTER" })}
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50"
                >
                  <option value="MISS">Miss</option>
                  <option value="MISTER">Mister</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Numéro</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: Number(e.target.value) })}
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Photo du candidat (Optionnel)</label>
            <div className="flex items-center space-x-4">
              {formData.imageUrl && (
                <div className="w-16 h-16 rounded-xl overflow-hidden relative border border-black/10 dark:border-white/10 shrink-0">
                  <picture>
                    <img src={formData.imageUrl} alt="Aperçu" className="w-full h-full object-cover" />
                  </picture>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const data = new FormData();
                  data.append("file", file);

                  setLoading(true);
                  try {
                    const res = await fetch("/api/admin/upload", {
                      method: "POST",
                      body: data,
                    });
                    if (!res.ok) throw new Error("Erreur d'upload");
                    const { imageUrl } = await res.json();
                    setFormData({ ...formData, imageUrl });
                  } catch (err: any) {
                    setError("Impossible de télécharger l'image.");
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description / Présentation (Optionnel)</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50"
              placeholder="Présentation du candidat..."
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-black/5 dark:border-white/10">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 rounded-xl bg-primary text-white flex items-center space-x-2 font-medium hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              <span>{loading ? "Enregistrement..." : "Créer le candidat"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
