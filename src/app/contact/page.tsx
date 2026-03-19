import { Mail, Phone, MapPin } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="pt-32 pb-20 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-start">
        
        {/* Informations */}
        <div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary dark:text-white mb-6">Nous Contacter</h1>
          <p className="text-foreground/70 text-lg mb-12">
            Que ce soit pour une question sur le vote, pour devenir sponsor officiel de l'événement, ou simplement encourager le projet, n'hésitez pas à nous joindre !
          </p>
          
          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent flex-shrink-0 mt-1">
                <Phone size={24} />
              </div>
              <div>
                <h3 className="font-bold text-xl text-primary dark:text-white">Téléphone / WhatsApp</h3>
                <p className="text-foreground/70 mt-1">+229 01 59 13 15 86</p>
                <p className="text-foreground/70">+229 01 44 43 30 58</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent flex-shrink-0 mt-1">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="font-bold text-xl text-primary dark:text-white">Email</h3>
                <a href="mailto:missmisterjmfccatholique@gmail.com" className="text-foreground/70 mt-1 hover:text-accent transition-colors">
                  missmisterjmfccatholique@gmail.com
                </a>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent flex-shrink-0 mt-1">
                <MapPin size={24} />
              </div>
              <div>
                <h3 className="font-bold text-xl text-primary dark:text-white">Localisation</h3>
                <p className="text-foreground/70 mt-1">Paroisse de Tchonvi, Bénin.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Formulaire (Visuel staitque uniquement) */}
        <div className="bg-white dark:bg-black/50 p-8 md:p-10 rounded-3xl shadow-xl border border-black/5 dark:border-white/10">
          <h2 className="text-2xl font-serif font-bold mb-6">Envoyez-nous un message</h2>
          <form className="space-y-6">
            <div>
              <label className="text-sm font-medium text-foreground/70 block mb-2">Votre Nom</label>
              <input type="text" className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent" placeholder="Jean Dupont" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground/70 block mb-2">Votre Email</label>
              <input type="email" className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent" placeholder="jean@mail.com" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground/70 block mb-2">Objet</label>
              <select className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent text-foreground">
                <option>Assistance au vote</option>
                <option>Devenir sponsor/partenaire</option>
                <option>Autres questions</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground/70 block mb-2">Message</label>
              <textarea rows={4} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent resize-none" placeholder="Comment pouvons-nous vous aider ?"></textarea>
            </div>
            <button type="button" className="w-full py-4 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors shadow-lg">
              Envoyer le message
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
