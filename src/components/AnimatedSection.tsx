"use client";

import { motion, useInView, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { useRef, useState } from "react";
import Image from "next/image";

// FadeIn directionnel simple
export function FadeIn({ children, delay = 0, className = "", direction = "up" }: any) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });

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
export function StaggerContainer({ children, className = "", delayOrder = 0.15 }: any) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10% 0px" }}
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

export function StaggerItem({ children, className = "" }: any) {
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
export function TextReveal({ text, className = "", delay = 0 }: any) {
  const words = text.split(" ");
  return (
    <motion.div 
      initial="hidden" 
      whileInView="visible" 
      viewport={{ once: true, margin: "-10% 0px" }} 
      variants={{ visible: { transition: { staggerChildren: 0.05, delayChildren: delay } }, hidden: {} }} 
      className={`flex flex-wrap justify-center ${className}`}
    >
      {words.map((w: string, i: number) => (
        <span key={i} className="overflow-hidden inline-block mr-[0.25em]">
          <motion.span 
            variants={{ 
              hidden: { y: "150%", rotate: 10, opacity: 0 }, 
              visible: { y: "0%", rotate: 0, opacity: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } } 
            }} 
            className="inline-block origin-bottom-left"
          >
            {w}
          </motion.span>
        </span>
      ))}
    </motion.div>
  );
}

// Parallax Image Background
export function ParallaxHeroImage({ src, alt }: { src: string, alt: string }) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, 300]); // Bouge l'image plus lentement que le scroll
  
  return (
    <motion.div style={{ y }} className="absolute inset-0 z-0 w-full h-[120%] -top-[10%]">
      <Image 
        src={src}
        alt={alt}
        fill
        sizes="100vw"
        className="object-cover object-center"
        priority
      />
    </motion.div>
  );
}

// Bouton Magnétique de Folie
export function MagneticButton({ children, className = "", onClick }: any) {
  const ref = useRef<HTMLButtonElement>(null);
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
      ref={ref as any}
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
export function TiltCard({ children, className = "" }: any) {
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
