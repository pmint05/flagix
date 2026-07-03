import { SunIcon, MoonIcon } from '@phosphor-icons/react';
import { useFlag } from '@flagix/sdk-react';
import { FLAG_KEYS } from '@/lib/constants';

export function ThemeToggle() {
  const { value: isDarkMode } = useFlag(FLAG_KEYS.DARK_MODE, false);
  console.log(isDarkMode)

  return (
    <button
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkMode ? (
        <MoonIcon className="h-4 w-4" weight="fill" />
      ) : (
        <SunIcon className="h-4 w-4" weight="fill" />
      )}
    </button>
  );
}
