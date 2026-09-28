import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Search,
  ShieldCheck,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Save,
  Mail,
  KeyRound,
} from "lucide-react";
import {
  CATEGORIES,
  findVendorsByEmail,
  sendVerificationCode,
  verifyCode,
  updateVendor,
  deleteVendor,
  type Vendor,
  type VendorCategory,
} from "@/data/vendors";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Step = "lookup" | "verify" | "select" | "edit" | "success" | "deleted";

const ClaimListing = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("lookup");
  const [email, setEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [matches, setMatches] = useState<Vendor[]>([]);
  const [selected, setSelected] = useState<Vendor | null>(null);
  const [error, setError] = useState("");

  // Verification state
  const [otpCode, setOtpCode] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Edit form state
  const [form, setForm] = useState<Partial<Vendor>>({});
  const [servicesText, setServicesText] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [saving, setSaving] = useState(false);

  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSearching(true);
    setError("");
    const results = await findVendorsByEmail(email.trim().toLowerCase());
    setSearching(false);
    if (results.length === 0) {
      setError(
        "No listings found for that email. Make sure you used the same email you listed with.",
      );
    } else {
      setMatches(results);
      // Send verification code
      setSendingCode(true);
      const result = await sendVerificationCode(email.trim().toLowerCase());
      setSendingCode(false);
      if (result.ok) {
        setStep("verify");
        startResendTimer();
      } else {
        setError(
          result.error || "Failed to send verification code. Please try again.",
        );
      }
    }
  };

  const handleResendCode = async () => {
    setSendingCode(true);
    setError("");
    const result = await sendVerificationCode(email.trim().toLowerCase());
    setSendingCode(false);
    if (result.ok) {
      startResendTimer();
    } else {
      setError(result.error || "Failed to resend code.");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) return;
    setVerifying(true);
    setError("");
    const isValid = await verifyCode(
      email.trim().toLowerCase(),
      otpCode.trim(),
    );
    setVerifying(false);
    if (isValid) {
      setStep("select");
      window.scrollTo(0, 0);
    } else {
      setError(
        "Invalid or expired code. Please check your email and try again.",
      );
    }
  };

  const handleSelect = (v: Vendor) => {
    setSelected(v);
    setForm({
      name: v.name,
      category: v.category,
      city: v.city,
      state: v.state,
      phone: v.phone,
      email: v.email,
      website: v.website,
      address: v.address,
      bio: v.bio,
      longBio: v.longBio,
      servicesOffered: v.servicesOffered,
      gmbLink: v.gmbLink,
      facebook: v.facebook,
      instagram: v.instagram,
      linkedin: v.linkedin,
      tags: v.tags,
    });
    setServicesText(v.servicesOffered.join("\n"));
    setTagsText(v.tags.join(", "));
    setStep("edit");
    window.scrollTo(0, 0);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    setError("");

    const updates: Partial<Vendor> = {
      ...form,
      servicesOffered: servicesText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      tags: tagsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    const ok = await updateVendor(selected.id, updates);
    setSaving(false);
    if (ok) {
      setStep("success");
      window.scrollTo(0, 0);
    } else {
      setError("Failed to save changes. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    const ok = await deleteVendor(selected.id);
    setSaving(false);
    if (ok) {
      setStep("deleted");
      window.scrollTo(0, 0);
    } else {
      setError("Failed to delete listing. Please try again.");
    }
  };

  const update = (field: keyof Vendor, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background font-body">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 lg:px-8">
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Directory
        </Link>

        {/* Step: Lookup */}
        {step === "lookup" && (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary border border-primary/20">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h1 className="font-display text-3xl font-bold tracking-tight">
                Claim & Manage Your Listing
              </h1>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Enter the email address you used when submitting your listing.
              We'll send a one-time verification code to that email to confirm
              your identity before you can make changes.
            </p>

            <Card className="border-border/70 bg-card">
              <CardContent className="pt-6">
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  {error && (
                    <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  <Button
                    type="submit"
                    disabled={searching}
                    className="w-full gradient-btn border-0 font-semibold"
                  >
                    {searching ? "Searching…" : "Find My Listing"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don't have a listing yet?{" "}
              <Link
                to="/submit-listing"
                className="font-semibold text-primary hover:underline"
              >
                Submit a free listing
              </Link>
            </p>
          </div>
        )}

        {/* Step: Verify */}
        {step === "verify" && (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary border border-primary/20">
                <KeyRound className="h-6 w-6" />
              </div>
              <h1 className="font-display text-3xl font-bold tracking-tight">
                Verify Your Identity
              </h1>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-8">
              We sent a 6-digit verification code to{" "}
              <span className="font-semibold text-foreground">{email}</span>.
              Enter it below to confirm you own this listing before making any
              changes.
            </p>

            <Card className="border-border/70 bg-card">
              <CardContent className="pt-6">
                <form onSubmit={handleVerify} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-sm font-semibold">
                      Verification Code
                    </Label>
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) =>
                        setOtpCode(e.target.value.replace(/\D/g, ""))
                      }
                      className="text-center text-2xl tracking-[0.5em] font-bold"
                      required
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
                    disabled={verifying || otpCode.length !== 6}
                    className="w-full gradient-btn border-0 font-semibold"
                  >
                    {verifying ? "Verifying…" : "Verify Code"}
                  </Button>
                </form>

                <div className="mt-4 text-center">
                  {resendTimer > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Resend code in {resendTimer}s
                    </p>
                  ) : (
                    <button
                      onClick={handleResendCode}
                      disabled={sendingCode}
                      className="text-sm font-semibold text-primary hover:underline disabled:opacity-50"
                    >
                      {sendingCode ? "Sending…" : "Resend code"}
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>

            <button
              onClick={() => {
                setStep("lookup");
                setError("");
                setOtpCode("");
              }}
              className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Use a different email
            </button>
          </div>
        )}

        {/* Step: Select */}
        {step === "select" && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-primary">
                Email verified
              </span>
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight mb-2">
              Your Listings
            </h1>
            <p className="text-muted-foreground mb-8">
              We found {matches.length} listing{matches.length !== 1 ? "s" : ""}{" "}
              matching your email. Select one to manage it.
            </p>
            <div className="space-y-3">
              {matches.map((v) => {
                const cat = CATEGORIES.find((c) => c.id === v.category);
                return (
                  <button
                    key={v.id}
                    onClick={() => handleSelect(v)}
                    className="w-full text-left"
                  >
                    <Card className="group border-border/70 bg-card transition-all hover:border-primary/50 hover:shadow-lg">
                      <CardContent className="flex items-center gap-4 p-5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary border border-primary/20">
                          <Building2 className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-display text-lg font-semibold group-hover:text-primary transition-colors">
                              {v.name}
                            </h3>
                            {v.verified && (
                              <Badge className="gap-1 bg-primary/15 text-primary border-primary/30">
                                <CheckCircle2 className="h-3 w-3" /> Partner
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {cat?.label} · {v.city}, {v.state}
                          </p>
                        </div>
                        <Edit3 className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </CardContent>
                    </Card>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setStep("lookup")}
              className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Search again
            </button>
          </div>
        )}

        {/* Step: Edit */}
        {step === "edit" && selected && (
          <div>
            <div className="flex items-center justify-between gap-4 mb-6">
              <h1 className="font-display text-3xl font-bold tracking-tight">
                Edit Your Listing
              </h1>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" /> Delete Listing
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove "{selected.name}" from the
                      Virtexa directory. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Yes, delete it
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              {/* Business Info */}
              <Card className="border-border/70 bg-card">
                <CardHeader>
                  <CardTitle className="font-display text-lg">
                    Business Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold">
                      Business Name *
                    </Label>
                    <Input
                      id="name"
                      value={form.name ?? ""}
                      onChange={(e) => update("name", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm font-semibold">
                      Service Category *
                    </Label>
                    <select
                      id="category"
                      value={form.category ?? ""}
                      onChange={(e) =>
                        update("category", e.target.value as VendorCategory)
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      required
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-sm font-semibold">
                        City *
                      </Label>
                      <Input
                        id="city"
                        value={form.city ?? ""}
                        onChange={(e) => update("city", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-sm font-semibold">
                        State *
                      </Label>
                      <Input
                        id="state"
                        value={form.state ?? ""}
                        onChange={(e) => update("state", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-semibold">
                      Street Address
                    </Label>
                    <Input
                      id="address"
                      value={form.address ?? ""}
                      onChange={(e) => update("address", e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Contact */}
              <Card className="border-border/70 bg-card">
                <CardHeader>
                  <CardTitle className="font-display text-lg">
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-semibold">
                        Phone *
                      </Label>
                      <Input
                        id="phone"
                        value={form.phone ?? ""}
                        onChange={(e) => update("phone", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold">
                        Email *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email ?? ""}
                        onChange={(e) => update("email", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-sm font-semibold">
                      Website *
                    </Label>
                    <Input
                      id="website"
                      type="url"
                      value={form.website ?? ""}
                      onChange={(e) => update("website", e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Services & Bio */}
              <Card className="border-border/70 bg-card">
                <CardHeader>
                  <CardTitle className="font-display text-lg">
                    Services & Description
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="services" className="text-sm font-semibold">
                      Services Offered (one per line)
                    </Label>
                    <Textarea
                      id="services"
                      value={servicesText}
                      onChange={(e) => setServicesText(e.target.value)}
                      placeholder={
                        "Buyer representation\nListing & marketing\nMarket analysis"
                      }
                      rows={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-sm font-semibold">
                      Short Bio
                    </Label>
                    <Input
                      id="bio"
                      value={form.bio ?? ""}
                      onChange={(e) => update("bio", e.target.value)}
                      placeholder="A brief tagline for your business"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longBio" className="text-sm font-semibold">
                      Full Description
                    </Label>
                    <Textarea
                      id="longBio"
                      value={form.longBio ?? ""}
                      onChange={(e) => update("longBio", e.target.value)}
                      placeholder="Tell customers about your business, experience, and what makes you different."
                      rows={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags" className="text-sm font-semibold">
                      Tags (comma-separated)
                    </Label>
                    <Input
                      id="tags"
                      value={tagsText}
                      onChange={(e) => setTagsText(e.target.value)}
                      placeholder="luxury homes, first-time buyers, commercial"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Links */}
              <Card className="border-border/70 bg-card">
                <CardHeader>
                  <CardTitle className="font-display text-lg">
                    Online Links
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="gmbLink" className="text-sm font-semibold">
                      Google Business Profile Link
                    </Label>
                    <Input
                      id="gmbLink"
                      type="url"
                      value={form.gmbLink ?? ""}
                      onChange={(e) => update("gmbLink", e.target.value)}
                      placeholder="https://business.google.com/..."
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label
                        htmlFor="facebook"
                        className="text-sm font-semibold"
                      >
                        Facebook
                      </Label>
                      <Input
                        id="facebook"
                        type="url"
                        value={form.facebook ?? ""}
                        onChange={(e) => update("facebook", e.target.value)}
                        placeholder="https://facebook.com/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="instagram"
                        className="text-sm font-semibold"
                      >
                        Instagram
                      </Label>
                      <Input
                        id="instagram"
                        type="url"
                        value={form.instagram ?? ""}
                        onChange={(e) => update("instagram", e.target.value)}
                        placeholder="https://instagram.com/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="linkedin"
                        className="text-sm font-semibold"
                      >
                        LinkedIn
                      </Label>
                      <Input
                        id="linkedin"
                        type="url"
                        value={form.linkedin ?? ""}
                        onChange={(e) => update("linkedin", e.target.value)}
                        placeholder="https://linkedin.com/..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  disabled={saving}
                  className="gradient-btn border-0 font-semibold"
                >
                  <Save className="h-4 w-4 mr-1.5" />{" "}
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("select")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Step: Success */}
        {step === "success" && (
          <div className="text-center py-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary mb-6">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight mb-3">
              Listing Updated Successfully
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Your changes have been saved and are now live in the directory.
              Visitors will see your updated information immediately.
            </p>
            {selected && (
              <Button asChild className="gradient-btn border-0 font-semibold">
                <Link to={`/vendor/${selected.id}`}>View My Listing</Link>
              </Button>
            )}
          </div>
        )}

        {/* Step: Deleted */}
        {step === "deleted" && (
          <div className="text-center py-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/15 text-destructive mb-6">
              <Trash2 className="h-8 w-8" />
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight mb-3">
              Listing Removed
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Your business has been permanently removed from the Virtexa
              directory.
            </p>
            <Button asChild className="gradient-btn border-0 font-semibold">
              <Link to="/">Back to Directory</Link>
            </Button>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default ClaimListing;
