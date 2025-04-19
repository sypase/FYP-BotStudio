"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-foreground">
            BotStudio
          </Link>
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/docs"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive('/docs') ? "text-primary" : "text-muted-foreground"
              )}
            >
              Documentation
            </Link>
            <Link
              href="/pricing"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive('/pricing') ? "text-primary" : "text-muted-foreground"
              )}
            >
              Pricing
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild className="text-foreground hover:bg-secondary hover:text-foreground">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 text-black">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
        </div>
      </div>
    </nav>
  );
}
