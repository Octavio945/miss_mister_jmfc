"use client";

// Curseur doré + halo lumineux qui suit la souris (ordinateur uniquement).
// - point doré qui suit exactement la souris, cercle qui le rattrape avec retard ;
// - le cercle grossit sur les liens/boutons et affiche le texte de data-cursor (« Voir », « Voter ») ;
// - désactivé sur écran tactile et quand l'appareil demande moins d'animations.

import { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";

const QUERY = "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};
const getSnapshot = () => window.matchMedia(QUERY).matches;
const getServerSnapshot = () => false;

type Hover = { kind: "none" } | { kind: "link" } | { kind: "label"; label: string } | { kind: "text" };

const INTERACTIVE = "a, button, [role='button'], label, select, summary";
const TEXT_FIELDS = "input, textarea, [contenteditable='true']";

export default function CursorEffects() {
  const enabled = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (!enabled) return null;
  return <Cursor />;
}

function Cursor() {
  const [hover, setHover] = useState<Hover>({ kind: "none" });
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 350, damping: 30, mass: 0.6 });
  const ringY = useSpring(y, { stiffness: 350, damping: 30, mass: 0.6 });
  const haloX = useSpring(x, { stiffness: 60, damping: 20 });
  const haloY = useSpring(y, { stiffness: 60, damping: 20 });

  useEffect(() => {
    document.documentElement.classList.add("custom-cursor");

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
    };
    const onOver = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target?.closest) return;
      const labelled = target.closest<HTMLElement>("[data-cursor]");
      if (labelled?.dataset.cursor) setHover({ kind: "label", label: labelled.dataset.cursor });
      else if (target.closest(TEXT_FIELDS)) setHover({ kind: "text" });
      else if (target.closest(INTERACTIVE)) setHover({ kind: "link" });
      else setHover({ kind: "none" });
    };
    const onLeave = () => setVisible(false);
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    return () => {
      document.documentElement.classList.remove("custom-cursor");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, [x, y]);

  const ringSize = hover.kind === "label" ? 76 : hover.kind === "link" ? 54 : 34;
  const hideCursor = !visible || hover.kind === "text";

  return (
    <>
      {/* Halo : lumière dorée très douce, en retard sur la souris */}
      <motion.div
        aria-hidden
        style={{ x: haloX, y: haloY }}
        animate={{ opacity: visible ? 1 : 0 }}
        className="fixed top-0 left-0 z-[45] pointer-events-none -ml-[260px] -mt-[260px] w-[520px] h-[520px] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.10)_0%,rgba(212,175,55,0.04)_40%,transparent_70%)]"
      />

      {/* Cercle */}
      <motion.div
        aria-hidden
        style={{ x: ringX, y: ringY }}
        className="fixed top-0 left-0 z-[100000] pointer-events-none"
      >
        <motion.div
          animate={{
            width: ringSize,
            height: ringSize,
            opacity: hideCursor ? 0 : 1,
            scale: pressed ? 0.85 : 1,
            backgroundColor: hover.kind === "label" ? "rgba(212,175,55,0.95)" : hover.kind === "link" ? "rgba(212,175,55,0.12)" : "rgba(212,175,55,0)",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="-translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/70 flex items-center justify-center"
        >
          <AnimatePresence>
            {hover.kind === "label" && (
              <motion.span
                key={hover.label}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                className="text-[11px] font-bold uppercase tracking-wider text-[#0F172A]"
              >
                {hover.label}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Point */}
      <motion.div
        aria-hidden
        style={{ x, y }}
        animate={{ opacity: hideCursor || hover.kind === "label" ? 0 : 1 }}
        transition={{ duration: 0.15 }}
        className="fixed top-0 left-0 z-[100001] pointer-events-none -ml-[3px] -mt-[3px] w-1.5 h-1.5 rounded-full bg-accent"
      />
    </>
  );
}
