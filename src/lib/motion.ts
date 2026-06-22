import type { Transition, Variants } from "motion/react";

export const gentleTransition: Transition = {
  duration: 0.28,
  ease: "easeOut",
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: gentleTransition },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: gentleTransition },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.08,
      staggerChildren: 0.1,
    },
  },
};
