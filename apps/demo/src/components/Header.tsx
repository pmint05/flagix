import { useFlag } from '@flagix/sdk-react';
import { FlagPennantIcon, SunIcon, MoonIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { NAV_LINKS, FLAG_KEYS } from '@/lib/constants';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  const { value: isDarkMode } = useFlag(FLAG_KEYS.DARK_MODE, false);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
            <FlagPennantIcon className="h-4 w-4" weight="fill" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Flag<span className="text-accent">ix</span>
          </span>
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="outline" size="sm">
            Sign In
          </Button>
          <Button size="sm" className="hidden sm:inline-flex">
            Get Started
          </Button>
        </div>
      </div>
    </header>
  );
}
