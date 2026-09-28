import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { DirectorySidebar } from "@/components/DirectorySidebar";
import { VendorCard } from "@/components/VendorCard";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { categoryIcons } from "@/lib/icons";
import {
  CATEGORIES,
  fetchVendors,
  subscribeToVendorInserts,
  type Vendor,
  type VendorCategory,
} from "@/data/vendors";
import {
  Search,
  MapPin,
  Network,
  Sparkles,
  ArrowRight,
  Megaphone,
  CheckCircle2,
  Trophy,
  Crown,
  Medal,
  Lock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const FAQS = [
  {
    q: "What is the Virtexa Real Estate Resource Center?",
    a: "It's a nationwide, city-searchable directory that connects buyers, sellers, and agents with every professional needed to complete a real estate transaction — agents, lenders, title companies, home inspectors, photographers, stagers, contractors, moving companies, and insurance agents — all in one place.",
  },
  {
    q: "How do I find real estate professionals in my city?",
    a: "Use the city search bar in the sidebar to type your city or state, then choose a service category. Virtexa serves all U.S. cities — every listed vendor is matched to your location so you only see local, relevant professionals.",
  },
  {
    q: "Does Virtexa serve my city?",
    a: "Yes. Virtexa serves every city across the United States. Whether you're in a major metro or a small town, you can search by city and state to find local real estate professionals in your area.",
  },
  {
    q: "How does Virtexa optimize for SEO, AEO, and GEO?",
    a: "Every listing is built with structured data (Schema.org LocalBusiness markup), semantic HTML, and city-based geographic targeting so professionals appear in traditional search results (SEO), AI answer engines like ChatGPT and Google AI Overviews (AEO), and local map packs and geographic searches (GEO). Virtexa Partner Badge holders receive priority placement across all three.",
  },
  {
    q: "How can my business join the Virtexa network?",
    a: "Listing your business in the Virtexa directory is completely free — submit your details on the Submit Free Listing page and your listing becomes searchable by category and city nationwide. To earn the Virtexa Partner Badge and receive priority placement, opt in for paid verification during signup and we'll confirm your licensing, insurance, and business standing.",
  },
];

const PAGE_SIZE = 40;

const ResourceCenter = () => {
  const [activeCategory, setActiveCategory] = useState<VendorCategory | "all">(
    "all",
  );
  const [cityQuery, setCityQuery] = useState("");
  const [query, setQuery] = useState("");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchVendors().then(setVendors);

    // Real-time: add new vendors as they're inserted into Supabase
    const unsub = subscribeToVendorInserts((newVendor) => {
      setVendors((prev) => {
        if (prev.some((v) => v.id === newVendor.id)) return prev;
        // Insert at top if verified, otherwise after verified ones
        if (newVendor.verified) return [newVendor, ...prev];
        const firstUnverifiedIdx = prev.findIndex((v) => !v.verified);
        if (firstUnverifiedIdx === -1) return [...prev, newVendor];
        return [
          ...prev.slice(0, firstUnverifiedIdx),
          newVendor,
          ...prev.slice(firstUnverifiedIdx),
        ];
      });
    });

    return unsub;
  }, []);

  const filtered = useMemo(() => {
    const cq = cityQuery.trim().toLowerCase();
    return vendors.filter((v) => {
      const matchCat =
        activeCategory === "all" || v.category === activeCategory;
      const matchCity =
        cq === "" ||
        v.city.toLowerCase().includes(cq) ||
        v.state.toLowerCase().includes(cq);
      const matchQuery =
        query.trim() === "" ||
        v.name.toLowerCase().includes(query.toLowerCase()) ||
        v.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()));
      return matchCat && matchCity && matchQuery;
    });
  }, [activeCategory, cityQuery, query, vendors]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, cityQuery, query]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const vendorCounts = useMemo(() => {
    const cq = cityQuery.trim().toLowerCase();
    const cityMatch = (v: { city: string; state: string }) =>
      cq === "" ||
      v.city.toLowerCase().includes(cq) ||
      v.state.toLowerCase().includes(cq);
    const counts: Record<string, number> = {
      all: vendors.filter(cityMatch).length,
    };
    CATEGORIES.forEach((c) => {
      counts[c.id] = vendors.filter(
        (v) => v.category === c.id && cityMatch(v),
      ).length;
    });
    return counts;
  }, [cityQuery, vendors]);

  const categoryHasVendors =
    activeCategory === "all" ||
    vendors.some(
      (v) =>
        v.category === activeCategory &&
        (cityQuery.trim() === "" ||
          v.city.toLowerCase().includes(cityQuery.trim().toLowerCase()) ||
          v.state.toLowerCase().includes(cityQuery.trim().toLowerCase())),
    );

  const activeMeta = CATEGORIES.find((c) => c.id === activeCategory);
  const cityLabel = cityQuery.trim()
    ? `matching "${cityQuery.trim()}"`
    : "across all U.S. cities";

  return (
    <div className="min-h-screen bg-background font-body">
      <SiteHeader />

      <main>
        {/* Hero Banner aligned with virtexasolutions.com */}
        <section className="relative overflow-hidden border-b border-border/80 bg-gradient-to-b from-card/60 via-background to-background pt-10 pb-16 lg:pt-16 lg:pb-24">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none"></div>
          <div className="mx-auto max-w-[1400px] px-4 lg:px-8 relative">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  <Sparkles className="h-3.5 w-3.5" /> SEO · AEO · GEO Optimized
                </div>
                <h1 className="mt-5 font-display text-4xl font-bold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-6xl">
                  Connecting the Entire Local Real Estate{" "}
                  <span className="gradient-text">Ecosystem</span>
                </h1>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg text-balance">
                  Powered by{" "}
                  <a
                    href="https://www.virtexasolutions.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-foreground underline underline-offset-4 decoration-primary/40 hover:text-primary transition-colors"
                  >
                    Virtexa Solutions
                  </a>
                  . Search any U.S. city to find recommended agents, lenders,
                  title companies, home inspectors, photographers, stagers,
                  contractors, moving companies, and insurance agents. Free
                  listings for businesses.
                </p>
                <p className="mt-2 text-xs font-semibold italic text-primary/90 font-display">
                  For agents, by agents. Nationwide coverage.
                </p>

                <div className="mt-8 flex max-w-xl items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search vendors by name or service keyword…"
                      className="pl-10 h-11 bg-card/90 border-border/80 text-foreground"
                      aria-label="Search vendors"
                    />
                  </div>
                  <Button
                    asChild
                    className="h-11 px-5 gradient-btn border-0 font-semibold"
                  >
                    <Link to="/#directory">
                      Browse Directory <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Virtexa AI Platform Highlight Banner */}
              <div className="mt-6 lg:mt-0 lg:w-[380px] shrink-0 rounded-2xl border border-primary/30 bg-card/90 p-5 shadow-xl relative overflow-hidden glass-card">
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/20 blur-xl"></div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-2">
                  <Network className="h-4 w-4" /> Virtexa AI Integration
                </div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Human-Grade AI Voice & OS
                </h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  Conversational voice agents answer missed sign calls, portal
                  inquiries, and web forms instantly qualifying customers and
                  booking appointments directly onto your calendar.
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                  <span className="font-semibold text-primary font-mono">
                    &lt; 5s Speed-to-Lead
                  </span>
                  <a
                    href="https://www.virtexasolutions.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-foreground inline-flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    virtexasolutions.com{" "}
                    <ArrowRight className="h-3 w-3 text-primary" />
                  </a>
                </div>
              </div>
            </div>

            {/* Stat row */}
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Service Categories", value: CATEGORIES.length },
                { label: "U.S. Cities Served", value: "All" },
                { label: "Free to List", value: "Yes" },
                { label: "Partner Badge", value: "Apply" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-border/70 bg-card p-4 shadow-sm"
                >
                  <div className="font-display text-3xl font-bold gradient-text">
                    {s.value}
                  </div>
                  <div className="mt-0.5 text-xs font-medium text-muted-foreground">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Directory */}
        <section
          id="directory"
          className="mx-auto max-w-[1400px] px-4 py-10 lg:px-8 lg:py-14"
        >
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            {/* Sidebar — sticky on desktop */}
            <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
              <DirectorySidebar
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                cityQuery={cityQuery}
                onCityQueryChange={setCityQuery}
                vendorCounts={vendorCounts}
              />
            </div>

            {/* Main content */}
            <div className="min-w-0">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-bold tracking-tight">
                    {activeMeta ? activeMeta.label : "All Real Estate Services"}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {filtered.length}{" "}
                    {filtered.length === 1 ? "professional" : "professionals"}{" "}
                    {cityLabel}
                  </p>
                </div>
                <Badge variant="outline" className="gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {cityQuery.trim() ? cityQuery.trim() : "All U.S. Cities"}
                </Badge>
              </div>

              {activeMeta && (
                <div className="mb-6 rounded-xl border border-border/60 bg-secondary/40 p-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {activeMeta.description}
                  </p>
                </div>
              )}

              {/* Claim this category — leaderboard of top 3 verified spots */}
              {activeMeta &&
                (() => {
                  const cq = cityQuery.trim().toLowerCase();
                  const cityMatch = (v: { city: string; state: string }) =>
                    cq === "" ||
                    v.city.toLowerCase().includes(cq) ||
                    v.state.toLowerCase().includes(cq);
                  const verifiedInCategory = vendors
                    .filter(
                      (v) =>
                        v.category === activeMeta.id &&
                        v.verified &&
                        cityMatch(v),
                    )
                    .sort(
                      (a, b) =>
                        (b.rating ?? 0) - (a.rating ?? 0) ||
                        (b.reviewCount ?? 0) - (a.reviewCount ?? 0),
                    )
                    .slice(0, 3);
                  const slots = [0, 1, 2];
                  const rankIcons = [Crown, Medal, Trophy];
                  const rankLabels = ["1st", "2nd", "3rd"];
                  const rankColors = [
                    "text-amber-500 bg-amber-500/10 border-amber-500/30",
                    "text-slate-400 bg-slate-400/10 border-slate-400/30",
                    "text-orange-600 bg-orange-600/10 border-orange-600/30",
                  ];

                  return (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-primary" />
                          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
                            Claim this Category
                          </h3>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                          Top 3 partner spots ·{" "}
                          {cityQuery.trim()
                            ? cityQuery.trim()
                            : "All U.S. Cities"}
                        </span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {slots.map((slot) => {
                          const vendor = verifiedInCategory[slot];
                          const RankIcon = rankIcons[slot];
                          if (vendor) {
                            return (
                              <Link
                                key={slot}
                                to={`/vendor/${vendor.id}`}
                                className="group relative flex flex-col rounded-xl border border-primary/30 bg-card p-4 shadow-sm transition-all hover:border-primary/60 hover:shadow-md"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold ${rankColors[slot]}`}
                                  >
                                    <RankIcon className="h-3 w-3" />{" "}
                                    {rankLabels[slot]}
                                  </span>
                                  <Badge className="gap-1 bg-primary/15 text-primary border-0 text-[10px] font-semibold">
                                    <CheckCircle2 className="h-3 w-3" /> Partner
                                  </Badge>
                                </div>
                                <div className="font-display text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                                  {vendor.name}
                                </div>
                                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" /> {vendor.city},{" "}
                                  {vendor.state}
                                </div>
                                {vendor.rating != null && (
                                  <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-foreground">
                                    <span className="text-amber-500">★</span>
                                    {vendor.rating.toFixed(1)}
                                    {vendor.reviewCount != null
                                      ? ` · ${vendor.reviewCount} reviews`
                                      : ""}
                                  </div>
                                )}
                              </Link>
                            );
                          }
                          return (
                            <div
                              key={slot}
                              className="relative flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/20 p-4 text-center min-h-[140px]"
                            >
                              <div
                                className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full border ${rankColors[slot]}`}
                              >
                                <Lock className="h-4 w-4" />
                              </div>
                              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                {rankLabels[slot]} Place — Available
                              </div>
                              <div className="mt-1 text-[11px] text-muted-foreground/70 leading-tight">
                                Get the Partner Badge to claim this premium spot
                              </div>
                              <Link
                                to="/submit-listing"
                                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                              >
                                Claim now <ArrowRight className="h-3 w-3" />
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

              {!categoryHasVendors && activeMeta && (
                <div className="mb-6 overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent">
                  <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
                        <Megaphone className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-display text-lg font-bold text-foreground">
                          Be the first to list in {activeMeta.label}
                        </h3>
                        <p className="mt-1 max-w-lg text-sm leading-relaxed text-muted-foreground">
                          No {activeMeta.singular.toLowerCase()}s have claimed a
                          spot here yet. Get ahead of the competition — claim
                          the top position in this category and city. Listing is
                          free, and Virtexa Partner Badge holders get priority
                          placement.
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-primary">
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Free to
                            list
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> SEO · AEO ·
                            GEO optimized
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Priority
                            for Partner Badge holders
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      asChild
                      className="shrink-0 gradient-btn border-0 font-semibold sm:self-center"
                    >
                      <Link to="/submit-listing">
                        Claim Your Spot{" "}
                        <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              )}

              {filtered.length > 0 ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {paginated.map((vendor) => {
                      const meta = CATEGORIES.find(
                        (c) => c.id === vendor.category,
                      )!;
                      return (
                        <VendorCard
                          key={vendor.id}
                          vendor={vendor}
                          category={meta}
                        />
                      );
                    })}
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-8 flex flex-col items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage === 1}
                          onClick={() =>
                            setCurrentPage((p) => Math.max(1, p - 1))
                          }
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                        </Button>
                        {Array.from(
                          { length: totalPages },
                          (_, i) => i + 1,
                        ).map((pageNum) => (
                          <Button
                            key={pageNum}
                            variant={
                              currentPage === pageNum ? "default" : "outline"
                            }
                            size="sm"
                            className="min-w-[2.25rem]"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage === totalPages}
                          onClick={() =>
                            setCurrentPage((p) => Math.min(totalPages, p + 1))
                          }
                        >
                          Next <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Page {currentPage} of {totalPages} · Showing{" "}
                        {paginated.length} of {filtered.length} listings
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
                  <Search className="mb-3 h-8 w-8 text-muted-foreground" />
                  <h3 className="font-display text-lg font-semibold">
                    No listings here yet
                  </h3>
                  <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    We couldn't find a matching business in this category and
                    location. Be the first to claim your spot — listing is free.
                  </p>
                  <Button
                    asChild
                    className="mt-5 gradient-btn border-0 font-semibold"
                  >
                    <Link to="/submit-listing">
                      Submit Your Free Listing{" "}
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="mt-2"
                    onClick={() => {
                      setQuery("");
                      setCityQuery("");
                      setActiveCategory("all");
                    }}
                  >
                    Reset filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Category overview band — AEO/GEO content */}
        <section className="border-y border-border/60 bg-secondary/40">
          <div className="mx-auto max-w-[1400px] px-4 py-12 lg:px-8">
            <h2 className="font-display text-2xl font-bold tracking-tight">
              Ten services. One connected ecosystem. Every U.S. city.
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Virtexa brings together every professional a real estate
              transaction requires — from the agent who finds your home to the
              mover who gets you in. Searchable by city nationwide and optimized
              for SEO, AEO, and GEO so the right professionals surface in search
              engines, AI answer engines, and local geographic results.
            </p>
            <p className="mt-2 max-w-2xl text-sm font-medium text-primary">
              Virtexa Partner Badge holders receive priority placement and
              greater visibility.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {CATEGORIES.map((cat) => {
                const Icon = categoryIcons[cat.icon];
                return (
                  <div
                    key={cat.id}
                    className="rounded-xl border border-border/60 bg-card p-5"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
                      {Icon && <Icon className="h-5 w-5" />}
                    </div>
                    <h3 className="font-display text-base font-semibold">
                      {cat.label}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {cat.description}
                    </p>
                    <button
                      onClick={() => {
                        setActiveCategory(cat.id);
                        document
                          .getElementById("directory")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      Browse {cat.singular}s{" "}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        {/* How it works */}
        <section
          id="how-it-works"
          className="mx-auto max-w-[1400px] px-4 py-14 lg:px-8"
        >
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4 gap-1.5">
              <Network className="h-3.5 w-3.5" /> How It Works
            </Badge>
            <h2 className="font-display text-3xl font-bold tracking-tight text-balance">
              Find the right local professional in three steps
            </h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Choose your city",
                body: "Search any U.S. city or state to see only professionals who serve your local market — from major metros to small towns nationwide.",
              },
              {
                step: "02",
                title: "Pick a service category",
                body: "Select from lenders, inspectors, stagers, movers, and more — each organized for quick comparison.",
              },
              {
                step: "03",
                title: "Connect with confidence",
                body: "Review ratings, years in business, and Virtexa Partner Badges, then reach out directly to the professional you choose.",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="relative rounded-2xl border border-border/60 bg-card p-6"
              >
                <span className="font-display text-4xl font-bold text-secondary-foreground/40">
                  {s.step}
                </span>
                <h3 className="mt-3 font-display text-lg font-semibold">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* AEO FAQ */}
        <section id="faq" className="border-t border-border/60 bg-secondary/40">
          <div className="mx-auto max-w-3xl px-4 py-14 lg:px-8">
            <h2 className="text-center font-display text-3xl font-bold tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-center text-muted-foreground">
              Everything you need to know about the Virtexa Real Estate Resource
              Center.
            </p>
            <Accordion type="single" collapsible className="mt-8">
              {FAQS.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-left font-display text-base">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default ResourceCenter;
