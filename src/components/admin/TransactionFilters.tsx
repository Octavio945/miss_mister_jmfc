"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Search, X } from "lucide-react";

const STATUSES = [
  { value: "ALL",     label: "Tous" },
  { value: "PENDING", label: "En attente" },
  { value: "SUCCESS", label: "Payé" },
  { value: "FAILED",  label: "Échoué" },
];

const SORTS = [
  { value: "date_desc",   label: "Date ↓ (récent d'abord)" },
  { value: "date_asc",    label: "Date ↑ (ancien d'abord)" },
  { value: "amount_desc", label: "Montant ↓" },
  { value: "amount_asc",  label: "Montant ↑" },
];

export default function TransactionFilters({ total }: { total: number }) {
  const router   = useRouter();
  const pathname = usePathname();
  const params   = useSearchParams();

  const q      = params.get("q")      ?? "";
  const status = params.get("status") ?? "ALL";
  const sort   = params.get("sort")   ?? "date_desc";

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value === "" || value === "ALL" || value === "date_desc") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      // Réinitialise la recherche si on change le filtre (évite confusions)
      router.push(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router]
  );

  const clearSearch = () => update("q", "");

  return (
    <div className="bg-white dark:bg-[#111] rounded-2xl border border-black/5 dark:border-white/10 p-4 space-y-4">

      {/* Ligne 1 : Recherche + tri */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Champ de recherche */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
          <input
            type="text"
            placeholder="Référence, votant, candidat, téléphone…"
            defaultValue={q}
            onChange={(e) => {
              const val = e.target.value;
              // Debounce léger : attend que l'utilisateur finisse de taper
              clearTimeout((window as any).__txSearch);
              (window as any).__txSearch = setTimeout(() => update("q", val), 400);
            }}
            className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {q && (
            <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors">
              <X size={15} />
            </button>
          )}
        </div>

        {/* Tri */}
        <select
          value={sort}
          onChange={(e) => update("sort", e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Ligne 2 : Filtres par statut + compteur */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => update("status", s.value)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
              status === s.value
                ? s.value === "PENDING" ? "bg-orange-500 text-white border-orange-500"
                : s.value === "SUCCESS" ? "bg-green-500 text-white border-green-500"
                : s.value === "FAILED"  ? "bg-red-500 text-white border-red-500"
                : "bg-primary text-white border-primary"
                : "border-black/10 dark:border-white/10 text-foreground/60 hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            {s.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-foreground/40 font-medium">
          {total} résultat{total > 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
