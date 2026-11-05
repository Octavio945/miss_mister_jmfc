"use client";

import { useSyncExternalStore } from "react";
import { Lock, Trophy, ArrowDown } from "lucide-react";

interface CountdownTimerProps {
  endDate: Date | string;
  startDate?: Date | string;
  isActive?: boolean;
  /** Ancre vers le classement, affichée quand les votes sont clôturés */
  resultsHref?: string;
}

// Horloge partagée : une valeur par seconde côté client, null pendant le rendu serveur
// (évite les écarts d'hydratation sans setState dans un effet).
const subscribeClock = (onTick: () => void) => {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
};
const getNowSeconds = () => Math.floor(Date.now() / 1000);
const getServerNow = () => null;

function splitDuration(totalSeconds: number) {
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

/** Chiffre qui défile verticalement jusqu'à sa valeur, façon compteur mécanique. */
function RollingDigit({ digit }: { digit: number }) {
  return (
    <span className="relative inline-block h-[1.2em] overflow-hidden leading-[1.2em]" aria-hidden>
      <span
        className="block transition-transform duration-500 ease-out motion-reduce:transition-none"
        style={{ transform: `translateY(-${digit * 10}%)` }}
      >
        {Array.from({ length: 10 }, (_, d) => (
          <span key={d} className="block h-[1.2em]">
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

const UNIT_LABELS = [
  { key: "days", label: "Jours" },
  { key: "hours", label: "Heures" },
  { key: "minutes", label: "Minutes" },
  { key: "seconds", label: "Secondes" },
] as const;

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl font-serif font-bold text-primary dark:text-white mb-8">{children}</h2>
  );
}

export default function CountdownTimer({ endDate, startDate, isActive = true, resultsHref }: CountdownTimerProps) {
  const now = useSyncExternalStore(subscribeClock, getNowSeconds, getServerNow);
  const end = Math.floor(new Date(endDate).getTime() / 1000);
  const start = startDate ? Math.floor(new Date(startDate).getTime() / 1000) : null;

  if (now === null) {
    // Squelette pendant le rendu serveur
    return (
      <>
        <Heading>&nbsp;</Heading>
        <div className="grid grid-cols-4 gap-3 md:gap-6 w-full max-w-2xl animate-pulse">
          {UNIT_LABELS.map(({ label }) => (
            <div key={label} className="h-24 md:h-28 rounded-2xl bg-primary/5 dark:bg-white/5" />
          ))}
        </div>
      </>
    );
  }

  if (!isActive || now >= end) {
    const suspended = !isActive && now < end;
    return (
      <>
        <Heading>{suspended ? "Votes suspendus" : "Votes clôturés"}</Heading>
        <div className="flex flex-col items-center space-y-3 text-foreground/60">
          {suspended ? <Lock size={32} className="text-red-400" /> : <Trophy size={32} className="text-accent" />}
          <p className="text-sm max-w-md">
            {suspended
              ? "Les votes sont momentanément suspendus par l'organisation."
              : "Le concours est terminé. Merci à toutes et à tous pour votre soutien !"}
          </p>
          {!suspended && resultsHref && (
            <a
              href={resultsHref}
              className="inline-flex items-center gap-2 mt-2 px-6 py-3 rounded-full bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
            >
              <span>Voir le classement final</span>
              <ArrowDown size={16} />
            </a>
          )}
        </div>
      </>
    );
  }

  const upcoming = start !== null && now < start;
  const remaining = splitDuration((upcoming ? start : end) - now);

  return (
    <>
      <Heading>{upcoming ? "Ouverture des votes dans" : "Clôture des votes dans"}</Heading>
      <div className="grid grid-cols-4 gap-3 md:gap-6 w-full max-w-2xl">
        {UNIT_LABELS.map(({ key, label }) => {
          const value = remaining[key];
          const isSeconds = key === "seconds";
          return (
            <div
              key={key}
              aria-label={`${value} ${label.toLowerCase()}`}
              className={`flex flex-col items-center justify-center py-4 md:py-5 rounded-2xl border shadow-sm ${
                isSeconds
                  ? "bg-accent/10 border-accent/30 text-accent"
                  : "bg-primary/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-primary dark:text-white"
              }`}
            >
              <span className="flex text-3xl sm:text-4xl md:text-5xl font-bold font-serif tabular-nums mb-2">
                {String(value)
                  .padStart(2, "0")
                  .split("")
                  .map((d, i) => (
                    <RollingDigit key={i} digit={Number(d)} />
                  ))}
              </span>
              <span className={`text-[10px] sm:text-xs uppercase tracking-[0.2em] ${isSeconds ? "font-bold" : "font-medium text-foreground/50"}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}
