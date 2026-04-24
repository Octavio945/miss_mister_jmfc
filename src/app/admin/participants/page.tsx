"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Edit, Trash2, Loader2, X, CheckCircle2, Ticket, Search, MinusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import AdminModal from "@/components/admin/AdminModal";

type ModalState =
  | { type: "delete";     id: string; name: string }
  | { type: "addVotes";   id: string; name: string; currentVotes: number }
  | { type: "subVotes";   id: string; name: string; currentVotes: number }
  | { type: "alert";      message: string; isError: boolean };

export default function AdminParticipants() {
  const router = useRouter();
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [modal, setModal] = useState<ModalState | null>(null);
  const [voteCount, setVoteCount] = useState(1);
  const [voteRef, setVoteRef] = useState("");

  const [toast, setToast] = useState<{ type: "error" | "success"; message: string } | null>(null);

  // Filtres
  const [search, setSearch]     = useState("");
  const [category, setCategory] = useState<"ALL" | "MISS" | "MISTER">("ALL");
  const [sort, setSort]         = useState("votes_desc");

  const showToast = (type: "error" | "success", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const closeModal = () => {
    if (actionLoading) return;
    setModal(null);
    setVoteCount(1);
    setVoteRef("");
  };

  const fetchParticipants = async () => {
    try {
      const res = await fetch("/api/participants");
      const data = await res.json();
      setParticipants(data.participants || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchParticipants(); }, []);

  // Filtrage + tri en mémoire
  const filtered = useMemo(() => {
    let list = [...participants];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (category !== "ALL") {
      list = list.filter((p) => p.category === category);
    }
    list.sort((a, b) => {
      if (sort === "votes_desc")  return b.totalVotes - a.totalVotes;
      if (sort === "votes_asc")   return a.totalVotes - b.totalVotes;
      if (sort === "number_asc")  return a.number - b.number;
      if (sort === "number_desc") return b.number - a.number;
      if (sort === "name_az")     return a.name.localeCompare(b.name);
      if (sort === "name_za")     return b.name.localeCompare(a.name);
      return 0;
    });
    return list;
  }, [participants, search, category, sort]);

  const confirmDelete = async () => {
    if (modal?.type !== "delete") return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/participants/${modal.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setParticipants((prev) => prev.filter((p) => p.id !== modal.id));
      closeModal();
      showToast("success", "Candidat supprimé avec succès.");
      router.refresh();
    } catch {
      closeModal();
      showToast("error", "Une erreur s'est produite lors de la suppression.");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmAddVotes = async () => {
    if (modal?.type !== "addVotes" || voteCount < 1) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/participants/${modal.id}/votes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: voteCount, reference: voteRef }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Erreur");
      }
      closeModal();
      showToast("success", `${voteCount} vote(s) ajouté(s) à ${modal.name}.`);
      fetchParticipants();
      router.refresh();
    } catch (e: any) {
      closeModal();
      showToast("error", e.message || "Erreur lors de l'ajout des votes.");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmSubVotes = async () => {
    if (modal?.type !== "subVotes" || voteCount < 1) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/participants/${modal.id}/votes`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: voteCount }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Erreur");
      }
      closeModal();
      showToast("success", `${voteCount} vote(s) retiré(s) de ${modal.name}.`);
      fetchParticipants();
      router.refresh();
    } catch (e: any) {
      closeModal();
      showToast("error", e.message || "Erreur lors de la correction des votes.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-6">

      {/* Toast */}
      {toast && (
        <div className="fixed top-24 right-6 z-50 animate-in slide-in-from-right fade-in">
          <div className={`flex items-center space-x-2 px-4 py-3 rounded-xl shadow-lg border ${
            toast.type === "success"
              ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30"
              : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30"
          }`}>
            {toast.type === "success" ? <CheckCircle2 size={18} /> : <X size={18} />}
            <span className="font-medium text-sm">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary dark:text-white">Candidats</h1>
          <p className="text-foreground/60 mt-1">Gérez la liste des participants à l&apos;événement.</p>
        </div>
        <Link
          href="/admin/participants/new"
          className="px-6 py-3 rounded-full bg-primary text-white font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-md"
        >
          <Plus size={18} />
          <span>Ajouter un candidat</span>
        </Link>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-[#111] rounded-2xl border border-black/5 dark:border-white/10 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
            <input
              type="text"
              placeholder="Rechercher un candidat…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground">
                <X size={15} />
              </button>
            )}
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
          >
            <option value="votes_desc">Votes ↓ (plus votés)</option>
            <option value="votes_asc">Votes ↑ (moins votés)</option>
            <option value="number_asc">Numéro ↑</option>
            <option value="number_desc">Numéro ↓</option>
            <option value="name_az">Nom A → Z</option>
            <option value="name_za">Nom Z → A</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["ALL", "MISS", "MISTER"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                category === cat
                  ? "bg-primary text-white border-primary"
                  : "border-black/10 dark:border-white/10 text-foreground/60 hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              {cat === "ALL" ? "Tous" : cat}
            </button>
          ))}
          <span className="ml-auto text-xs text-foreground/40 font-medium">
            {filtered.length} candidat{filtered.length > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white dark:bg-[#111] rounded-3xl shadow-sm border border-black/5 dark:border-white/10 overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="flex justify-center items-center h-full py-20">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-black/5 dark:bg-white/5 text-xs uppercase tracking-wider text-foreground/60">
                <tr>
                  <th className="px-6 py-4 font-medium">Profil</th>
                  <th className="px-6 py-4 font-medium">Catégorie</th>
                  <th className="px-6 py-4 font-medium text-right">Votes</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden relative border border-black/10 shrink-0 bg-black/5">
                          {p.imageUrl ? (
                            <Image
                              src={p.imageUrl}
                              alt={p.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                              unoptimized={p.imageUrl.includes("dicebear")}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                              {p.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="font-bold text-primary dark:text-white whitespace-nowrap">{p.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-primary/10 text-primary dark:bg-white/10 dark:text-white px-3 py-1 rounded-full text-xs font-bold uppercase whitespace-nowrap">
                        {p.category} {p.number}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-accent text-lg">
                      {p.totalVotes.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        {/* Ajouter votes */}
                        <button
                          onClick={() => { setVoteCount(1); setVoteRef(""); setModal({ type: "addVotes", id: p.id, name: p.name, currentVotes: p.totalVotes }); }}
                          className="p-2 text-foreground/50 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          title="Ajouter des votes"
                        >
                          <Ticket size={18} />
                        </button>
                        {/* Retirer votes */}
                        <button
                          onClick={() => { setVoteCount(1); setModal({ type: "subVotes", id: p.id, name: p.name, currentVotes: p.totalVotes }); }}
                          className="p-2 text-foreground/50 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                          title="Corriger / retirer des votes"
                        >
                          <MinusCircle size={18} />
                        </button>
                        {/* Modifier */}
                        <Link
                          href={`/admin/participants/${p.id}/edit`}
                          className="p-2 text-foreground/50 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit size={18} />
                        </Link>
                        {/* Supprimer */}
                        <button
                          onClick={() => setModal({ type: "delete", id: p.id, name: p.name })}
                          className="p-2 text-foreground/50 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-foreground/40">
                      <p className="font-medium">Aucun candidat trouvé.</p>
                      {(search || category !== "ALL") && (
                        <p className="text-xs mt-1">Essayez de modifier vos filtres.</p>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      {/* Supprimer */}
      {modal?.type === "delete" && (
        <AdminModal
          type="danger"
          title="Supprimer le candidat"
          message={`Êtes-vous sûr de vouloir supprimer "${modal.name}" ? Cette action est irréversible et supprimera toutes les transactions liées.`}
          confirmLabel="Oui, supprimer"
          loading={actionLoading}
          onConfirm={confirmDelete}
          onClose={closeModal}
        />
      )}

      {/* Ajouter votes */}
      {modal?.type === "addVotes" && (
        <AdminModal
          type="success"
          title="Ajouter des votes"
          message={`Ajout manuel de votes pour "${modal.name}" (actuellement : ${modal.currentVotes.toLocaleString()} votes).`}
          confirmLabel="Valider l'ajout"
          loading={actionLoading}
          onConfirm={confirmAddVotes}
          onClose={closeModal}
        >
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-foreground/70 mb-1">Nombre de votes à ajouter</label>
              <input
                type="number"
                min={1}
                value={voteCount}
                onChange={(e) => setVoteCount(Math.max(1, Number(e.target.value)))}
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground/70 mb-1">N° de reçu (optionnel)</label>
              <input
                type="text"
                placeholder="Ex: TICKET-001"
                value={voteRef}
                onChange={(e) => setVoteRef(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40"
              />
            </div>
          </div>
        </AdminModal>
      )}

      {/* Retirer votes */}
      {modal?.type === "subVotes" && (
        <AdminModal
          type="danger"
          title="Corriger / retirer des votes"
          message={`Retirez des votes de "${modal.name}" (actuellement : ${modal.currentVotes.toLocaleString()} votes). Utilisez ceci uniquement pour corriger une erreur de validation.`}
          confirmLabel="Retirer les votes"
          loading={actionLoading}
          onConfirm={confirmSubVotes}
          onClose={closeModal}
        >
          <div>
            <label className="block text-xs font-medium text-foreground/70 mb-1">Nombre de votes à retirer</label>
            <input
              type="number"
              min={1}
              max={modal.currentVotes}
              value={voteCount}
              onChange={(e) => setVoteCount(Math.max(1, Math.min(modal.currentVotes, Number(e.target.value))))}
              className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
            />
            <p className="text-xs text-foreground/40 mt-1">
              Maximum : {modal.currentVotes.toLocaleString()} votes
            </p>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
