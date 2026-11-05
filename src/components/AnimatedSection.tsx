"use client";

import { animate, motion, useInView, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePageRevealed } from "@/components/TransitionProvider";

/** À l'écran ET rideau de chargement levé : évite que l'animation se joue cachée derrière le rideau. */
export function useRevealInView(ref: React.RefObject<Element | null>) {
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });
  const revealed = usePageRevealed();
  return isInView && revealed;
}

// FadeIn directionnel simple
interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
}

export function FadeIn({ children, delay = 0, className = "", direction = "up" }: FadeInProps) {
  const ref = useRef(null);
  const isInView = useRevealInView(ref);

  const getDirectionOffset = () => {
    switch (direction) {
      case "up": return { y: 60, x: 0 };
      case "down": return { y: -60, x: 0 };
      case "left": return { x: 60, y: 0 };
      case "right": return { x: -60, y: 0 };
      default: return { x: 0, y: 0 };
    }
  };

  const offset = getDirectionOffset();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...offset, filter: "blur(10px)" }}
      animate={isInView ? { opacity: 1, x: 0, y: 0, filter: "blur(0px)" } : { opacity: 0, ...offset, filter: "blur(10px)" }}
      transition={{ duration: 1, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Conteneur de cascade (Stagger)
interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  delayOrder?: number;
}

export function StaggerContainer({ children, className = "", delayOrder = 0.15 }: StaggerContainerProps) {
  const ref = useRef(null);
  const isInView = useRevealInView(ref);
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        visible: { transition: { staggerChildren: delayOrder } },
        hidden: {}
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

export function StaggerItem({ children, className = "" }: StaggerItemProps) {
  return (
    <motion.div
      variants={{
        visible: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
        hidden: { opacity: 0, y: 40, scale: 0.95, filter: "blur(5px)" }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Effet d'écriture mot par mot cinématique
interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number;
  /** Si fourni, l'animation démarre quand play passe à true (au lieu de l'arrivée à l'écran) */
  play?: boolean;
  /** Classes appliquées à chaque mot (ex. gold-text, qui doit être sur l'élément qui porte le texte) */
  wordClassName?: string;
}

export function TextReveal({ text, className = "", delay = 0, play, wordClassName = "" }: TextRevealProps) {
  const words = text.split(" ");
  const ref = useRef(null);
  const isInView = useRevealInView(ref);
  const visible = play === undefined ? isInView : play;
  return (
    <motion.div 
      ref={ref}
      initial="hidden" 
      animate={visible ? "visible" : "hidden"}
      variants={{ visible: { transition: { staggerChildren: 0.05, delayChildren: delay } }, hidden: {} }} 
      className={`flex flex-wrap justify-center ${className}`}
    >
      {words.map((w: string, i: number) => (
        <span key={i} className="overflow-hidden inline-block mr-[0.25em] pb-[0.15em] -mb-[0.15em]">
          <motion.span 
            variants={{ 
              hidden: { y: "150%", rotate: 10, opacity: 0 }, 
              visible: { y: "0%", rotate: 0, opacity: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } } 
            }} 
            className={`inline-block origin-bottom-left ${wordClassName}`}
          >
            {w}
          </motion.span>
        </span>
      ))}
    </motion.div>
  );
}

// Parallax Image Background
export function ParallaxHeroImage({ src, alt, imageClassName = "object-cover object-center" }: { src: string, alt: string, imageClassName?: string }) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, 300]); // Bouge l'image plus lentement que le scroll
  
  return (
    <motion.div style={{ y }} className="absolute inset-0 z-0 w-full h-[120%] -top-[10%]">
      <Image 
        src={src}
        alt={alt}
        fill
        sizes="100vw"
        className={imageClassName}
        priority
      />
    </motion.div>
  );
}

// Bouton Magnétique de Folie
interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function MagneticButton({ children, className = "", onClick }: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current!.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.3, y: middleY * 0.3 });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Carte 3D Tilt Effect
interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
}

export function TiltCard({ children, className = "" }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const springConfig = { damping: 20, stiffness: 300 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], ["15deg", "-15deg"]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], ["-15deg", "15deg"]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current!.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={`relative ${className}`}
    >
      <div style={{ transform: "translateZ(50px)" }} className="absolute inset-0 pointer-events-none z-50"></div>
      {children}
    </motion.div>
  );
}

// ─── Animations liées au défilement ─────────────────────────────────────────

/** Nombre qui compte de 0 jusqu'à sa valeur quand il arrive à l'écran (format français). */
export function CountUp({ value, duration = 1.6, className = "" }: { value: number; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useRevealInView(ref);
  const count = useMotionValue(0);
  const text = useTransform(count, (v) => Math.round(v).toLocaleString("fr-FR"));

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(count, value, { duration, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [isInView, value, duration, count]);

  return (
    <motion.span ref={ref} className={`tabular-nums ${className}`}>
      {text}
    </motion.span>
  );
}

/** Trait doré qui se dessine de gauche à droite (ou depuis le centre) à l'arrivée à l'écran. */
export function DrawLine({ className = "", delay = 0.2, origin = "center" }: { className?: string; delay?: number; origin?: "left" | "center" }) {
  return (
    <motion.span
      aria-hidden
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`block h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent ${origin === "left" ? "origin-left" : "origin-center"} ${className}`}
    />
  );
}

/**
 * Couche de parallaxe : se déplace plus ou moins vite que la page.
 * speed > 0 : monte plus vite que le défilement ; speed < 0 : plus lentement (effet de profondeur).
 */
export function Parallax({ children, speed = 0.2, className = "" }: { children?: React.ReactNode; speed?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [speed * 200, speed * -200]);
  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

/** Image qui glisse doucement à l'intérieur de son cadre pendant le défilement. */
export function ParallaxImage({ src, alt, sizes, className = "", imageClassName = "object-cover", priority = false, unoptimized = false }: { src: string; alt: string; sizes: string; className?: string; imageClassName?: string; priority?: boolean; unoptimized?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  return (
    <div ref={ref} className={`absolute inset-0 overflow-hidden ${className}`}>
      <motion.div style={{ y }} className="absolute inset-x-0 -top-[10%] h-[120%]">
        <Image src={src} alt={alt} fill sizes={sizes} className={imageClassName} priority={priority} unoptimized={unoptimized} />
      </motion.div>
    </div>
  );
}

/**
 * Section qui « monte » en place : légèrement réduite et arrondie quand elle entre par le bas,
 * elle s'agrandit jusqu'à occuper toute la largeur. L'effet suit le défilement dans les deux sens.
 */
export function RiseSection({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.35"] });
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);
  const radius = useTransform(scrollYProgress, [0, 1], [48, 0]);
  return (
    <motion.section ref={ref} id={id} style={{ scale, borderRadius: radius }} className={`origin-top ${className}`}>
      {children}
    </motion.section>
  );
}

/** Nombre qui « roule » jusqu'à sa nouvelle valeur à chaque changement (ex. total à payer). */
export function AnimatedNumber({ value, className = "" }: { value: number; className?: string }) {
  const spring = useSpring(value, { stiffness: 180, damping: 26 });
  const text = useTransform(spring, (v) => Math.round(v).toLocaleString("fr-FR"));
  useEffect(() => {
    spring.set(value);
  }, [spring, value]);
  return <motion.span className={`tabular-nums ${className}`}>{text}</motion.span>;
}

/** Dévoilement « rideau » de bas en haut (photo de profil, bandeaux). */
export function ClipReveal({ children, className = "", delay = 0.1 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useRevealInView(ref);
  return (
    <motion.div
      ref={ref}
      initial={{ clipPath: "inset(100% 0% 0% 0%)", scale: 1.06 }}
      animate={visible ? { clipPath: "inset(0% 0% 0% 0%)", scale: 1 } : undefined}
      transition={{ duration: 1.2, delay, ease: [0.76, 0, 0.24, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
