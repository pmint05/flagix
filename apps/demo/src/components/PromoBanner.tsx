import { motion, AnimatePresence } from 'motion/react';
import { useFlag } from '@flagix/sdk-react';
import { FLAG_KEYS } from '@/lib/constants';

export function PromoBanner() {
  const { value: showPromo } = useFlag(FLAG_KEYS.PROMO_BANNER, false);

  return (
    <AnimatePresence>
      {showPromo && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="w-full overflow-hidden border-b border-border bg-foreground text-background"
        >
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-6 py-2.5 text-center text-sm font-medium">
            <span className="text-accent">New:</span>
            Platform update v2.4 is live with advanced targeting rules and real-time analytics.
            <a href="#demo" className="underline underline-offset-2 hover:text-accent transition-colors">
              Try it now
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
