import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowLeft, KeyRound } from "lucide-react";
import { sendLoginCode, verifyLoginCode } from "@/data/vendors";

const RESEND_SECONDS = 60;

interface VerifyEmailCodeProps {
  email: string;
  /** Called once the code checks out; the visitor is now signed in. */
  onVerified: () => void | Promise<void>;
  onBack: () => void;
  backLabel?: string;
  description?: string;
}

/** Step 2 of email sign-in: enter the code that `sendLoginCode` emailed. */
export function VerifyEmailCode({
  email,
  onVerified,
  onBack,
  backLabel = "Use a different email",
  description,
}: VerifyEmailCodeProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [sending, setSending] = useState(false);
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setError("");
    const ok = await verifyLoginCode(email, code);
    if (ok) {
      await onVerified();
    } else {
      setError("Invalid or expired code. Please check your email and try again.");
    }
    setVerifying(false);
  };

  const handleResend = async () => {
    setSending(true);
    setError("");
    const result = await sendLoginCode(email);
    setSending(false);
    if (result.ok) setResendIn(RESEND_SECONDS);
    else setError(result.error || "Failed to resend code.");
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary border border-primary/20">
          <KeyRound className="h-6 w-6" />
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Verify Your Email
        </h1>
      </div>
      <p className="text-muted-foreground leading-relaxed mb-8">
        We sent a verification code to{" "}
        <span className="font-semibold text-foreground">{email}</span>.{" "}
        {description ?? "Enter it below to continue."}
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
                autoComplete="one-time-code"
                maxLength={10}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
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
              disabled={verifying || code.length < 6}
              className="w-full gradient-btn border-0 font-semibold"
            >
              {verifying ? "Verifying…" : "Verify Code"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            {resendIn > 0 ? (
              <p className="text-sm text-muted-foreground">
                Resend code in {resendIn}s
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={sending}
                className="text-sm font-semibold text-primary hover:underline disabled:opacity-50"
              >
                {sending ? "Sending…" : "Resend code"}
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      <button
        onClick={onBack}
        className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> {backLabel}
      </button>
    </div>
  );
}
