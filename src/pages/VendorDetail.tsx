import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { categoryIcons } from "@/lib/icons";
import {
  CATEGORIES,
  fetchVendorById,
  fetchVendors,
  type Vendor,
} from "@/data/vendors";
import {
  Star,
  BadgeCheck,
  MapPin,
  Phone,
  Mail,
  Globe,
  ArrowLeft,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Building2,
  Headset,
  ChevronDown,
  CalendarClock,
  Facebook,
  Instagram,
  Linkedin,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const VendorDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<Vendor | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState<Vendor[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchVendorById(id || "").then(async (v) => {
      if (cancelled) return;
      setVendor(v);
      setLoading(false);

      if (v) {
        document.title = `${v.name} — ${v.city} ${CATEGORIES.find((c) => c.id === v.category)?.singular} | Virtexa Resource Center`;

        // Inject LocalBusiness JSON-LD for SEO/AEO
        const cat = CATEGORIES.find((c) => c.id === v.category);
        const schema: Record<string, unknown> = {
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: v.name,
          description: v.longBio || undefined,
          address: {
            "@type": "PostalAddress",
            streetAddress: v.address,
            addressLocality: v.city,
            addressRegion: v.state,
            addressCountry: "US",
          },
          telephone: v.phone || undefined,
          email: v.email || undefined,
          url: v.website || undefined,
          priceRange: v.paid ? "$$" : "$",
          knowsAbout:
            v.servicesOffered.length > 0 ? v.servicesOffered : cat?.services,
        };
        if (v.rating != null) {
          schema.aggregateRating = {
            "@type": "AggregateRating",
            ratingValue: v.rating,
            reviewCount: v.reviewCount ?? 0,
          };
        }
        if (v.gmbLink)
          schema.sameAs = [
            v.gmbLink,
            v.facebook,
            v.instagram,
            v.linkedin,
          ].filter(Boolean);
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.id = "vendor-schema";
        script.textContent = JSON.stringify(schema);
        document.getElementById("vendor-schema")?.remove();
        document.head.appendChild(script);

        // Fetch related vendors (same category, same city, excluding current)
        const all = await fetchVendors();
        if (cancelled) return;
        const relatedVendors = all
          .filter(
            (r) =>
              r.category === v.category && r.city === v.city && r.id !== v.id,
          )
          .slice(0, 3);
        setRelated(relatedVendors);
      } else {
        document.title = "Vendor Not Found | Virtexa Resource Center";
      }
    });

    window.scrollTo(0, 0);

    return () => {
      cancelled = true;
      document.getElementById("vendor-schema")?.remove();
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background font-body">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-24 text-center">
          <p className="text-muted-foreground">Loading…</p>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-background font-body">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-24 text-center">
          <h1 className="font-display text-3xl font-bold">Vendor not found</h1>
          <p className="mt-2 text-muted-foreground">
            This business listing may have been removed or moved.
          </p>
          <Button className="mt-6" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Directory
          </Button>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const category = CATEGORIES.find((c) => c.id === vendor.category)!;
  const Icon = categoryIcons[category.icon] ?? categoryIcons.Building2;

  return (
    <div className="min-h-screen bg-background font-body">
      <SiteHeader />

      <main>
        {/* Breadcrumb */}
        <div className="mx-auto max-w-[1200px] px-4 pt-6 lg:px-8">
          <nav
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
            aria-label="Breadcrumb"
          >
            <Link to="/" className="hover:text-primary transition-colors">
              Directory
            </Link>
            <span className="text-border">/</span>
            <Link
              to={`/?cat=${vendor.category}`}
              className="hover:text-primary transition-colors"
            >
              {category.label}
            </Link>
            <span className="text-border">/</span>
            <span className="text-foreground">{vendor.name}</span>
          </nav>
        </div>

        {/* Header section */}
        <section className="mx-auto max-w-[1200px] px-4 py-8 lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-b from-card/80 to-background p-6 lg:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary border border-primary/20">
                  <Icon className="h-7 w-7" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-display text-3xl font-bold tracking-tight text-balance lg:text-4xl">
                      {vendor.name}
                    </h1>
                    {vendor.verified && (
                      <Badge className="gap-1 bg-primary/15 text-primary border-primary/30">
                        <BadgeCheck className="h-3.5 w-3.5" /> Virtexa Partner
                        Badge
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-primary/80" />{" "}
                      {vendor.city}, {vendor.state}
                    </span>
                    <span className="text-border">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5 text-primary/80" />{" "}
                      {category.label}
                    </span>
                    {vendor.rating != null && (
                      <>
                        <span className="text-border">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-primary/80 text-primary" />{" "}
                          {vendor.rating} ({vendor.reviewCount ?? 0} reviews)
                        </span>
                      </>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {vendor.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="font-normal bg-secondary/80 border border-border/50"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contact card */}
              <Card className="w-full max-w-xs shrink-0 border-border/70 bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-base">
                    Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {vendor.phone && (
                    <a
                      href={`tel:${vendor.phone.replace(/[^0-9]/g, "")}`}
                      className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                    >
                      <Phone className="h-4 w-4 text-primary" /> {vendor.phone}
                    </a>
                  )}
                  {vendor.email && (
                    <a
                      href={`mailto:${vendor.email}`}
                      className="flex items-center gap-2 text-sm hover:text-primary transition-colors break-all"
                    >
                      <Mail className="h-4 w-4 text-primary shrink-0" />{" "}
                      {vendor.email}
                    </a>
                  )}
                  {vendor.website && (
                    <a
                      href={vendor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm hover:text-primary transition-colors break-all"
                    >
                      <Globe className="h-4 w-4 text-primary shrink-0" /> Visit
                      Website
                    </a>
                  )}
                  {vendor.phone && (
                    <Button
                      asChild
                      className="mt-2 w-full gradient-btn border-0 font-semibold"
                    >
                      <a href={`tel:${vendor.phone.replace(/[^0-9]/g, "")}`}>
                        <Phone className="mr-1.5 h-4 w-4" /> Call Now
                      </a>
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="w-full border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 font-semibold">
                        <Headset className="mr-1.5 h-4 w-4" /> Get a 24/7
                        Receptionist <ChevronDown className="ml-1 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="w-[260px]">
                      <DropdownMenuItem asChild>
                        <a
                          href="https://api.leadconnectorhq.com/widget/booking/IfEWJ3S36rtJPcFjkqh1"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cursor-pointer"
                        >
                          <CalendarClock className="mr-2 h-4 w-4 text-primary" />{" "}
                          Book with Diamond Carter
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a
                          href="https://api.leadconnectorhq.com/widget/booking/lGWutJTLLOiszDqfKUfG"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cursor-pointer"
                        >
                          <CalendarClock className="mr-2 h-4 w-4 text-primary" />{" "}
                          Book with Rikki Carodine
                        </a>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Body grid */}
        <section className="mx-auto max-w-[1200px] px-4 pb-12 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            {/* Main column */}
            <div className="space-y-6">
              {vendor.longBio && (
                <Card className="border-border/70 bg-card">
                  <CardHeader>
                    <CardTitle className="font-display text-xl">
                      About {vendor.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {vendor.longBio}
                    </p>
                  </CardContent>
                </Card>
              )}

              {vendor.servicesOffered.length > 0 && (
                <Card className="border-border/70 bg-card">
                  <CardHeader>
                    <CardTitle className="font-display text-xl">
                      Services Offered
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="grid gap-2.5 sm:grid-cols-2">
                      {vendor.servicesOffered.map((service) => (
                        <li
                          key={service}
                          className="flex items-start gap-2 text-sm"
                        >
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>{service}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Social Media & GMB Links */}
              {(vendor.gmbLink ||
                vendor.facebook ||
                vendor.instagram ||
                vendor.linkedin) && (
                <Card className="border-border/70 bg-card">
                  <CardHeader>
                    <CardTitle className="font-display text-xl">
                      Connect Online
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {vendor.gmbLink && (
                        <a
                          href={vendor.gmbLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/50 px-3.5 py-2 text-sm font-medium hover:border-primary/40 hover:text-primary transition-colors"
                        >
                          <MapPin className="h-4 w-4 text-primary" /> Google
                          Business Profile
                        </a>
                      )}
                      {vendor.facebook && (
                        <a
                          href={vendor.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/50 px-3.5 py-2 text-sm font-medium hover:border-primary/40 hover:text-primary transition-colors"
                        >
                          <Facebook className="h-4 w-4 text-primary" /> Facebook
                        </a>
                      )}
                      {vendor.instagram && (
                        <a
                          href={vendor.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/50 px-3.5 py-2 text-sm font-medium hover:border-primary/40 hover:text-primary transition-colors"
                        >
                          <Instagram className="h-4 w-4 text-primary" />{" "}
                          Instagram
                        </a>
                      )}
                      {vendor.linkedin && (
                        <a
                          href={vendor.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/50 px-3.5 py-2 text-sm font-medium hover:border-primary/40 hover:text-primary transition-colors"
                        >
                          <Linkedin className="h-4 w-4 text-primary" /> LinkedIn
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Partner status */}
              <Card
                className={`border-border/70 ${vendor.paid ? "border-primary/30 bg-primary/5" : "bg-card"}`}
              >
                <CardHeader>
                  <CardTitle className="font-display text-xl flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" /> Partner
                    Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {vendor.paid ? (
                    <div className="flex items-start gap-3">
                      <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Virtexa Partner
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                          This business holds the Virtexa Partner Badge, an
                          optional paid feature that gives participating
                          businesses additional recognition and visibility on
                          their directory profile. Partner Badge holders receive
                          priority placement and stand out to potential clients.
                        </p>
                      </div>
                    </div>
                  ) : !vendor.claimed ? (
                    <div className="flex items-start gap-3">
                      <Clock className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Unclaimed Listing
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                          This listing was added from public business records
                          and hasn't been claimed by its owner yet. Is this
                          your business? Claim it for free to update your
                          details and add your services.
                        </p>
                        <Button
                          asChild
                          size="sm"
                          className="mt-3 gradient-btn border-0 font-semibold"
                        >
                          <Link to={`/claim/${vendor.id}`}>
                            Claim this listing
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <Clock className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Not a Partner of Virtexa
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                          This business has a free listing in the Virtexa
                          directory but has not yet added the Virtexa Partner
                          Badge.
                        </p>
                        <a
                          href={`https://link.fastpaydirect.com/payment-link/6a866c3bf9c8c807930b9130?email=${encodeURIComponent(vendor.email)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                        >
                          Get the Partner Badge{" "}
                          <ArrowLeft className="h-3 w-3 rotate-180" />
                        </a>
                        <Link
                          to="/claim-listing"
                          className="mt-2 block text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                        >
                          Manage your Listing →
                        </Link>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar column */}
            <div className="space-y-6">
              <Card className="border-border/70 bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-base">
                    Business Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Category</span>
                    <p className="font-medium text-foreground">
                      {category.label}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Location</span>
                    <p className="font-medium text-foreground">
                      {vendor.address}
                    </p>
                  </div>
                  {vendor.yearsActive != null && (
                    <div>
                      <span className="text-muted-foreground">
                        Years in Business
                      </span>
                      <p className="font-medium text-foreground">
                        {vendor.yearsActive} years
                      </p>
                    </div>
                  )}
                  {vendor.rating != null && (
                    <div>
                      <span className="text-muted-foreground">Rating</span>
                      <p className="font-medium text-foreground inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-primary/80 text-primary" />{" "}
                        {vendor.rating} · {vendor.reviewCount ?? 0} reviews
                      </p>
                    </div>
                  )}
                  {vendor.source === "osm" && (
                    <p className="border-t border-border/60 pt-3 text-xs text-muted-foreground">
                      Business details from{" "}
                      <a
                        href={
                          vendor.sourceRef
                            ? `https://www.openstreetmap.org/${vendor.sourceRef}`
                            : "https://www.openstreetmap.org"
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-primary"
                      >
                        OpenStreetMap
                      </a>{" "}
                      ©{" "}
                      <a
                        href="https://www.openstreetmap.org/copyright"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-primary"
                      >
                        OpenStreetMap contributors
                      </a>
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-base">
                    Why Virtexa?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    Virtexa connects the entire local real estate ecosystem
                    nationwide — every professional you need for a smooth
                    transaction, searchable by city across all U.S. markets.
                    Every listing is optimized for SEO, AEO, and GEO so
                    professionals surface in search engines, AI answer engines,
                    and local geographic results.
                  </p>
                  <a
                    href="https://www.virtexasolutions.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                  >
                    Learn more <ArrowLeft className="h-3 w-3 rotate-180" />
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Related vendors */}
        {related.length > 0 && (
          <section className="border-t border-border/60 bg-secondary/30">
            <div className="mx-auto max-w-[1200px] px-4 py-12 lg:px-8">
              <h2 className="font-display text-2xl font-bold tracking-tight">
                More {category.singular}s in {vendor.city}
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((r) => {
                  const rMeta = CATEGORIES.find((c) => c.id === r.category)!;
                  const RIcon =
                    categoryIcons[rMeta.icon] ?? categoryIcons.Building2;
                  return (
                    <Link key={r.id} to={`/vendor/${r.id}`}>
                      <Card className="group h-full border-border/70 bg-card transition-all hover:border-primary/50 hover:shadow-lg">
                        <CardContent className="flex items-start gap-3 p-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary border border-primary/20">
                            <RIcon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h3 className="truncate font-display text-sm font-semibold group-hover:text-primary transition-colors">
                                {r.name}
                              </h3>
                              {r.verified && (
                                <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
                              )}
                            </div>
                            <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 text-primary/80" />{" "}
                              {r.city}, {r.state}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
};

export default VendorDetail;
