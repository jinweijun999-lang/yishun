"use client";

import { motion } from "framer-motion";

export function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-12">
      <motion.div
        className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto glass card p-8 space-y-6"
    >
      <div className="flex items-center justify-center mb-8">
        <motion.div
          className="h-8 w-48 bg-surface/50 rounded-lg"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>

      <div className="space-y-3">
        <motion.div
          className="h-4 w-full bg-surface/50 rounded"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
        />
        <motion.div
          className="h-4 w-3/4 bg-surface/50 rounded"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
        />
        <motion.div
          className="h-4 w-5/6 bg-surface/50 rounded"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
        />
      </div>

      <div className="flex items-center justify-center gap-4 py-4">
        <motion.div
          className="h-20 w-20 rounded-full bg-surface/50"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
        />
        <motion.div
          className="h-6 w-24 bg-surface/50 rounded"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
        />
      </div>

      <div className="space-y-4 pt-4 border-t border-white/10">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="flex items-center gap-3"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 * i }}
          >
            <div className="w-8 h-8 rounded-lg bg-surface/50" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-20 rounded bg-surface/50" />
              <div className="h-3 w-full rounded bg-surface/50" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="pt-4 border-t border-white/10">
        <motion.div
          className="h-6 w-32 mx-auto rounded bg-surface/50 mb-3"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
        />
        <motion.div
          className="h-4 w-full rounded bg-surface/50"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.7 }}
        />
      </div>
    </motion.div>
  );
}

export function TypingLoader() {
  return (
    <div className="flex justify-center items-center gap-1 py-4">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-3 h-3 rounded-full bg-accent/80"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
}
