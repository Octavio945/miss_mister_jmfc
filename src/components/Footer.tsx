import { TransitionLink as Link } from "@/components/TransitionLink";
import { Facebook, Mail, Phone, Instagram } from "lucide-react";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-[#051024] text-white py-16 border-t-[4px] border-accent">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
        
        {/* Logo & About */}
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 flex-shrink-0">
                <Image
                  src="/images/logo.png"
                  alt="Logo Miss & Mister JMFC"
                  fill
                  className="object-contain drop-shadow-lg"
                />
            </div>
            <h3 className="font-serif text-2xl font-bold leading-tight">
              Miss &amp; Mister <span className="text-accent">JMFC</span>
            </h3>
          </div>
          <p className="text-white/70 max-w-sm text-sm leading-relaxed">
            Jeunesse Missionnaire Foi et Culture Catholique du Bénin. Un concours valorisant la foi, la culture, et l&apos;élégance chrétienne pour l&apos;Édition 2026.
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
              <Link href="/participants" className="text-white/70 hover:text-accent transition-colors">Candidats &amp; Votes</Link>
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
              <Phone size={18} className="text-accent flex-shrink-0" />
              <span className="text-sm">+229 01 59 13 15 86 / 01 44 43 30 58</span>
            </li>
            <li className="flex items-center space-x-3 text-white/70">
              <Mail size={18} className="text-accent flex-shrink-0" />
              <a href="mailto:missmisterjmfccatholique@gmail.com" className="hover:text-accent transition-colors break-all text-sm">
                missmisterjmfccatholique@gmail.com
              </a>
            </li>
            <div className="flex space-x-4 pt-2">
              <a
                href="https://www.facebook.com/profile.php?id=61572834736178"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook JMFC"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-accent hover:text-primary transition-all duration-300"
              >
                <Facebook size={18} />
              </a>
              <a
                href="https://www.instagram.com/missmisterjmfc/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram JMFC"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-accent hover:text-primary transition-all duration-300"
              >
                <Instagram size={18} />
              </a>
            </div>
          </ul>
        </div>

      </div>
      
      <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/10 text-center text-white/50 text-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <p>&copy; {new Date().getFullYear()} Miss &amp; Mister JMFC Catholique du Bénin. Tous droits réservés.</p>
        <Link href="/admin/login" className="hover:text-accent transition-colors flex items-center gap-1">
          Accès Admin
        </Link>
      </div>
    </footer>
  );
}
