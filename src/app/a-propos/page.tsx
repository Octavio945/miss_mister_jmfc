export default function AboutPage() {
  return (
    <div className="pt-32 pb-20 bg-background min-h-screen flex flex-col items-center">
      <div className="max-w-4xl mx-auto px-6 space-y-8">
        <div className="text-center mb-12">
          <span className="inline-block py-1 px-3 rounded-full bg-accent/10 text-accent font-medium text-sm tracking-wider uppercase mb-4">
            Genèse et Objectifs
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary dark:text-white">À Propos du Projet</h1>
        </div>
        
        <div className="bg-white dark:bg-black/50 p-8 md:p-12 rounded-3xl shadow-sm border border-black/5 dark:border-white/10 text-lg text-foreground/80 leading-relaxed space-y-6">
          <p>
            Ce projet est né à l’initiative de <strong>Hervé AKOTONOU</strong>, Mister Fair Play JEPET ENSET 2025 et Responsable de l’événement Miss & Mister ENSET 2026.
          </p>
          <p>
            En observant les conditions de préparation des jeunes ainsi que leurs prestations lors du défilé de la nuit du 31 décembre 2025, nous avons été profondément impressionnés par leur détermination et leur éloquence. 
            C’est ainsi que nous avons décidé de créer une plateforme permettant d’introduire ces jeunes dans le monde de la beauté et de la culture, tout en intégrant une forte dimension spirituelle.
          </p>
          <h2 className="text-2xl font-serif font-bold text-primary dark:text-white pt-6 border-t border-black/5 dark:border-white/10">
            Objectifs Principaux
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Valoriser la foi catholique en promouvant ses valeurs auprès des jeunes et des familles.</li>
            <li>Rapprocher les familles de l’Église.</li>
            <li>Développer les talents artistiques et culturels.</li>
            <li>Introduire les jeunes dans le monde de la beauté et de la culture béninoise.</li>
            <li>Inculquer des valeurs essentielles : respect de soi, discipline, rigueur et dynamisme.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
