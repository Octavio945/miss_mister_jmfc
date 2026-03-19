import { CheckCircle2 } from "lucide-react";

export default function ReglesPage() {
  return (
    <div className="pt-32 pb-20 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary dark:text-white mb-8 border-b border-black/10 dark:border-white/10 pb-6">Les Règles du Concours</h1>
        
        <div className="bg-white dark:bg-black/50 p-8 md:p-12 rounded-3xl shadow-sm border border-black/5 dark:border-white/10 text-lg text-foreground/80 leading-relaxed space-y-8">
          
          <div>
            <h2 className="text-2xl font-serif font-bold text-primary dark:text-white mb-4">1. Éthique et Valeurs Chrétiennes</h2>
            <p className="mb-4">
              Tous les participants doivent faire preuve d'un comportement irréprochable et refléter les valeurs de la foi catholique : le respect, l'humilité et l'amour du prochain.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-serif font-bold text-primary dark:text-white mb-4">2. Critères d'Évaluation</h2>
            <p className="mb-4">Les candidats seront rigoureusement évalués sur plusieurs épreuves :</p>
            <ul className="space-y-4 pt-2">
              <li className="flex items-start space-x-3 text-foreground/90">
                <CheckCircle2 className="text-accent flex-shrink-0 mt-1" size={20} />
                <span><strong>Danse moderne :</strong> Créativité et rythme.</span>
              </li>
              <li className="flex items-start space-x-3 text-foreground/90">
                <CheckCircle2 className="text-accent flex-shrink-0 mt-1" size={20} />
                <span><strong>Slam de panégyrique (Akor) :</strong> Éloquence en mode traditionnel.</span>
              </li>
              <li className="flex items-start space-x-3 text-foreground/90">
                <CheckCircle2 className="text-accent flex-shrink-0 mt-1" size={20} />
                <span><strong>Danse traditionnelle :</strong> Exécution authentique selon l'origine.</span>
              </li>
              <li className="flex items-start space-x-3 text-foreground/90">
                <CheckCircle2 className="text-accent flex-shrink-0 mt-1" size={20} />
                <span><strong>Parades et Speech oral :</strong> Parade solo moderne, parade d'ensemble moderne et traditionnelle (mode africain - bowunba).</span>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-serif font-bold text-primary dark:text-white mb-4">3. Système de Vote Public</h2>
            <p className="mb-4">
              Le vote public compte pour une partie substantielle du score final du candidat. Les votes sont illimités et s'effectuent via la plateforme Mobile Money. Le public est prié d'encourager ses candidats favoris de manière honnête et digne.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
