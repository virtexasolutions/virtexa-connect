import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { VerifyEmailCode } from "@/components/VerifyEmailCode";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import {
  CATEGORIES,
  fetchMyListings,
  fetchVendorById,
  getSignedInEmail,
  sendLoginCode,
  submitClaim,
  type Vendor,
} from "@/data/vendors";
import { postTrackingEvent, trackingContext } from "@/lib/tracking";

type Step = "loading" | "not-found" | "owned" | "form" | "verify" | "submitted";

const ROLES = ["Owner", "Manager", "Employee", "Marketing agency", "Other"];

const ClaimBusiness = () => {
  const { id } = useParams<{ id: string }>();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [step, setStep] = useState<Step>("loading");
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "Owner",
    message: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [alreadyPending, setAlreadyPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [v, email] = await Promise.all([
        fetchVendorById(id || ""),
        getSignedInEmail(),
      ]);
      if (cancelled) return;
      if (!v) {
        setStep("not-found");
        return;
      }
      setVendor(v);
      document.title = `Claim ${v.name} | Virtexa Resource Center`;
      if (email) {
        setSignedInEmail(email);
        setForm((f) => ({ ...f, email }));
        const mine = await fetchMyListings();
        if (cancelled) return;
        if (mine.some((m) => m.id === v.id)) {
          setStep("owned");
          return;
        }
      }
      setStep("form");
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const update = (field: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const normalizedEmail = form.email.trim().toLowerCase();

  const finishClaim = async () => {
    if (!vendor) return;
    setError("");
    const result = await submitClaim({
      vendorId: vendor.id,
      name: form.name.trim(),
      email: normalizedEmail,
      phone: form.phone.trim(),
      role: form.role,
      message: form.message.trim(),
    });
    if (!result.ok) {
      setError("We couldn't submit your claim. Please try again.");
      setStep("form");
      return;
    }
    setAlreadyPending(Boolean(result.alreadyPending));
    if (!result.alreadyPending) notifyCrm(vendor);
    setStep("submitted");
    window.scrollTo(0, 0);
  };

  const notifyCrm = (v: Vendor) => {
    const [firstName, ...rest] = form.name.trim().split(" ");
    postTrackingEvent({
      type: "external_form_submission",
      timestamp: Date.now(),
      formId: "claim-listing",
      formData: {
        first_name: firstName || "",
        last_name: rest.join(" "),
        email: normalizedEmail,
        phone: form.phone.trim(),
        city: v.city,
        state: v.state,
        country: "US",
      },
      formLabels: {
        first_name: "Contact Name",
        last_name: "Contact Name",
        email: "Email",
        phone: "Phone",
        city: "City",
        state: "State",
        country: "Country",
      },
      ...trackingContext("Claim Listing"),
    }, {
      customFields: {
        Tcl4GOft4IWADg7QnptS: { value: v.name, label: "Business Name" },
        claim_listing_id: { value: v.id, label: "Claimed Listing ID" },
        claim_role: { value: form.role, label: "Role at Business" },
        claim_message: { value: form.message.trim(), label: "Claim Notes" },
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Please enter your name and a valid email address.");
      return;
    }
    setBusy(true);
    setError("");
    if (signedInEmail === normalizedEmail) {
      // Email already verified in this browser.
      await finishClaim();
    } else {
      const result = await sendLoginCode(normalizedEmail);
      if (result.ok) setStep("verify");
      else setError(result.error || "Could not send the verification email.");
    }
    setBusy(false);
  };

  const category = vendor
    ? CATEGORIES.find((c) => c.id === vendor.category)
    : undefined;

  const websiteHost = (() => {
    try {
      return vendor?.website
        ? new URL(vendor.website).hostname.replace(/^www\./, "")
        : "";
    } catch {
      return "";
    }
  })();

  return (
    <div className="min-h-screen bg-background font-body">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 lg:px-8">
        <Link
          to={vendor ? `/vendor/${vendor.id}` : "/"}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />{" "}
          {vendor ? "Back to listing" : "Back to Directory"}
        </Link>

        {step === "loading" && (
          <p className="py-12 text-center text-muted-foreground">Loading…</p>
        )}

        {step === "not-found" && (
          <div className="py-12 text-center">
            <h1 className="font-display text-3xl font-bold tracking-tight mb-3">
              Listing not found
            </h1>
            <p className="text-muted-foreground mb-8">
              This listing may have been removed. You can add your business
              for free instead.
            </p>
            <Button asChild className="gradient-btn border-0 font-semibold">
              <Link to="/submit-listing">Submit a free listing</Link>
            </Button>
          </div>
        )}

        {vendor && step === "owned" && (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary mb-6">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight mb-3">
              You already manage this listing
            </h1>
            <p className="text-muted-foreground mb-8">
              {signedInEmail} has access to {vendor.name}.
            </p>
            <Button asChild className="gradient-btn border-0 font-semibold">
              <Link to="/claim-listing">Manage your listing</Link>
            </Button>
          </div>
        )}

        {vendor && step === "form" && (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary border border-primary/20">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h1 className="font-display text-3xl font-bold tracking-tight">
                Claim This Listing
              </h1>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Claiming is free. Verify your email, and once our team confirms
              you represent this business you'll be able to update its details.
            </p>

            <Card className="mb-6 border-border/70 bg-card">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary border border-primary/20">
                  <Building2 className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="font-display text-lg font-semibold">
                    {vendor.name}
                  </p>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {category?.label} ·{" "}
                    {vendor.city}, {vendor.state}
                  </p>
                </div>
              </CardContent>
            </Card>

            {vendor.claimed && (
              <div className="mb-6 flex items-start gap-2 rounded-lg border border-border/70 bg-secondary/40 p-3 text-sm text-muted-foreground">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  This listing is already managed by someone. If you should
                  have access too, submit a request and our team will review
                  it.
                </span>
              </div>
            )}

            <Card className="border-border/70 bg-card">
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="claim-name">Your name *</Label>
                      <Input
                        id="claim-name"
                        value={form.name}
                        onChange={(e) => update("name", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="claim-role">Your role</Label>
                      <Select
                        value={form.role}
                        onValueChange={(v) => update("role", v)}
                      >
                        <SelectTrigger id="claim-role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="claim-email">Business email *</Label>
                    <Input
                      id="claim-email"
                      type="email"
                      placeholder={
                        websiteHost ? `you@${websiteHost}` : "you@business.com"
                      }
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      required
                    />
                    {websiteHost && (
                      <p className="text-xs text-muted-foreground">
                        An email at {websiteHost} gets approved fastest.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="claim-phone">Phone</Label>
                    <Input
                      id="claim-phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="claim-message">
                      Anything that helps us confirm it's you (optional)
                    </Label>
                    <Textarea
                      id="claim-message"
                      rows={3}
                      value={form.message}
                      onChange={(e) => update("message", e.target.value)}
                    />
                  </div>
                  {error && (
                    <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  <Button
                    type="submit"
                    disabled={busy}
                    className="w-full gradient-btn border-0 font-semibold"
                  >
                    {busy
                      ? "Please wait…"
                      : signedInEmail === normalizedEmail
                        ? "Submit Claim"
                        : "Send Verification Code"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {vendor && step === "verify" && (
          <VerifyEmailCode
            email={normalizedEmail}
            description="Enter it below to submit your claim."
            onVerified={finishClaim}
            onBack={() => setStep("form")}
            backLabel="Back to claim form"
          />
        )}

        {vendor && step === "submitted" && (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary mb-6">
              <Clock className="h-8 w-8" />
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight mb-3">
              {alreadyPending ? "Claim already under review" : "Claim submitted"}
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              We're reviewing your request to manage {vendor.name}. Once it's
              approved, sign in on the Manage Listing page with{" "}
              <span className="font-semibold text-foreground">
                {normalizedEmail}
              </span>{" "}
              to update your details.
            </p>
            <Button asChild className="gradient-btn border-0 font-semibold">
              <Link to={`/vendor/${vendor.id}`}>Back to listing</Link>
            </Button>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default ClaimBusiness;
