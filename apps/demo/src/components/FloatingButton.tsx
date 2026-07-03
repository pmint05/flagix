import { motion } from 'motion/react';
import { SlidersIcon } from '@phosphor-icons/react';
import { useRef } from 'react';

interface FloatingButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export function FloatingButton({ isOpen, onClick }: FloatingButtonProps) {
  const constraintsRef = useRef<HTMLDivElement | null>(null);

  return (
    <div ref={constraintsRef} className="pointer-events-none fixed inset-0 z-50">
      <motion.button
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.05}
        dragMomentum={false}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className="pointer-events-auto fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card text-foreground shadow-lg transition-colors hover:border-accent/30 cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      >
        <SlidersIcon className="h-5 w-5" weight="bold" />
      </motion.button>
    </div>
  );
}
