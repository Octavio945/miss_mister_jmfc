import Image from "next/image";
import { TransitionLink as Link } from "@/components/TransitionLink";
import RankBadge from "@/components/RankBadge";

export interface PodiumCandidate {
  id: string;
  name: string;
  number: number;
  imageUrl: string | null;
  totalVotes: number;
}

interface PodiumProps {
  title: string;
  /** Candidats triés par votes décroissants ; seuls les 3 premiers sont affichés. */
  candidates: PodiumCandidate[];
}

export default function Podium({ title, candidates }: PodiumProps) {
  const top = candidates.slice(0, 3);

  return (
    <div className="w-full">
      <h3 className="text-center text-2xl md:text-3xl font-serif font-bold text-primary dark:text-white mb-10">
        {title}
      </h3>

      {top.length === 0 ? (
        <p className="text-center text-foreground/50">Aucun candidat pour le moment.</p>
      ) : (
        <ol className="grid grid-cols-3 items-end gap-3 sm:gap-5 max-w-xl mx-auto">
          {top.map((candidate, index) => {
            const rank = index + 1;
            const isFirst = rank === 1;

            return (
              <li
                key={candidate.id}
                // Ordre du DOM = 1, 2, 3 (lecteurs d'écran) ; ordre visuel = 2e, 1er, 3e
                className={`flex flex-col items-center text-center ${isFirst ? "order-2" : rank === 2 ? "order-1" : "order-3"}`}
              >
                <Link href={`/participants/${candidate.id}`} className="group w-full flex flex-col items-center">
                  <div
                    className={`relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-primary/10 shadow-lg transition-transform duration-300 group-hover:-translate-y-1 ${
                      isFirst ? "ring-2 ring-accent shadow-accent/20 podium-shine" : "ring-1 ring-black/5 dark:ring-white/10"
                    }`}
                  >
                    {candidate.imageUrl ? (
                      <Image
                        src={candidate.imageUrl}
                        alt={candidate.name}
                        fill
                        sizes="(max-width: 640px) 33vw, 200px"
                        className="object-cover"
                        unoptimized={candidate.imageUrl.includes("dicebear")}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary/30 text-5xl font-serif font-bold">
                        {candidate.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  <RankBadge rank={rank} size={isFirst ? 44 : 36} className="-mt-6 relative z-10" />

                  <p className={`mt-2 font-serif font-bold leading-tight text-primary dark:text-white ${isFirst ? "text-base sm:text-lg" : "text-sm sm:text-base"}`}>
                    {candidate.name.trim()}
                  </p>
                  <p className="text-xs text-foreground/50">N°{String(candidate.number).padStart(2, "0")}</p>
                  <p className={`mt-1 font-bold tabular-nums ${isFirst ? "text-accent text-lg" : "text-foreground/80"}`}>
                    {candidate.totalVotes.toLocaleString("fr-FR")}
                    <span className="text-xs font-medium text-foreground/50"> votes</span>
                  </p>
                </Link>

                {/* Marche du podium */}
                <div
                  aria-hidden
                  className={`mt-3 w-full rounded-t-xl bg-gradient-to-b ${
                    isFirst
                      ? "h-16 sm:h-20 from-accent/40 to-accent/10"
                      : rank === 2
                        ? "h-10 sm:h-14 from-slate-300/50 to-slate-300/10"
                        : "h-6 sm:h-10 from-amber-700/30 to-amber-700/5"
                  }`}
                />
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
