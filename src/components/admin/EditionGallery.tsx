"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Save, Star, Trash2 } from "lucide-react";
import AdminModal from "@/components/admin/AdminModal";

export interface GalleryPhoto {
  id: string;
  imageUrl: string;
  caption: string | null;
}

interface Props {
  eventId: string;
  initialDescription: string | null;
  initialPhotos: GalleryPhoto[];
}

// Même limite que /api/admin/upload (Vercel refuse au-delà de 4,5 Mo)
const MAX_SIZE = 4 * 1024 * 1024;

export default function EditionGallery({ eventId, initialDescription, initialPhotos }: Props) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState(initialPhotos);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [savedDescription, setSavedDescription] = useState(initialDescription ?? "");
  const [savingDescription, setSavingDescription] = useState(false);
  const [upload, setUpload] = useState<{ done: number; total: number } | null>(null);
  const [busyPhotoId, setBusyPhotoId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<GalleryPhoto | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const notify = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const saveDescription = async () => {
    setSavingDescription(true);
    try {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Le récit n'a pas pu être enregistré.");
      setSavedDescription(description);
      notify("success", "Récit enregistré.");
      router.refresh();
    } catch (err: unknown) {
      notify("error", err instanceof Error ? err.message : "Le récit n'a pas pu être enregistré.");
    } finally {
      setSavingDescription(false);
    }
  };

  const uploadFiles = async (files: FileList) => {
    const list = Array.from(files);
    const tooBig = list.filter((file) => file.size > MAX_SIZE);
    const valid = list.filter((file) => file.size <= MAX_SIZE);
    const failures: string[] = tooBig.map((file) => `${file.name} (plus de 4 Mo)`);

    setUpload({ done: 0, total: valid.length });
    // Envoi une par une : évite de dépasser la limite de taille d'une requête
    for (const [index, file] of valid.entries()) {
      try {
        const form = new FormData();
        form.append("file", file);
        const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: form });
        const uploaded = await uploadRes.json().catch(() => null);
        if (!uploadRes.ok) throw new Error(uploaded?.error || "Envoi impossible");

        const res = await fetch(`/api/admin/events/${eventId}/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: uploaded.imageUrl }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || "Enregistrement impossible");
        setPhotos((prev) => [...prev, data.photo]);
      } catch (err: unknown) {
        failures.push(`${file.name} (${err instanceof Error ? err.message : "erreur"})`);
      }
      setUpload({ done: index + 1, total: valid.length });
    }
    setUpload(null);
    if (fileInput.current) fileInput.current.value = "";

    const added = valid.length - (failures.length - tooBig.length);
    if (failures.length > 0) {
      notify("error", `${added} photo(s) ajoutée(s). Échec : ${failures.join(", ")}.`);
    } else {
      notify("success", `${added} photo(s) ajoutée(s).`);
    }
    router.refresh();
  };

  const patchPhoto = async (photo: GalleryPhoto, body: { caption?: string; cover?: boolean }) => {
    setBusyPhotoId(photo.id);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/photos/${photo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Modification impossible.");
      if (body.cover) {
        setPhotos((prev) => {
          const moved = prev.find((p) => p.id === photo.id) ?? photo;
          return [moved, ...prev.filter((p) => p.id !== photo.id)];
        });
        notify("success", "Photo de couverture mise à jour.");
      }
      router.refresh();
    } catch (err: unknown) {
      notify("error", err instanceof Error ? err.message : "Modification impossible.");
    } finally {
      setBusyPhotoId(null);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const photo = toDelete;
    setBusyPhotoId(photo.id);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/photos/${photo.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Suppression impossible.");
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      setToDelete(null);
      router.refresh();
    } catch (err: unknown) {
      setToDelete(null);
      notify("error", err instanceof Error ? err.message : "Suppression impossible.");
    } finally {
      setBusyPhotoId(null);
    }
  };

  return (
    <div className="space-y-6 pt-6 border-t border-black/5 dark:border-white/10">
      {/* Récit */}
      <div>
        <label htmlFor={`story-${eventId}`} className="font-bold font-serif block mb-1">
          Récit de l&apos;édition
        </label>
        <p className="text-xs text-foreground/50 mb-3">
          Affiché aux visiteurs dans l&apos;historique : déroulement, moments forts, remerciements…
        </p>
        <textarea
          id={`story-${eventId}`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          maxLength={3000}
          className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="La finale s'est tenue le…"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-foreground/40 tabular-nums">{description.length} / 3000</span>
          <button
            type="button"
            onClick={saveDescription}
            disabled={savingDescription || description === savedDescription}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40"
          >
            {savingDescription ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Enregistrer le récit
          </button>
        </div>
      </div>

      {/* Galerie */}
      <div>
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <div>
            <h4 className="font-bold font-serif">Galerie photos</h4>
            <p className="text-xs text-foreground/50">
              {photos.length} photo{photos.length > 1 ? "s" : ""} · la première est la couverture · JPG, PNG ou WebP, 4 Mo max.
            </p>
          </div>
          <label
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 text-sm font-medium transition-colors ${
              upload ? "opacity-50 pointer-events-none" : "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            {upload ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
            {upload ? `Envoi ${upload.done}/${upload.total}…` : "Ajouter des photos"}
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              className="sr-only"
              onChange={(e) => e.target.files?.length && uploadFiles(e.target.files)}
            />
          </label>
        </div>

        {photos.length === 0 ? (
          <p className="text-sm text-foreground/50 py-6 text-center rounded-2xl border border-dashed border-black/10 dark:border-white/10">
            Aucune photo pour cette édition. Ajoutez les photos de la soirée, du défilé ou de la remise des prix.
          </p>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <li key={photo.id} className="rounded-2xl overflow-hidden border border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5">
                <div className="relative aspect-[4/3]">
                  <Image src={photo.imageUrl} alt={photo.caption ?? "Photo de l'édition"} fill sizes="(max-width: 640px) 50vw, 250px" className="object-cover" />
                  {index === 0 && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-accent text-primary text-[10px] font-bold uppercase">
                      Couverture
                    </span>
                  )}
                  {busyPhotoId === photo.id && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="animate-spin text-white" />
                    </div>
                  )}
                </div>
                <div className="p-2 space-y-2">
                  <input
                    type="text"
                    defaultValue={photo.caption ?? ""}
                    maxLength={200}
                    placeholder="Légende (optionnel)"
                    aria-label="Légende de la photo"
                    onBlur={(e) => {
                      const caption = e.target.value.trim();
                      if (caption !== (photo.caption ?? "")) {
                        setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, caption: caption || null } : p)));
                        patchPhoto(photo, { caption });
                      }
                    }}
                    className="w-full bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={() => patchPhoto(photo, { cover: true })}
                      disabled={index === 0 || busyPhotoId !== null}
                      className="flex items-center gap-1 text-xs text-foreground/60 hover:text-accent disabled:opacity-30 disabled:hover:text-foreground/60"
                    >
                      <Star size={13} />
                      Couverture
                    </button>
                    <button
                      type="button"
                      onClick={() => setToDelete(photo)}
                      disabled={busyPhotoId !== null}
                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 disabled:opacity-30"
                    >
                      <Trash2 size={13} />
                      Supprimer
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {message && (
        <p className={`text-sm px-4 py-3 rounded-xl ${message.type === "success" ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"}`}>
          {message.text}
        </p>
      )}

      {toDelete && (
        <AdminModal
          type="danger"
          title="Supprimer la photo"
          message="Cette photo sera retirée de l'historique et définitivement supprimée. Continuer ?"
          confirmLabel="Oui, supprimer"
          loading={busyPhotoId === toDelete.id}
          onConfirm={confirmDelete}
          onClose={() => busyPhotoId === null && setToDelete(null)}
        />
      )}
    </div>
  );
}
