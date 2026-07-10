'use client';

import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const PARTICLE_COUNT = 8;
/** White → warm orange, aligned with vote-up (#d97736). */
const PARTICLE_COLORS = ['#f5f0e8', '#f0dcc8', '#e8b07a', '#d97736'] as const;

interface BurstParticle {
  id: number;
  angle: number;
  distance: number;
  color: string;
  size: number;
  upwardBias: number;
  duration: number;
}

const ARC_SPREAD = Math.PI * 1.05;

function shuffledSectorIndices(count: number): number[] {
  const indices = Array.from({ length: count }, (_, index) => index);
  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

function createBurstParticles(count: number): BurstParticle[] {
  const sectorSize = ARC_SPREAD / count;
  const arcStart = -Math.PI / 2 - ARC_SPREAD / 2;
  const sectors = shuffledSectorIndices(count);

  return sectors.map((sector, id) => {
    const sectorCenter = arcStart + sectorSize * (sector + 0.5);
    // Jitter inside the sector so bursts still feel organic, not clock-like.
    const angle = sectorCenter + (Math.random() - 0.5) * sectorSize * 0.55;

    return {
      id,
      angle,
      distance: 18 + Math.random() * 24,
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      size: 6 + Math.random() * 4,
      upwardBias: 10 + Math.random() * 12,
      duration: 0.45 + Math.random() * 0.15,
    };
  });
}

interface PollenBurstProps {
  trigger: number;
}

export function PollenBurst({ trigger }: PollenBurstProps) {
  const burst = useMemo(() => {
    if (trigger <= 0) {
      return null;
    }
    return {
      id: trigger,
      particles: createBurstParticles(PARTICLE_COUNT),
    };
  }, [trigger]);

  if (!burst) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute -inset-6 overflow-visible"
      aria-hidden
    >
      <AnimatePresence>
        {burst.particles.map((particle) => (
          <motion.span
            key={`${burst.id}-${particle.id}`}
            className="absolute left-1/2 top-1/2 rounded-full shadow-[0_0_2px_currentColor]"
            style={{
              width: particle.size,
              height: particle.size,
              marginLeft: -particle.size / 2,
              marginTop: -particle.size / 2,
              backgroundColor: particle.color,
              color: particle.color,
            }}
            initial={{ opacity: 0.85, scale: 0.9, x: 0, y: 0 }}
            animate={{
              opacity: 0,
              scale: 0.35,
              x: Math.cos(particle.angle) * particle.distance,
              y: Math.sin(particle.angle) * particle.distance - particle.upwardBias,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: particle.duration, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
