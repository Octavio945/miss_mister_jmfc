// Chargement d'une page : même univers que le rideau de transition (bleu nuit, logo, trait doré)
import Image from "next/image";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[99999] bg-[#020617] flex flex-col items-center justify-center gap-5" role="status" aria-label="Chargement">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-accent/15 rounded-full blur-[100px]" />
      <div className="relative w-24 h-24 animate-pulse motion-reduce:animate-none">
        <Image src="/images/logo.png" alt="" fill sizes="96px" className="object-contain" priority />
      </div>
      <div className="relative w-40 h-[2px] bg-white/10 rounded-full overflow-hidden">
        <div className="h-full w-1/3 bg-gradient-to-r from-[#BF953F] via-[#F0D060] to-[#AA771C] animate-[loading-bar_1.2s_ease-in-out_infinite] motion-reduce:animate-none" />
      </div>
    </div>
  );
}
