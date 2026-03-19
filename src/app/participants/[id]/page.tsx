import { TransitionLink as Link } from "@/components/TransitionLink";
import Image from "next/image";
import { ArrowLeft, CheckCircle2, Trophy, Share2, ArrowRight } from "lucide-react";

// Mock data
const mockCandidates = [
  { id: "1", name: "Priscilla KPOVIESSI", category: "Miss", number: "01", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800", votes: 1450, description: "Étudiante en Droit, passionnée par la culture béninoise et engagée dans la chorale paroissiale." },
  { id: "2", name: "Marc AHOUANDJINOU", category: "Mister", number: "01", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800", votes: 1200, description: "Jeune entrepreneur, responsable des jeunes de la paroisse." },
];

export default async function ParticipantDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const candidate = mockCandidates.find(c => c.id === id) || mockCandidates[0];

  return (
    <div className="pt-24 pb-20 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Navigation */}
        <Link href="/participants" className="inline-flex items-center space-x-2 text-foreground/60 hover:text-accent font-medium mb-10 transition-colors">
          <ArrowLeft size={20} />
          <span>Retour aux candidats</span>
        </Link>

        {/* Candidate Profile */}
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-start">
          
          {/* Image & Stats */}
          <div className="space-y-6">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-white/5 bg-black/5 dark:bg-white/5">
              <Image 
                src={candidate.image} 
                alt={candidate.name} 
                fill 
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover" 
                priority
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-8">
                <div className="flex items-end justify-between">
                  <div className="text-white">
                    <p className="text-accent font-bold tracking-widest uppercase text-sm mb-1">{candidate.category} N°{candidate.number}</p>
                    <h1 className="text-4xl font-serif font-bold">{candidate.name}</h1>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center space-x-4">
              <button className="flex items-center space-x-2 px-6 py-3 rounded-full bg-white dark:bg-black border border-black/5 dark:border-white/10 hover:shadow-md transition-all">
                <Share2 size={18} className="text-foreground/70" />
                <span className="font-medium">Partager le profil</span>
              </button>
            </div>
          </div>

          {/* Voting Action */}
          <div className="bg-white dark:bg-[#111] p-8 md:p-10 rounded-3xl shadow-xl border border-black/5 dark:border-white/5 sticky top-32">
            
            <div className="flex items-center justify-between mb-8 pb-8 border-b border-black/5 dark:border-white/10">
              <div>
                <p className="text-sm font-medium text-foreground/50 uppercase tracking-widest mb-1">Score Actuel</p>
                <div className="flex items-center space-x-3 text-3xl font-serif font-bold">
                  <Trophy className="text-accent" size={32} />
                  <span>{candidate.votes.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-serif font-bold mb-4">Soutenez {candidate.name.split(' ')[0]}</h2>
              <p className="text-foreground/70 leading-relaxed">
                Chaque vote compte ! Soutenez votre candidat en achetant des votes sécurisés via Mobile Money. 
              </p>
            </div>

            <div className="space-y-6">
              
              <div className="bg-primary/5 dark:bg-white/5 rounded-2xl p-6 border border-primary/10 dark:border-white/10 flex items-start space-x-4">
                <CheckCircle2 className="text-accent flex-shrink-0 mt-0.5" size={24} />
                <div>
                  <h4 className="font-bold text-primary dark:text-white">Vote sécurisé Mobile Money</h4>
                  <p className="text-sm text-foreground/70 mt-1">Paiement rapide et sécurisé via FedaPay (MTN, Moov).</p>
                </div>
              </div>
              
              <Link 
                href="/checkout"
                className="w-full h-16 rounded-full bg-primary text-white flex items-center justify-center space-x-2 text-lg font-medium hover:bg-primary/90 transition-transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
              >
                <span>Acheter des Votes</span>
                <ArrowRight size={20} />
              </Link>
              
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
}
