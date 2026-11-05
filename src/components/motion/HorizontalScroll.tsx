"use client";

// Galerie horizontale pilotée par le défilement vertical (ordinateur) :
// la section reste fixe à l'écran pendant que les cartes passent de droite à gauche,
// puis le défilement normal reprend.
// Sur téléphone, ou si l'appareil demande moins d'animations : simple liste verticale.

import { Children, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";

const QUERY = "(min-width: 768px) and (prefers-reduced-motion: no-preference)";
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};
const getSnapshot = () => window.matchMedia(QUERY).matches;
const getServerSnapshot = () => false;

interface Props {
  children: React.ReactNode;
  /** Classes de chaque carte en mode horizontal (largeur) */
  itemClassName?: string;
}

export default function HorizontalScroll({ children, itemClassName = "w-[min(78vw,880px)]" }: Props) {
  const horizontal = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const items = Children.toArray(children);

  if (!horizontal || items.length < 2) {
    return <div className="space-y-10">{children}</div>;
  }
  return <HorizontalTrack items={items} itemClassName={itemClassName} />;
}

function HorizontalTrack({ items, itemClassName }: { items: React.ReactNode[]; itemClassName: string }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  // Distance horizontale à parcourir = largeur de la piste - largeur visible
  const [distance, setDistance] = useState(0);
  const distanceValue = useMotionValue(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      const d = Math.max(0, track.scrollWidth - window.innerWidth);
      setDistance(d);
      distanceValue.set(d);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [distanceValue]);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const x = useSpring(
    useTransform([scrollYProgress, distanceValue], ([p, d]: number[]) => -p * d),
    { stiffness: 120, damping: 30, mass: 0.4 }
  );
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  return (
    // Hauteur = un écran + la distance horizontale : chaque pixel descendu fait avancer d'un pixel
    <div ref={sectionRef} style={{ height: `calc(100vh + ${distance}px)` }} className="relative w-screen ml-[calc(50%-50vw)]">
      <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">
        <motion.div ref={trackRef} style={{ x }} className="flex gap-8 px-[8vw] w-max">
          {items.map((item, i) => (
            <div key={i} className={`shrink-0 ${itemClassName}`}>
              {item}
            </div>
          ))}
        </motion.div>

        {/* Progression dans la galerie */}
        <div className="mt-10 mx-auto w-48 h-[2px] rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
          <motion.div style={{ scaleX: progress }} className="h-full origin-left bg-accent" />
        </div>
      </div>
    </div>
  );
}
