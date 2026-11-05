import { TransitionLink as Link } from "@/components/TransitionLink";
import { Facebook, Mail, Phone, Instagram, Heart } from "lucide-react";
import Image from "next/image";
import FooterReveal from "@/components/motion/FooterReveal";

export default function Footer() {
  return (
    // md:sticky + -z-10 : le pied de page reste fixe sous la page, qui glisse et le dévoile en arrivant en bas
    <footer className="bg-[#030E1F] text-white relative overflow-hidden md:sticky md:bottom-0 md:-z-10">
      {/* Ligne dorée supérieure */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent" />

      {/* Halos décoratifs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/4 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent/3 rounded-full blur-[100px] pointer-events-none" />

      {/* Pattern subtil */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }}
      />

      <FooterReveal className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

          {/* Logo & About */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14 flex-shrink-0">
                <Image src="/images/logo.png" alt="Logo Miss & Mister JMFC" fill sizes="56px" className="object-contain drop-shadow-lg" />
              </div>
              <div>
                <p className="font-serif text-accent font-bold text-lg leading-tight">Miss & Mister</p>
                <p className="font-serif text-white font-bold text-2xl leading-tight">JMFC</p>
              </div>
            </div>
            <p className="text-white/55 text-sm leading-relaxed max-w-xs">
              Jeunesse Missionnaire Foi et Culture Catholique du Bénin. Un concours valorisant la foi, la culture, et l&apos;élégance chrétienne.
            </p>
            {/* Réseaux sociaux */}
            <div className="flex gap-3">
              <a
                href="https://www.facebook.com/profile.php?id=61572834736178"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook JMFC"
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-accent hover:text-primary hover:border-accent transition-all duration-300"
              >
                <Facebook size={16} />
              </a>
              <a
                href="https://www.instagram.com/missmisterjmfc/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram JMFC"
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-accent hover:text-primary hover:border-accent transition-all duration-300"
              >
                <Instagram size={16} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-5">
            <h4 className="font-serif text-lg font-bold text-white flex items-center gap-3">
              <span className="w-6 h-[1px] bg-accent" />
              Liens Rapides
            </h4>
            <ul className="space-y-2.5">
              {[
                { href: "/", label: "Accueil" },
                { href: "/participants", label: "Candidats & Votes" },
                { href: "/historique", label: "Historique des éditions" },
                { href: "/a-propos", label: "À Propos du Projet" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-white/55 hover:text-accent transition-colors duration-200 text-sm flex items-center gap-2 group"
                  >
                    <span className="w-0 h-[1px] bg-accent group-hover:w-3 transition-all duration-300" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-5">
            <h4 className="font-serif text-lg font-bold text-white flex items-center gap-3">
              <span className="w-6 h-[1px] bg-accent" />
              Contactez-nous
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-white/55 group">
                <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Phone size={14} className="text-accent" />
                </div>
                <span className="text-sm leading-relaxed">
                  +229 01 59 13 15 86<br />
                  +229 01 44 43 30 58
                </span>
              </li>
              <li className="flex items-start gap-3 text-white/55 group">
                <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Mail size={14} className="text-accent" />
                </div>
                <a
                  href="mailto:missmisterjmfccatholique@gmail.com"
                  className="text-sm hover:text-accent transition-colors break-all leading-relaxed"
                >
                  missmisterjmfccatholique@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-white/8">
          {/* Ligne déco */}
          <div className="h-[1px] bg-gradient-to-r from-transparent via-accent/20 to-transparent mb-8" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-white/35 text-xs">
            <p className="flex items-center gap-1">
              &copy; {new Date().getFullYear()} Miss & Mister JMFC Catholique du Bénin.
              <span className="hidden md:inline">Tous droits réservés.</span>
            </p>
            <p className="flex items-center gap-1">
              Fait avec <Heart size={10} className="text-accent fill-accent mx-0.5" /> pour la jeunesse
            </p>
            <Link href="/admin/login" className="hover:text-accent transition-colors">
              Accès Admin
            </Link>
          </div>
        </div>
      </FooterReveal>
    </footer>
  );
}
