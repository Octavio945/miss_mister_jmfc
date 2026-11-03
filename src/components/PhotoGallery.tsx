"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export interface PublicPhoto {
  id: string;
  imageUrl: string;
  caption: string | null;
}

export default function PhotoGallery({ photos, title }: { photos: PublicPhoto[]; title: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const count = photos.length;

  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (delta: number) => setOpenIndex((i) => (i === null ? i : (i + delta + count) % count)),
    [count]
  );

  // Clavier (Échap, flèches) et blocage du défilement de la page pendant la visionneuse
  useEffect(() => {
    if (openIndex === null) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [openIndex, close, step]);

  if (count === 0) return null;
  const current = openIndex === null ? null : photos[openIndex];

  return (
    <>
      <ul className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {photos.map((photo, index) => (
          <li key={photo.id} className={index === 0 && count > 2 ? "col-span-2 row-span-2" : ""}>
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              className="group relative block w-full h-full min-h-full aspect-[4/3] rounded-2xl overflow-hidden bg-black/5 dark:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label={`Agrandir la photo ${index + 1}${photo.caption ? ` : ${photo.caption}` : ""}`}
            >
              <Image
                src={photo.imageUrl}
                alt={photo.caption ?? `${title} — photo ${index + 1}`}
                fill
                sizes={index === 0 && count > 2 ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 50vw, 33vw"}
                className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
              />
              {photo.caption && (
                <span className="absolute inset-x-0 bottom-0 p-3 text-left text-xs sm:text-sm text-white bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
                  {photo.caption}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {current && openIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Photo ${openIndex + 1} sur ${count}`}
          className="fixed inset-0 z-[60] bg-black/95 flex flex-col"
          onClick={close}
        >
          <div className="flex items-center justify-between px-4 py-3 text-white/80 text-sm">
            <span className="tabular-nums">
              {openIndex + 1} / {count}
            </span>
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              className="p-2 rounded-full hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Fermer"
            >
              <X size={24} />
            </button>
          </div>

          <div className="relative flex-1 mx-2 sm:mx-16" onClick={(e) => e.stopPropagation()}>
            <Image
              key={current.id}
              src={current.imageUrl}
              alt={current.caption ?? `${title} — photo ${openIndex + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>

          <p className="min-h-12 px-6 py-4 text-center text-sm text-white/80" onClick={(e) => e.stopPropagation()}>
            {current.caption}
          </p>

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="Photo précédente"
              >
                <ChevronLeft size={26} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="Photo suivante"
              >
                <ChevronRight size={26} />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
