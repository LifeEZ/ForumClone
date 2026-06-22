import type { Transition, Variants } from 'framer-motion';

export const springBouncy: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 22,
};

export const springGentle: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 28,
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      ...springGentle,
      delay: index * 0.04,
    },
  }),
};

export const fadeIn: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springGentle,
  },
};

export const fadeInDelayed: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...springGentle, delay: 0.08 },
  },
};
