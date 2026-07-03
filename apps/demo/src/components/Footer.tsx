import { FlagPennantIcon } from '@phosphor-icons/react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col items-center justify-between gap-8 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background">
              <FlagPennantIcon className="h-3.5 w-3.5" weight="fill" />
            </div>
            <span className="text-sm font-bold tracking-tight">
              Flag<span className="text-accent">ix</span>
            </span>
          </div>

          <div className="flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#" className="transition-colors hover:text-foreground">Privacy</a>
            <a href="#" className="transition-colors hover:text-foreground">Terms</a>
            <a href="#" className="transition-colors hover:text-foreground">Status</a>
            <a href="#" className="transition-colors hover:text-foreground">Docs</a>
          </div>

          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Flagix. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
