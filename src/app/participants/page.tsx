import { TransitionLink as Link } from "@/components/TransitionLink";
import Image from "next/image";
import { ArrowRight, Trophy } from "lucide-react";

const mockCandidates = [
  { id: 1, name: "Priscilla KPOVIESSI", category: "Miss", number: "01", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800", votes: 1450 },
  { id: 2, name: "Marc AHOUANDJINOU", category: "Mister", number: "01", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800", votes: 1200 },
  { id: 3, name: "Gloria DOSSA", category: "Miss", number: "02", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800", votes: 980 },
  { id: 4, name: "Jean-Paul KOUASSI", category: "Mister", number: "02", image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=800", votes: 850 },
  { id: 5, name: "Afiwa MENSAH", category: "Miss", number: "03", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=800", votes: 720 },
  { id: 6, name: "Jules DOSSOU", category: "Mister", number: "03", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=800", votes: 640 },
];

export default function ParticipantsPage() {
  return (
    <div className="pt-24 pb-20 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary dark:text-white mb-4">
            Candidats Officiels
          </h1>
          <p className="text-foreground/70 text-lg">
            Découvrez les visages de l'édition 2026. Soutenez votre candidat(e) favori(e) et contribuez au rayonnement de notre paroisse.
          </p>
        </div>

        {/* Tab / Filter (Static for now) */}
        <div className="flex justify-center space-x-4 mb-12">
          <button className="px-6 py-2 rounded-full bg-primary text-white font-medium">Tous</button>
          <button className="px-6 py-2 rounded-full border border-black/10 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5 font-medium transition-colors">Miss</button>
          <button className="px-6 py-2 rounded-full border border-black/10 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5 font-medium transition-colors">Mister</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {mockCandidates.map((candidate) => (
            <div key={candidate.id} className="group flex flex-col bg-white dark:bg-black rounded-2xl overflow-hidden border border-black/5 dark:border-white/10 shadow-sm hover:shadow-xl transition-all duration-300">
              
              <div className="relative aspect-[4/5] overflow-hidden bg-black/5 dark:bg-white/5">
                <Image 
                  src={candidate.image} 
                  alt={candidate.name} 
                  fill 
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-primary flex items-center space-x-1 border border-white/20 shadow-sm">
                  <span>{candidate.category}</span>
                  <span className="text-accent">N°{candidate.number}</span>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-2xl font-serif font-bold text-primary dark:text-white mb-2">{candidate.name}</h3>
                
                <div className="flex items-center space-x-2 text-foreground/60 mb-6">
                  <Trophy size={16} className="text-accent" />
                  <span className="font-medium">{candidate.votes.toLocaleString()} votes actuels</span>
                </div>
                
                <div className="mt-auto">
                  <Link 
                    href={`/participants/${candidate.id}`} 
                    className="flex items-center justify-between w-full px-5 py-3 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors group/btn"
                  >
                    <span className="font-medium">Voter {candidate.name.split(' ')[0]}</span>
                    <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
              
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
