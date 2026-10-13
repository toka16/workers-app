"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Fades content up when it scrolls into view. The server renders it fully visible, so it reads fine
 * without JavaScript; after hydration only blocks still below the fold are hidden to fade in later.
 */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!reduce && el && el.getBoundingClientRect().top > window.innerHeight) setArmed(true);
  }, [reduce]);

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={false}
      animate={armed && !inView ? "hidden" : "shown"}
      variants={{
        hidden: { opacity: 0, y: 24, transition: { duration: 0 } },
        shown: { opacity: 1, y: 0, transition: { duration: 0.55, delay, ease: EASE } },
      }}
    >
      {children}
    </motion.div>
  );
}
