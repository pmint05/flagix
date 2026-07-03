import { useState, useEffect, useCallback } from 'react';
import { FlagixClient, type EvaluationContext } from '@flagix/sdk-core';
import { FlagixProvider, useFlag, useFlagixReady } from '@flagix/sdk-react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { Pricing } from './components/Pricing';
import { Footer } from './components/Footer';
import { PromoBanner } from './components/PromoBanner';
import { FlagEvaluationLog } from './components/FlagEvaluationLog';
import { FloatingConfigButton } from './components/FloatingConfig';
import { ContextPanel } from './components/ContextPanel';
import { BetaAnalytics } from './components/BetaAnalytics';
import { FLAG_KEYS, ACCENT_COLORS, DEFAULT_SDK_KEY, DEFAULT_BASE_URL } from './lib/constants';
import type { AccentKey } from './lib/constants';

const initialContext: EvaluationContext = {
  userId: 'user_pro_01',
  role: 'member',
  attributes: { device: 'Desktop', browser: 'Chrome', country: 'US', plan: 'pro', isPremium: true, seats: 5 },
};

function createClient(sdkKey: string, baseUrl: string) {
  return new FlagixClient({
    sdkKey,
    baseUrl,
    persistent: true,
    ttl: 30000,
  });
}

export default function App() {
  const [client, setClient] = useState(() => createClient(DEFAULT_SDK_KEY, DEFAULT_BASE_URL));
  const [currentSdkKey, setCurrentSdkKey] = useState(DEFAULT_SDK_KEY);
  const [currentBaseUrl, setCurrentBaseUrl] = useState(DEFAULT_BASE_URL);
  const [currentContext, setCurrentContext] = useState<EvaluationContext>(initialContext);
  const [showContextPanel, setShowContextPanel] = useState(false);

  const handleApplyContext = useCallback(
    (sdkKey: string, baseUrl: string, context: EvaluationContext) => {
      const keyChanged = sdkKey !== currentSdkKey || baseUrl !== currentBaseUrl;

      if (keyChanged) {
        const newClient = createClient(sdkKey, baseUrl);
        newClient.setContext(context);
        setClient(newClient);
        setCurrentSdkKey(sdkKey);
        setCurrentBaseUrl(baseUrl);
      } else {
        client.setContext(context);
      }

      setCurrentContext(context);
    },
    [client, currentSdkKey, currentBaseUrl],
  );

  return (
    <FlagixProvider client={client} initialContext={initialContext}>
      <DemoContent
        sdkKey={currentSdkKey}
        baseUrl={currentBaseUrl}
        activeContext={currentContext}
        contextPanelOpen={showContextPanel}
        onToggleContextPanel={() => setShowContextPanel((v) => !v)}
        onCloseContextPanel={() => setShowContextPanel(false)}
        onApplyContext={handleApplyContext}
      />
    </FlagixProvider>
  );
}

interface DemoContentProps {
  sdkKey: string;
  baseUrl: string;
  activeContext: EvaluationContext;
  contextPanelOpen: boolean;
  onToggleContextPanel: () => void;
  onCloseContextPanel: () => void;
  onApplyContext: (sdkKey: string, baseUrl: string, context: EvaluationContext) => void;
}

function DemoContent({
  sdkKey,
  baseUrl,
  activeContext,
  contextPanelOpen,
  onToggleContextPanel,
  onCloseContextPanel,
  onApplyContext,
}: DemoContentProps) {
  const isReady = useFlagixReady();
  const { value: isDarkMode } = useFlag(FLAG_KEYS.DARK_MODE, false);
  const { value: themeAccent } = useFlag(FLAG_KEYS.THEME_ACCENT, 'blue');

  useEffect(() => {
    const html = document.documentElement;

    if (isDarkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const html = document.documentElement;
    const accent = themeAccent as AccentKey;

    html.classList.remove('accent-blue', 'accent-dark-slate', 'accent-light-blue', 'accent-rose');

    if (ACCENT_COLORS[accent]) {
      html.classList.add(ACCENT_COLORS[accent].css);
    }
  }, [themeAccent]);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {!isReady && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-accent" />
            <span className="text-sm text-muted-foreground">Connecting to Flagix...</span>
          </div>
        </div>
      )}

      <PromoBanner />
      <Header />
      <Hero />
      <Features />
      <BetaAnalytics />
      <Pricing />

      <section id="demo" className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              See it in <span className="text-accent">action</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Open the context controller to switch user contexts and watch the page update in real time.
              Each flag evaluation is logged below via SSE.
            </p>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span
              className={`h-2 w-2 rounded-full ${isReady ? 'bg-emerald-500' : 'bg-amber-500'}`}
            />
            SDK Status: {isReady ? 'Connected' : 'Connecting...'}
            <span className="mx-1 text-border">|</span>
            Context: <span className="font-medium text-foreground">{activeContext.userId}</span>
            <span className="mx-1 text-border">|</span>
            Accent: <span className="font-medium text-accent">{themeAccent}</span>
          </div>

          <div className="mx-auto mt-10 max-w-3xl">
            <FlagEvaluationLog />
          </div>
        </div>
      </section>

      <Footer />

      <FloatingConfigButton isOpen={contextPanelOpen} onToggle={onToggleContextPanel}>
        <ContextPanel
          onClose={onCloseContextPanel}
          sdkKey={sdkKey}
          baseUrl={baseUrl}
          activeContext={activeContext}
          onApply={onApplyContext}
        />
      </FloatingConfigButton>
    </div>
  );
}
