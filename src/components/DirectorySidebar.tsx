import { useState } from "react";
import { cn } from "@/lib/utils";
import { categoryIcons } from "@/lib/icons";
import { CATEGORIES, type VendorCategory } from "@/data/vendors";
import { Building2, Search, X, ChevronDown } from "lucide-react";

interface DirectorySidebarProps {
  activeCategory: VendorCategory | "all";
  onCategoryChange: (cat: VendorCategory | "all") => void;
  cityQuery: string;
  onCityQueryChange: (q: string) => void;
  vendorCounts: Record<string, number>;
}

export function DirectorySidebar({
  activeCategory,
  onCategoryChange,
  cityQuery,
  onCityQueryChange,
  vendorCounts,
}: DirectorySidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <aside className="flex h-full flex-col gap-6 border-r border-border/60 bg-card/60 p-5 lg:p-6">
      {/* Mobile collapsible header */}
      <div className="lg:hidden">
        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-lg border border-border/70 bg-card px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-secondary"
          aria-expanded={mobileOpen}
        >
          <span className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            {activeCategory === "all"
              ? "All Services"
              : (CATEGORIES.find((c) => c.id === activeCategory)?.singular ??
                "Services")}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              mobileOpen && "rotate-180",
            )}
          />
        </button>
      </div>

      {/* Categories — always visible on desktop, collapsible on mobile */}
      <nav
        aria-label="Service categories"
        className={cn("space-y-1 lg:block", mobileOpen ? "block" : "hidden")}
      >
        <h2 className="mb-3 px-2 font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Service Categories
        </h2>

        <button
          onClick={() => {
            onCategoryChange("all");
            setMobileOpen(false);
          }}
          className={cn(
            "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all",
            activeCategory === "all"
              ? "gradient-btn font-semibold shadow-sm"
              : "text-foreground/80 hover:bg-secondary hover:text-foreground",
          )}
        >
          <span className="flex items-center gap-2.5">
            <Building2 className="h-4 w-4" />
            All Services
          </span>
          <span
            className={cn(
              "text-xs font-mono",
              activeCategory === "all"
                ? "text-primary-foreground/80"
                : "text-muted-foreground",
            )}
          >
            {vendorCounts.all ?? 0}
          </span>
        </button>

        {CATEGORIES.map((cat) => {
          const Icon = categoryIcons[cat.icon] ?? Building2;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                onCategoryChange(cat.id);
                setMobileOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all",
                isActive
                  ? "gradient-btn font-semibold shadow-sm"
                  : "text-foreground/80 hover:bg-secondary hover:text-foreground",
              )}
            >
              <span className="flex items-center gap-2.5">
                <Icon className="h-4 w-4" />
                {cat.singular}
              </span>
              <span
                className={cn(
                  "text-xs font-mono",
                  isActive
                    ? "text-primary-foreground/80"
                    : "text-muted-foreground",
                )}
              >
                {vendorCounts[cat.id] ?? 0}
              </span>
            </button>
          );
        })}
      </nav>

      {/* City filter — search bar only */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-2">
          <h2 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Filter by City
          </h2>
          {cityQuery && (
            <button
              onClick={() => onCityQueryChange("")}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>

        <div className="relative px-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={cityQuery}
            onChange={(e) => onCityQueryChange(e.target.value)}
            placeholder="Search any U.S. city or state…"
            className="h-9 w-full rounded-lg border border-border/70 bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring/50"
            aria-label="Search cities"
          />
        </div>
      </div>
    </aside>
  );
}
