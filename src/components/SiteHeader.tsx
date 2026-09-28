import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Globe, ArrowUpRight, Phone } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-display text-2xl font-bold tracking-tight text-foreground">
              Virtexa
            </span>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Resource Center
            </span>
          </Link>

          <a
            href="https://www.virtexasolutions.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1 text-xs text-muted-foreground hover:text-foreground sm:flex transition-colors border-l border-border/60 pl-4"
          >
            <Globe className="h-3.5 w-3.5 text-primary" />
            <span>virtexasolutions.com</span>
            <ArrowUpRight className="h-3 w-3 opacity-60" />
          </a>
        </div>

        <nav className="hidden items-center gap-2 md:flex" aria-label="Primary">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hover:bg-secondary hover:text-foreground"
          >
            <Link to="/#directory">Directory</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hover:bg-secondary hover:text-foreground"
          >
            <Link to="/#how-it-works">How It Works</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hover:bg-secondary hover:text-foreground"
          >
            <Link to="/#faq">FAQ</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hover:bg-secondary hover:text-foreground"
          >
            <Link to="/claim-listing">Manage Listing</Link>
          </Button>
          <Button
            size="sm"
            className="ml-2 gap-1.5 font-semibold gradient-btn border-0"
            asChild
          >
            <Link to="/submit-listing">
              <Phone className="h-3.5 w-3.5" /> Submit Free Listing
            </Link>
          </Button>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
