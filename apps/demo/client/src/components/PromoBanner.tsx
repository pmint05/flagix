import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DEMO_SERVER_URL } from '@/lib/constants';
import type { EvaluationContext } from '@flagix/sdk-core';

interface PromoBannerProps {
  activeContext: EvaluationContext;
}

export function PromoBanner({ activeContext }: PromoBannerProps) {
  const [showPromo, setShowPromo] = useState(false);
  const [scenario, setScenario] = useState('');

  useEffect(() => {
    const ctx = JSON.stringify(activeContext);
    fetch(`${DEMO_SERVER_URL}/api/content/hero?context=${encodeURIComponent(ctx)}`)
      .then((r) => r.json())
      .then((d) => {
        setShowPromo(d.promoActive);
        const promoScenario = Array.isArray(d.scenario)
          ? d.scenario.find((s: string) => s.includes('Promo Banner')) || ''
          : '';
        setScenario(promoScenario);
      })
      .catch(() => setShowPromo(false));
  }, [activeContext]);

  return (
    <>
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
      {scenario && (
        <div className="mx-auto max-w-7xl px-6 pt-1 text-center text-xs text-muted-foreground font-mono">
          {scenario}
        </div>
      )}
    </>
  );
}
