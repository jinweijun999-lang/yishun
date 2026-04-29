"use client";

import { motion } from "framer-motion";

type Star = {
  id: number;
  x: string;
  y: string;
  size: string;
  delay: number;
  duration: number;
};

const seededValue = (seed: number) => {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
};

const formatDecimal = (value: number, digits = 4) => value.toFixed(digits);

const createStars = (count: number): Star[] =>
  Array.from({ length: count }, (_, i) => {
    const base = i + 1;
    return {
      id: i,
      x: formatDecimal(seededValue(base) * 100),
      y: formatDecimal(seededValue(base + 100) * 100),
      size: formatDecimal(seededValue(base + 200) * 2 + 1),
      delay: seededValue(base + 300) * 3,
      duration: seededValue(base + 400) * 3 + 2,
    };
  });

export default function Background() {
  const stars = createStars(24);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-aurora-gradient opacity-30 animate-aurora" />
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-primary/60 to-primary" />
      <div className="absolute left-1/2 top-[-180px] w-[520px] h-[520px] -translate-x-1/2 rounded-full border border-white/5 opacity-30" />
      <div className="absolute left-1/2 top-[-40px] w-[760px] h-[760px] -translate-x-1/2 rounded-full border border-white/5 opacity-15" />
      
      <div className="absolute inset-0">
        {stars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute rounded-full bg-[#d9d2c2]"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
            }}
            animate={{
              opacity: [0.08, 0.45, 0.08],
              scale: [1, 1.12, 1],
            }}
            transition={{
              duration: star.duration,
              delay: star.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <motion.div
        className="absolute w-52 h-52 rounded-full bg-secondary/12 blur-3xl"
        style={{ left: "14%", top: "16%" }}
        animate={{
          x: [0, 30, 0],
          y: [0, -30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute w-40 h-40 rounded-full bg-accent/10 blur-3xl"
        style={{ right: "18%", bottom: "20%" }}
        animate={{
          x: [0, -20, 0],
          y: [0, 20, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
