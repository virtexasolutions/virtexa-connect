import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORIES,
  saveVendor,
  type VendorCategory,
  type Vendor,
} from "@/data/vendors";
import {
  ShieldCheck,
  BadgeCheck,
  CheckCircle2,
  Star,
  TrendingUp,
  Lock,
  ArrowRight,
  Sparkles,
  Users,
  MapPin,
  Eye,
  Building2,
  Phone,
  Globe,
  Loader2,
  CheckCircle,
} from "lucide-react";
const PAYMENT_LINK =
  "https://link.fastpaydirect.com/payment-link/6a866c3bf9c8c807930b9130";

type StandardTrackingFieldKey = string;
type RegisteredCustomFieldId = string;
type TrackingCustomField = { value?: unknown; label: string };
type TrackingFileField = { file?: File; label: string };
type TrackingImageDataField = { dataUrl?: string; label: string };

const postTrackingEvent = (
  trackingPayload: Record<string, unknown> & {
    formData: Record<StandardTrackingFieldKey, unknown>;
    formLabels: Record<StandardTrackingFieldKey, string>;
  },
  options: {
    customFields?: Record<RegisteredCustomFieldId, TrackingCustomField>;
    fileFields?: Record<RegisteredCustomFieldId, TrackingFileField>;
    imageDataFields?: Record<RegisteredCustomFieldId, TrackingImageDataField>;
  } = {},
) => {
  const { customFields = {}, fileFields = {}, imageDataFields = {} } = options;
  const eventPayload = {
    ...trackingPayload,
    formData: { ...trackingPayload.formData },
    formLabels: { ...trackingPayload.formLabels },
  };
  const body = new FormData();

  for (const [key, field] of Object.entries(customFields)) {
    if (field.value === undefined) continue;
    eventPayload.formData[key] = field.value;
    eventPayload.formLabels[key] = field.label;
  }

  for (const [key, field] of Object.entries(imageDataFields)) {
    const dataUrl = field.dataUrl;
    if (!dataUrl) continue;
    if (!dataUrl.startsWith("data:image/")) {
      throw new Error("Image data field must be a data:image/* base64 string");
    }
    eventPayload.formData[key] = dataUrl;
    eventPayload.formLabels[key] = field.label;
  }

  for (const [key, field] of Object.entries(fileFields)) {
    const file = field.file;
    if (!file) continue;
    if (file.size > 50 * 1024 * 1024) {
      throw new Error("File must be 50 MB or smaller");
    }
    eventPayload.formData[key] = {
      filename: file.name,
      size: file.size,
      type: file.type || "application/octet-stream",
    };
    eventPayload.formLabels[key] = field.label;
    body.append(key, file, file.name);
  }

  for (const key of Object.keys(eventPayload.formData)) {
    eventPayload.formLabels[key] ||= key;
  }

  body.append("event", JSON.stringify(eventPayload));

  fetch("https://backend.leadconnectorhq.com/external-tracking/events", {
    method: "POST",
    headers: {
      version: "2021-07-28",
    },
    body,
  }).catch(() => {});
};

const benefits = [
  {
    icon: Eye,
    title: "Get discovered by local buyers & agents",
    description:
      "Your business appears in city-based search results across all ten service categories — the exact moment someone needs your service.",
  },
  {
    icon: Sparkles,
    title: "Optimized for SEO, AEO & GEO",
    description:
      "Every listing includes structured data and semantic markup so you rank in Google (SEO), surface in AI answer engines like ChatGPT and Google AI Overviews (AEO), and appear in local map packs and geographic searches (GEO).",
  },
  {
    icon: Building2,
    title: "A full business detail page — free",
    description:
      "Every listing gets its own page with your contact info, services, hours, and a direct call button. No paywall, no hidden fees.",
  },
  {
    icon: MapPin,
    title: "Searchable by city & category — nationwide",
    description:
      "Buyers and agents filter by city and service type across every U.S. city. No matter where you operate, you show up when local clients search.",
  },
  {
    icon: Users,
    title: "Tap into the Virtexa ecosystem",
    description:
      "Virtexa connects the entire local real estate transaction — agents, lenders, title, inspectors, photographers, stagers, contractors, movers, and insurance. One network, endless referrals.",
  },
  {
    icon: TrendingUp,
    title: "Priority placement with the Partner Badge",
    description:
      "Opt for the Virtexa Partner Badge and rank above unverified competitors. The badge gives your business additional recognition and visibility to help you stand out.",
  },
];

const freeIncludes = [
  "Searchable by city & category",
  "Full business detail page",
  "Contact info, phone & website listed",
  "Direct call button on your page",
  "Appear in every U.S. city — nationwide coverage",
  "No cost, no obligation",
];

const verifiedIncludes = [
  "Virtexa Partner Badge on your listing & detail page",
  "Rank above non-partner listings in your category",
  "Greater visibility in search results & filters",
  "Recognition that helps you stand out to clients",
  "Highlighted as a featured partner in your category",
];

const SubmitListing = () => {
  const [formData, setFormData] = useState({
    businessName: "",
    category: "",
    contactName: "",
    email: "",
    phone: "",
    website: "",
    city: "",
    state: "",
    address: "",
    servicesOffered: "",
    gmbLink: "",
    facebook: "",
    instagram: "",
    linkedin: "",
    bio: "",
    wantVerification: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.businessName.trim())
      e.businessName = "Business name is required";
    if (!formData.category) e.category = "Please select a category";
    if (!formData.contactName.trim())
      e.contactName = "Contact name is required";
    if (!formData.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      e.email = "Enter a valid email";
    if (!formData.phone.trim()) e.phone = "Phone number is required";
    if (!formData.website.trim()) e.website = "Website is required";
    else if (formData.website.trim() && !/^https?:\/\//.test(formData.website))
      e.website = "Include http:// or https://";
    if (!formData.city.trim()) e.city = "City is required";
    if (!formData.state.trim()) e.state = "State is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    const selectedCategory = CATEGORIES.find((c) => c.id === formData.category);

    const trackingPayload = {
      type: "external_form_submission",
      timestamp: Date.now(),
      formId: "submit-listing",
      formData: {
        first_name: formData.contactName.split(" ")[0] || "",
        last_name: formData.contactName.split(" ").slice(1).join(" ") || "",
        email: formData.email,
        phone: formData.phone,
        website: formData.website,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: "US",
      },
      formLabels: {
        first_name: "Contact Name",
        last_name: "Contact Name",
        email: "Email",
        phone: "Phone",
        website: "Website",
        address: "Street Address",
        city: "City",
        state: "State",
        country: "Country",
      },
      url: window.location.href,
      title: document.title,
      path: window.location.pathname,
      userAgent: navigator.userAgent,
      trackingId: "tk_adcb99a208cf4be6bd275b1d38fd3ec4",
      locationId: "x0DZpgAlhsZCbnEJ44Us",
      projectId: "1787172171975390550",
      sessionId: crypto.randomUUID(),
      properties: {
        deviceType: /Mobile|Android|iPhone/i.test(navigator.userAgent)
          ? "mobile"
          : "desktop",
        source: "ai_studio",
        projectId: "1787172171975390550",
        formName: "Submit Free Listing",
      },
    };

    postTrackingEvent(trackingPayload, {
      customFields: {
        Tcl4GOft4IWADg7QnptS: {
          value: formData.businessName,
          label: "Business Name",
        },
        "6mSokkMQzezYomZYgOXl": {
          value: selectedCategory?.label || formData.category,
          label: "Service Category",
        },
        BfYt8w4h5JUcLXyNM13g: {
          value: formData.bio,
          label: "Business Description",
        },
        NRUqVZYpJoawqFUTYgly: {
          value: formData.wantVerification
            ? "Yes, I want the Virtexa Partner Badge"
            : "",
          label: "Want Verification",
        },
        // New fields
        services_offered: {
          value: formData.servicesOffered,
          label: "Services Offered",
        },
        gmb_link: {
          value: formData.gmbLink,
          label: "Google Business Profile Link",
        },
        facebook_link: {
          value: formData.facebook,
          label: "Facebook",
        },
        instagram_link: {
          value: formData.instagram,
          label: "Instagram",
        },
        linkedin_link: {
          value: formData.linkedin,
          label: "LinkedIn",
        },
      },
    });

    // Parse services offered (comma-separated) into array
    const servicesArray = formData.servicesOffered
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    // Create vendor object — only real submitted data, no mock values
    const newVendor: Vendor = {
      id: `${formData.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`,
      name: formData.businessName.trim(),
      category: formData.category as VendorCategory,
      city: formData.city.trim(),
      state: formData.state.trim().toUpperCase(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      website: formData.website.trim(),
      address:
        formData.address.trim() ||
        `${formData.city.trim()}, ${formData.state.trim().toUpperCase()}`,
      tags: [
        selectedCategory?.label || formData.category,
        formData.city.trim(),
      ],
      paid: formData.wantVerification,
      verified: formData.wantVerification,
      bio: formData.bio.trim(),
      longBio: formData.bio.trim(),
      servicesOffered: servicesArray,
      gmbLink: formData.gmbLink.trim(),
      facebook: formData.facebook.trim(),
      instagram: formData.instagram.trim(),
      linkedin: formData.linkedin.trim(),
    };

    const result = await saveVendor(newVendor);

    setSubmitting(false);

    if (!result.ok) {
      setErrors({
        submit: result.error
          ? `Could not save to directory: ${result.error}. This usually means a database column is missing. Please run the latest ALTER TABLE SQL from SUPABASE_SETUP.md in your Supabase SQL Editor.`
          : "Your listing was sent to our team, but could not be saved to the directory automatically. Please run the SQL from SUPABASE_SETUP.md in your Supabase dashboard, then try again.",
      });
      return;
    }

    setSubmitted(true);
    if (formData.wantVerification) {
      // Append email to payment link so the CRM webhook can match this vendor
      const paymentUrl = `${PAYMENT_LINK}?email=${encodeURIComponent(formData.email.trim())}`;
      // Auto-redirect to payment link after showing brief confirmation
      setTimeout(() => {
        window.open(paymentUrl, "_blank", "noopener,noreferrer");
      }, 1200);
    }
  };

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <div className="min-h-screen bg-background font-body">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/80 bg-gradient-to-b from-card/60 via-background to-background pt-12 pb-14 lg:pt-16 lg:pb-20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
          <div className="mx-auto max-w-3xl px-4 lg:px-8 relative text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Free Vendor Listing
            </div>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.1] tracking-tight text-balance sm:text-5xl">
              Join the Virtexa Real Estate Resource Center
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg text-balance">
              List your business{" "}
              <strong className="text-foreground">100% free</strong> and get
              found by buyers, sellers, and agents searching for local real
              estate professionals in any U.S. city — optimized for SEO, AEO,
              and GEO.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
              {CATEGORIES.map((c) => (
                <Badge
                  key={c.id}
                  variant="outline"
                  className="gap-1.5 border-border/70 text-muted-foreground"
                >
                  {c.label}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits grid */}
        <section className="mx-auto max-w-[1400px] px-4 py-14 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Why list on Virtexa?
            </h2>
            <p className="mt-3 text-muted-foreground">
              We're not just another directory — we're the connective tissue of
              the local real estate transaction. Here's what a free listing gets
              you.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="group rounded-2xl border border-border/60 bg-card p-6 transition-colors hover:border-primary/40"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <b.icon className="h-5.5 w-5.5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold leading-tight">
                  {b.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {b.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Free vs Verified comparison */}
        <section className="mx-auto max-w-[1400px] px-4 pb-14 lg:px-8 lg:pb-20">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Free listing */}
            <div className="rounded-2xl border border-border/60 bg-card p-7">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <h3 className="font-display text-xl font-bold">Free Listing</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Everything you need to get found — at no cost.
              </p>
              <ul className="mt-5 space-y-3 text-sm">
                {freeIncludes.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Verified upgrade */}
            <div className="relative hidden overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary to-accent p-7 text-primary-foreground shadow-lg lg:block">
              <Badge className="mb-3 gap-1.5 bg-primary-foreground/15 text-primary-foreground">
                <ShieldCheck className="h-3.5 w-3.5" /> Virtexa Partner Badge
              </Badge>
              <h3 className="font-display text-xl font-bold">
                Partner Badge — Optional
              </h3>
              <p className="mt-2 text-sm text-primary-foreground/80">
                An optional paid feature that gives your business additional
                recognition and visibility.
              </p>
              <ul className="mt-5 space-y-3 text-sm">
                {verifiedIncludes.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <BadgeCheck className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 rounded-xl bg-primary-foreground/10 p-4 text-xs leading-relaxed text-primary-foreground/90">
                <strong className="block mb-1">How it works:</strong>
                Opt in during signup, complete your payment, and the Partner
                Badge appears on your listing to help you stand out to potential
                clients.
              </div>
            </div>
          </div>
        </section>

        {/* Signup Form */}
        <section
          id="signup-form"
          className="mx-auto max-w-3xl px-4 pb-20 lg:px-8 scroll-mt-24"
        >
          {submitted ? (
            <div className="rounded-3xl border border-border/60 bg-card p-8 text-center lg:p-14">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h2 className="mt-6 font-display text-3xl font-bold tracking-tight sm:text-4xl text-balance">
                {formData.wantVerification
                  ? "Listing submitted — redirecting to verification"
                  : "You're listed!"}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                {formData.wantVerification
                  ? "Your free listing has been received. We're redirecting you to complete payment for your Virtexa Partner Badge. Once payment is confirmed, the badge will appear on your listing automatically — no manual step needed. If the page doesn't open, click the button below."
                  : "Your free listing has been submitted and will appear in the directory once reviewed. You can upgrade to a Partner Badge anytime."}
              </p>
              {formData.wantVerification && (
                <div className="mt-8">
                  <Button
                    asChild
                    size="lg"
                    className="h-12 px-8 gradient-btn border-0 font-semibold text-base"
                  >
                    <a
                      href={`${PAYMENT_LINK}?email=${encodeURIComponent(formData.email)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Complete Verification
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              )}
              {!formData.wantVerification && (
                <div className="mt-8">
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="h-12 px-8 font-semibold text-base"
                  >
                    <a href="/">Back to Directory</a>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-3xl border border-border/60 bg-card p-6 lg:p-10">
              <div className="mb-8 text-center">
                <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl text-balance">
                  Submit your free listing
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                  Fill out the form below to add your business to the Virtexa
                  directory. It's free — verification is optional.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Business Name */}
                <div className="space-y-2">
                  <Label
                    htmlFor="businessName"
                    className="text-sm font-semibold"
                  >
                    Business Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) =>
                      updateField("businessName", e.target.value)
                    }
                    placeholder="e.g. Summit Mortgage Group"
                    className={errors.businessName ? "border-destructive" : ""}
                  />
                  {errors.businessName && (
                    <p className="text-xs text-destructive">
                      {errors.businessName}
                    </p>
                  )}
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-semibold">
                    Service Category <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => updateField("category", v)}
                  >
                    <SelectTrigger
                      className={errors.category ? "border-destructive" : ""}
                    >
                      <SelectValue placeholder="Select your service category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-xs text-destructive">
                      {errors.category}
                    </p>
                  )}
                </div>

                {/* Contact Name */}
                <div className="space-y-2">
                  <Label
                    htmlFor="contactName"
                    className="text-sm font-semibold"
                  >
                    Contact Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    onChange={(e) => updateField("contactName", e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className={errors.contactName ? "border-destructive" : ""}
                  />
                  {errors.contactName && (
                    <p className="text-xs text-destructive">
                      {errors.contactName}
                    </p>
                  )}
                </div>

                {/* Email + Phone */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      placeholder="jane@business.com"
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-semibold">
                      Phone <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        placeholder="(555) 123-4567"
                        className={`pl-10 ${errors.phone ? "border-destructive" : ""}`}
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-xs text-destructive">{errors.phone}</p>
                    )}
                  </div>
                </div>

                {/* Website */}
                <div className="space-y-2">
                  <Label htmlFor="website" className="text-sm font-semibold">
                    Website <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => updateField("website", e.target.value)}
                      placeholder="https://yourbusiness.com"
                      className={`pl-10 ${errors.website ? "border-destructive" : ""}`}
                    />
                  </div>
                  {errors.website && (
                    <p className="text-xs text-destructive">{errors.website}</p>
                  )}
                </div>

                {/* City + State */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-semibold">
                      City <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => updateField("city", e.target.value)}
                      placeholder="e.g. Austin"
                      className={errors.city ? "border-destructive" : ""}
                    />
                    {errors.city && (
                      <p className="text-xs text-destructive">{errors.city}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-sm font-semibold">
                      State <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => updateField("state", e.target.value)}
                      placeholder="e.g. TX"
                      className={errors.state ? "border-destructive" : ""}
                    />
                    {errors.state && (
                      <p className="text-xs text-destructive">{errors.state}</p>
                    )}
                  </div>
                </div>

                {/* Address (optional) */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-semibold">
                    Street Address{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="123 Main St, Austin, TX 78701"
                  />
                </div>

                {/* Bio (optional) */}
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-sm font-semibold">
                    Business Description{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => updateField("bio", e.target.value)}
                    placeholder="Tell customers what makes your business stand out…"
                    rows={3}
                  />
                </div>

                {/* Services Offered */}
                <div className="space-y-2">
                  <Label
                    htmlFor="servicesOffered"
                    className="text-sm font-semibold"
                  >
                    Services Offered{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional — one per line)
                    </span>
                  </Label>
                  <Textarea
                    id="servicesOffered"
                    value={formData.servicesOffered}
                    onChange={(e) =>
                      updateField("servicesOffered", e.target.value)
                    }
                    placeholder={
                      "e.g.\nBuyer representation\nListing & marketing\nMarket analysis"
                    }
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    List the specific services you offer. Each line becomes a
                    bullet point on your business page.
                  </p>
                </div>

                {/* GMB Link */}
                <div className="space-y-2">
                  <Label htmlFor="gmbLink" className="text-sm font-semibold">
                    Google Business Profile Link{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id="gmbLink"
                    type="url"
                    value={formData.gmbLink}
                    onChange={(e) => updateField("gmbLink", e.target.value)}
                    placeholder="https://maps.google.com/your-business"
                  />
                  <p className="text-xs text-muted-foreground">
                    Link to your Google Business Profile so customers can find
                    your reviews and location.
                  </p>
                </div>

                {/* Social Media Links */}
                <div className="space-y-4">
                  <Label className="text-sm font-semibold">
                    Social Media Links{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </Label>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="facebook"
                        className="text-xs text-muted-foreground"
                      >
                        Facebook
                      </Label>
                      <Input
                        id="facebook"
                        type="url"
                        value={formData.facebook}
                        onChange={(e) =>
                          updateField("facebook", e.target.value)
                        }
                        placeholder="https://facebook.com/yourpage"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="instagram"
                        className="text-xs text-muted-foreground"
                      >
                        Instagram
                      </Label>
                      <Input
                        id="instagram"
                        type="url"
                        value={formData.instagram}
                        onChange={(e) =>
                          updateField("instagram", e.target.value)
                        }
                        placeholder="https://instagram.com/yourhandle"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="linkedin"
                        className="text-xs text-muted-foreground"
                      >
                        LinkedIn
                      </Label>
                      <Input
                        id="linkedin"
                        type="url"
                        value={formData.linkedin}
                        onChange={(e) =>
                          updateField("linkedin", e.target.value)
                        }
                        placeholder="https://linkedin.com/company/yourbusiness"
                      />
                    </div>
                  </div>
                </div>

                {/* Verification opt-in */}
                <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="wantVerification"
                      checked={formData.wantVerification}
                      onCheckedChange={(v) =>
                        updateField("wantVerification", v === true)
                      }
                      className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor="wantVerification"
                        className="cursor-pointer"
                      >
                        <span className="flex items-center gap-2 font-semibold">
                          <ShieldCheck className="h-4 w-4 text-primary" />
                          Yes, I want the Virtexa Partner Badge
                        </span>
                        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                          Get the Virtexa Partner Badge and rank above
                          non-partner listings in your category. The Partner
                          Badge gives your business additional recognition and
                          visibility to help you stand out. After submitting
                          this form you'll be redirected to complete payment.
                        </p>
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Submit error (e.g. Supabase table not set up) */}
                {errors.submit && (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3.5 text-sm text-destructive">
                    {errors.submit}
                  </div>
                )}

                {/* Submit */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={submitting}
                    className="h-12 w-full gradient-btn border-0 font-semibold text-base"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        {formData.wantVerification
                          ? "Submit & Continue to Verification"
                          : "Submit Free Listing"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <p className="mt-4 text-center text-xs text-muted-foreground">
                    Free to list · No obligation
                  </p>
                </div>
              </form>
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default SubmitListing;
