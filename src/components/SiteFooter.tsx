import { Link } from "react-router-dom";
import { Globe, ArrowUpRight, Mail } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/80 bg-card/60">
      <div className="mx-auto max-w-[1400px] px-4 py-12 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="font-display text-2xl font-bold tracking-tight text-foreground">
                Virtexa
              </span>
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                Solutions Ecosystem
              </span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              Virtexa deploys custom, human-grade AI voice agents and autonomous
              operating systems for real estate teams and brokerages while
              connecting the entire local real estate ecosystem nationwide —
              agents, lenders, title companies, inspectors, photographers,
              stagers, contractors, movers, and insurance agents across every
              U.S. city.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <a
                href="https://www.virtexasolutions.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary font-semibold hover:underline transition-colors"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>www.virtexasolutions.com</span>
                <ArrowUpRight className="h-3 w-3 opacity-80" />
              </a>
              <a
                href="mailto:hello@virtexasolutions.com"
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>hello@virtexasolutions.com</span>
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold text-foreground">
              Local Directory
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  to="/#directory"
                  className="hover:text-primary transition-colors"
                >
                  Browse Vendors
                </Link>
              </li>
              <li>
                <Link
                  to="/#how-it-works"
                  className="hover:text-primary transition-colors"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  to="/#faq"
                  className="hover:text-primary transition-colors"
                >
                  Resource Center FAQ
                </Link>
              </li>
              <li>
                <Link
                  to="/submit-listing"
                  className="hover:text-primary transition-colors"
                >
                  Submit Free Listing
                </Link>
              </li>
              <li>
                <Link
                  to="/claim-listing"
                  className="hover:text-primary transition-colors"
                >
                  Manage Your Listing
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold text-foreground">
              Virtexa Enterprise AI
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://www.virtexasolutions.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  Speed-to-Lead Voice AI{" "}
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.virtexasolutions.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  Database Reactivation{" "}
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.virtexasolutions.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  Listing-to-Social AI{" "}
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} Virtexa Solutions. All rights reserved.
            For agents, by agents.
          </p>
          <div className="flex gap-4">
            <a
              href="https://www.virtexasolutions.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="https://www.virtexasolutions.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Terms of Service
            </a>
            <a
              href="https://www.virtexasolutions.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Security
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
