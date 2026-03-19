import { Sparkles, Crown } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-md">
      <div className="relative flex flex-col items-center justify-center">
        {/* Cercles tournants or et bleu */}
        <div className="w-28 h-28 border-4 border-transparent border-t-accent border-r-accent/50 rounded-full animate-spin"></div>
        <div className="absolute w-20 h-20 border-4 border-transparent border-b-primary/50 dark:border-b-white/50 border-l-primary dark:border-l-white rounded-full animate-[spin_1.5s_linear_reverse]"></div>
        
        {/* Icône centrale */}
        <div className="absolute inset-0 flex items-center justify-center animate-pulse">
          <Crown className="text-accent drop-shadow-lg" size={32} />
        </div>
      </div>
      
      <h2 className="mt-8 font-serif text-2xl font-bold tracking-widest text-primary dark:text-white uppercase animate-pulse">
        Chargement
      </h2>
      <div className="flex items-center space-x-2 mt-2">
        <Sparkles className="text-accent" size={14} />
        <p className="text-accent text-sm font-bold tracking-[0.2em] uppercase">L'Élégance en préparation</p>
        <Sparkles className="text-accent" size={14} />
      </div>
    </div>
  );
}
