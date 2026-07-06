import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'motion/react';
import { SlidersIcon, XIcon } from '@phosphor-icons/react';

interface FloatingConfigButtonProps {
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function FloatingConfigButton({ isOpen, onToggle, children }: FloatingConfigButtonProps) {
  const constraintsRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const isDragging = useRef(false);

  const measure = useCallback(() => {
    const el = buttonRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const panelW = 400;
    const panelH = 360;

    const spaceBelow = vh - rect.bottom;
    const spaceRight = vw - rect.left;

    const style: React.CSSProperties = {};

    if (spaceBelow >= panelH) {
      style.top = rect.height + 8;
    } else {
      style.bottom = rect.height + 8;
    }

    if (spaceRight >= panelW) {
      style.left = 0;
    } else {
      style.right = 0;
    }

    setPanelStyle(style);
  }, []);

  useEffect(() => {
    if (isOpen) measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [isOpen, measure]);

  return (
    <div ref={constraintsRef} className="pointer-events-none fixed inset-0 z-50">
      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.05}
        dragMomentum={false}
        onDragStart={() => {
          isDragging.current = true;
        }}
        onDrag={(_e: unknown, _info: PanInfo) => {
          measure();
        }}
        onDragEnd={(_e: unknown, _info: PanInfo) => {
          setTimeout(() => {
            isDragging.current = false;
          }, 0);
        }}
        className="pointer-events-auto fixed bottom-6 right-6 z-50"
        style={{ touchAction: 'none' }}
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute w-[400px] max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card shadow-2xl"
              style={panelStyle}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>

        <div
          ref={buttonRef}
          onClick={() => {
            if (isDragging.current) return;
            onToggle();
          }}
          className="flex h-12 w-12 cursor-grab items-center justify-center rounded-xl border border-border bg-card text-foreground shadow-lg transition-colors hover:border-accent/30 active:cursor-grabbing"
        >
          {isOpen ? (
            <XIcon className="h-5 w-5" weight="bold" />
          ) : (
            <SlidersIcon className="h-5 w-5" weight="bold" />
          )}
        </div>
      </motion.div>
    </div>
  );
}
