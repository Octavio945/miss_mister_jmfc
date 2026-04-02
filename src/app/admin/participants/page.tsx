"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Edit, Trash2, Loader2, X, CheckCircle2, Ticket } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminParticipants() {
  const router = useRouter();
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; name: string } | null>(null);
  const [voteModal, setVoteModal] = useState<{ isOpen: boolean; id: string; name: string } | null>(null);
  
  const [deleting, setDeleting] = useState(false);
  const [voting, setVoting] = useState(false);
  const [voteCount, setVoteCount] = useState(1);
  const [voteRef, setVoteRef] = useState("");
  
  const [toast, setToast] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const showToast = (type: 'error' | 'success', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchParticipants = async () => {
    try {
      const resParts = await fetch(`/api/participants`);
      const data = await resParts.json();
      setParticipants(data.participants || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchParticipants();
  }, []);

  const confirmDelete = async () => {
    if (!deleteModal) return;
    
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/participants/${deleteModal.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      
      setParticipants(participants.filter((p) => p.id !== deleteModal.id));
      showToast('success', "Candidat supprimé avec succès.");
      router.refresh();
    } catch (e) {
      showToast('error', "Une erreur s'est produite lors de la suppression.");
    } finally {
      setDeleting(false);
      setDeleteModal(null);
    }
  };

  const confirmManualVote = async () => {
    if (!voteModal || voteCount < 1) return;

    setVoting(true);
    try {
      const res = await fetch(`/api/admin/participants/${voteModal.id}/votes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: voteCount, reference: voteRef }),
      });
      if (!res.ok) throw new Error();

      showToast('success', `${voteCount} vote(s) ajouté(s) manuellement.`);
      fetchParticipants();
      router.refresh();
    } catch (e) {
      showToast('error', "Erreur lors de l'ajout des votes.");
    } finally {
      setVoting(false);
      setVoteModal(null);
      setVoteCount(1);
      setVoteRef("");
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-8">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 right-6 z-50 animate-in slide-in-from-right fade-in">
          <div className={`flex items-center space-x-2 px-4 py-3 rounded-xl shadow-lg border ${
            toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30' : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <X size={18} />}
            <span className="font-medium text-sm">{toast.message}</span>
          </div>
        </div>
      )}

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

      <div className="bg-white dark:bg-[#111] rounded-3xl shadow-sm border border-black/5 dark:border-white/10 overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="flex justify-center items-center h-full py-20">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-black/5 dark:bg-white/5 text-sm uppercase tracking-wider text-foreground/60">
                <tr>
                  <th className="px-6 py-4 font-medium">Profil</th>
                  <th className="px-6 py-4 font-medium">Catégorie</th>
                  <th className="px-6 py-4 font-medium text-right">Votes</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {participants.map((p) => (
                  <tr key={p.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden relative border border-black/10 shrink-0 bg-black/5">
                          {p.imageUrl ? (
                            <Image
                              src={p.imageUrl.includes('dicebear') ? p.imageUrl : p.imageUrl}
                              alt={p.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                              unoptimized={p.imageUrl.includes("dicebear")}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">{p.name.charAt(0)}</div>
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
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setVoteModal({ isOpen: true, id: p.id, name: p.name })}
                          className="p-2 text-foreground/50 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          title="Ajouter crédit manuel"
                        >
                          <Ticket size={18} />
                        </button>
                        <Link 
                          href={`/admin/participants/${p.id}/edit`}
                          className="p-2 text-foreground/50 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors popup-btn"
                          title="Modifier"
                        >
                          <Edit size={18} />
                        </Link>
                        <button 
                          onClick={() => setDeleteModal({ isOpen: true, id: p.id, name: p.name })}
                          className="p-2 text-foreground/50 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {participants.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-foreground/60">
                      Aucun candidat trouvé pour l&apos;événement actif.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Vote Modal */}
      {voteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111] rounded-3xl p-8 w-full max-w-md shadow-2xl border border-black/5 dark:border-white/10 scale-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-serif font-bold text-green-600 dark:text-green-500 flex items-center gap-2">
                <Ticket size={24} />
                Ajout Manuel de Votes
              </h3>
              <button 
                onClick={() => setVoteModal(null)}
                className="text-foreground/50 hover:text-foreground transition-colors p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
                disabled={voting}
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="text-foreground/70 mb-6">
              Ajouter des votes payés physiquement (espèces) pour <strong className="text-foreground">{voteModal.name}</strong>.
            </p>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre de votes initiaux</label>
                <input
                  type="number"
                  min="1"
                  value={voteCount}
                  onChange={(e) => setVoteCount(Number(e.target.value))}
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">N° de reçu (Optionnel)</label>
                <input
                  type="text"
                  placeholder="Ex: TICKET-001"
                  value={voteRef}
                  onChange={(e) => setVoteRef(e.target.value)}
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500/50"
                />
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={confirmManualVote}
                disabled={voting || voteCount < 1}
                className="flex-1 px-4 py-3 rounded-xl font-medium bg-green-600 text-white hover:bg-green-700 transition-colors shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {voting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                <span>{voting ? "Ajout..." : "Valider l&apos;ajout"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111] rounded-3xl p-6 w-full max-w-md shadow-2xl border border-black/5 dark:border-white/10 scale-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-serif font-bold text-red-600 dark:text-red-500">
                Supprimer le candidat
              </h3>
              <button 
                onClick={() => setDeleteModal(null)}
                className="text-foreground/50 hover:text-foreground transition-colors p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
                disabled={deleting}
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="text-foreground/70 mb-8">
              Êtes-vous sûr de vouloir supprimer <strong className="text-foreground">{deleteModal.name}</strong> ? Cette action est irréversible et supprimera également les transactions liées à ce candidat.
            </p>
            
            <div className="flex space-x-4">
              <button
                onClick={() => setDeleteModal(null)}
                disabled={deleting}
                className="flex-1 px-4 py-3 rounded-xl font-medium border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-[2] px-4 py-3 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600 transition-colors shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                <span>{deleting ? "Suppression..." : "Oui, supprimer"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
