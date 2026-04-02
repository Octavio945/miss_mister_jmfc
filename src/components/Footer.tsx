import { TransitionLink as Link } from "@/components/TransitionLink";
import { Facebook, Mail, Phone, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#051024] text-white py-16 border-t-[4px] border-accent">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
        
        {/* Logo & About */}
        <div className="space-y-4">
          <h3 className="font-serif text-2xl font-bold text-accent">
            Miss & Mister <span className="text-white">JMFC</span>
          </h3>
          <p className="text-white/70 max-w-sm">
            Jeunesse Missionnaire Foi et Culture Catholique du Bénin. Un concours valorisant la foi, la culture, et l'élégance chrétienne pour l'Édition 2026.
          </p>
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <h4 className="font-serif text-xl font-bold text-white">Liens Rapides</h4>
          <ul className="space-y-2">
            <li>
              <Link href="/" className="text-white/70 hover:text-accent transition-colors">Accueil</Link>
            </li>
            <li>
              <Link href="/participants" className="text-white/70 hover:text-accent transition-colors">Candidats & Votes</Link>
            </li>
            <li>
              <Link href="/a-propos" className="text-white/70 hover:text-accent transition-colors">À Propos du Projet</Link>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div className="space-y-4">
          <h4 className="font-serif text-xl font-bold text-white">Contactez-nous</h4>
          <ul className="space-y-3">
            <li className="flex items-center space-x-3 text-white/70">
              <Phone size={18} className="text-accent" />
              <span>+229 01 59 13 15 86 / 01 44 43 30 58</span>
            </li>
            <li className="flex items-center space-x-3 text-white/70">
              <Mail size={18} className="text-accent" />
              <a href="mailto:missmisterjmfccatholique@gmail.com" className="hover:text-accent transition-colors break-all">
                missmisterjmfccatholique@gmail.com
              </a>
            </li>
            <div className="flex space-x-4 pt-2">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-accent hover:text-primary transition-all">
                <Facebook size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-accent hover:text-primary transition-all">
                <Instagram size={18} />
              </a>
            </div>
          </ul>
        </div>

      </div>
      
      <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/10 text-center text-white/50 text-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <p>&copy; {new Date().getFullYear()} Miss & Mister JMFC Catholique du Bénin. Tous droits réservés.</p>
        <Link href="/admin/login" className="hover:text-accent transition-colors flex items-center gap-1">
          Accès Admin
        </Link>
      </div>
    </footer>
  );
}
