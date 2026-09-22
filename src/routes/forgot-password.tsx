import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowRight, LoaderCircle, Mail } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError, validateEmail } from "@/lib/auth-validation";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — Aegis" },
      { name: "description", content: "Request a secure password recovery email for your Aegis account." },
      { property: "og:title", content: "Reset your password — Aegis" },
      { property: "og:description", content: "Request a secure password recovery email for your Aegis account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const emailError = validateEmail(email);
    setTouched(true);
    setFieldError(emailError);
    if (emailError) return;
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (resetError) {
      setError(friendlyAuthError(resetError.message));
      return;
    }
    setSent(true);
  }

  return (
    <AuthShell animation="enter-signup">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Account recovery</p>
      <h1 className="mt-3 font-display text-3xl font-semibold">Forgot your password?</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter your email and we'll send you a secure link to set a new one.
      </p>

      {sent ? (
        <p role="status" className="mt-8 rounded-md border border-primary/25 bg-primary/10 p-4 text-sm text-primary">
          If an account exists for that email, a reset link is on its way. The link expires shortly, so use it soon.
        </p>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
          <label className="block space-y-2 text-sm font-medium">
            <span>Email address</span>
            <span className="relative block">
              <Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="h-11 pl-10"
                type="email"
                autoComplete="email"
                value={email}
                aria-invalid={Boolean(touched && fieldError)}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (touched) setFieldError(validateEmail(event.target.value));
                }}
                onBlur={(event) => {
                  setTouched(true);
                  setFieldError(validateEmail(event.target.value));
                }}
                placeholder="you@example.com"
              />
            </span>
            {touched && fieldError ? (
              <span className="block text-xs font-normal text-destructive">{fieldError}</span>
            ) : null}
          </label>
          {error ? (
            <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" variant="premium" size="auth" disabled={loading}>
            {loading ? (
              <>
                <LoaderCircle className="animate-spin" /> Sending link…
              </>
            ) : (
              <>
                Send reset link <ArrowRight />
              </>
            )}
          </Button>
        </form>
      )}

      <p className="mt-7 text-center text-sm text-muted-foreground">
        Remembered it? <Link to="/" className="font-semibold text-primary hover:underline">Back to log in</Link>
      </p>
    </AuthShell>
  );
}
