"use client";

import { useEffect, useState } from "react";
import { Clock, Lock } from "lucide-react";

interface CountdownTimerProps {
  endDate: Date | string;
  startDate?: Date | string;
  isActive?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(end: Date): TimeLeft | null {
  const diff = end.getTime() - Date.now();
  if (diff <= 0) return null;

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function CountdownTimer({ endDate, startDate, isActive = true }: CountdownTimerProps) {
  const end = new Date(endDate);
  const start = startDate ? new Date(startDate) : null;

  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() => calculateTimeLeft(end));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => {
      setTimeLeft(calculateTimeLeft(end));
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted) {
    // SSR skeleton pour éviter hydration mismatch
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 w-full max-w-2xl animate-pulse">
        {["Jours", "Heures", "Minutes", "Secondes"].map((label) => (
          <div key={label} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-primary/5 border border-black/5 dark:border-white/10">
            <span className="text-4xl md:text-5xl font-bold font-serif mb-1 text-primary/20 dark:text-white/20">--</span>
            <span className="text-xs uppercase tracking-[0.2em] font-medium text-foreground/50">{label}</span>
          </div>
        ))}
      </div>
    );
  }

  // Votes bloqués par l'admin ou temps écoulé
  if (!isActive || !timeLeft) {
    return (
      <div className="flex flex-col items-center space-y-3 text-foreground/60 py-4">
        <Lock size={32} className="text-red-400" />
        <p className="font-semibold text-xl text-primary dark:text-white">Votes clôturés</p>
        <p className="text-sm">
          {!isActive 
            ? "L'administration a suspendu les votes pour cet événement." 
            : "L'événement est terminé. Merci pour votre participation !"}
        </p>
      </div>
    );
  }

  // Votes pas encore ouverts
  if (start && Date.now() < start.getTime()) {
    return (
      <div className="flex flex-col items-center space-y-3 text-foreground/60 py-4">
        <Clock size={32} className="text-accent opacity-60" />
        <p className="font-semibold text-lg">Les votes n&apos;ont pas encore commencé</p>
        <p className="text-sm">Ouverture le {start.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
      </div>
    );
  }

  const units = [
    { label: "Jours", val: timeLeft.days, accent: false },
    { label: "Heures", val: timeLeft.hours, accent: false },
    { label: "Minutes", val: timeLeft.minutes, accent: false },
    { label: "Secondes", val: timeLeft.seconds, accent: true },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 w-full max-w-2xl">
      {units.map(({ label, val, accent }) => (
        <div
          key={label}
          className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-transform hover:scale-110 duration-500 shadow-lg ${
            accent
              ? "bg-accent/10 border-accent/20 text-accent ring-[1px] ring-accent/30"
              : "bg-primary/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-primary dark:text-white"
          }`}
        >
          <span className="text-4xl md:text-5xl font-bold font-serif mb-1 drop-shadow-md tabular-nums">
            {String(val).padStart(2, "0")}
          </span>
          <span className={`text-xs uppercase tracking-[0.2em] ${accent ? "font-bold" : "font-medium text-foreground/50"}`}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
