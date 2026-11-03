// Pagination partagée par les tableaux de l'admin.
// Sans hook : utilisable depuis une page serveur (liens via `hrefFor`)
// comme depuis un composant client (boutons via `onPageChange`).

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  /** Navigation par URL (pages serveur) */
  hrefFor?: (page: number) => string;
  /** Navigation par état local (composants client) */
  onPageChange?: (page: number) => void;
  /** Libellé des éléments comptés, au pluriel (ex : "transactions") */
  itemLabel?: string;
}

/** Ramène un numéro de page reçu (URL, état) dans les bornes valides. */
export function clampPage(page: number, totalItems: number, pageSize: number): number {
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  return Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
}

/** Pages à afficher : 1 … 4 5 6 … 15 (null = ellipse). */
function visiblePages(page: number, pageCount: number): (number | null)[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const pages = new Set([1, pageCount, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  const result: (number | null)[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push(null);
    result.push(p);
  });
  return result;
}

export default function Pagination({ page, pageSize, totalItems, hrefFor, onPageChange, itemLabel = "éléments" }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  const baseClass = "min-w-9 h-9 px-2 rounded-lg text-sm font-medium flex items-center justify-center transition-colors";
  const idleClass = "text-foreground/70 hover:bg-black/5 dark:hover:bg-white/10";
  const disabledClass = "text-foreground/25 pointer-events-none";

  // Fonction de rendu (et non composant) : pas de composant recréé à chaque rendu
  const control = (target: number, label: string, children: React.ReactNode, current = false, key?: React.Key) => {
    const disabled = target < 1 || target > pageCount;
    const className = `${baseClass} ${current ? "bg-primary text-white" : disabled ? disabledClass : idleClass}`;
    if (current || disabled) {
      return (
        <span key={key} className={className} aria-current={current ? "page" : undefined} aria-label={label} aria-disabled={disabled || undefined}>
          {children}
        </span>
      );
    }
    if (hrefFor) {
      return (
        <Link key={key} href={hrefFor(target)} scroll={false} className={className} aria-label={label}>
          {children}
        </Link>
      );
    }
    return (
      <button key={key} type="button" onClick={() => onPageChange?.(target)} className={className} aria-label={label}>
        {children}
      </button>
    );
  };

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 md:px-6 py-3 border-t border-black/5 dark:border-white/10"
    >
      <p className="text-xs text-foreground/50 tabular-nums">
        {from.toLocaleString("fr-FR")} – {to.toLocaleString("fr-FR")} sur {totalItems.toLocaleString("fr-FR")} {itemLabel}
      </p>

      {pageCount > 1 && (
        <div className="flex items-center gap-1">
          {control(page - 1, "Page précédente", <ChevronLeft size={16} />)}
          {visiblePages(page, pageCount).map((p, i) =>
            p === null ? (
              <span key={`gap-${i}`} className="px-1 text-foreground/30" aria-hidden>
                …
              </span>
            ) : (
              control(p, `Page ${p}`, p, p === page, p)
            )
          )}
          {control(page + 1, "Page suivante", <ChevronRight size={16} />)}
        </div>
      )}
    </nav>
  );
}
