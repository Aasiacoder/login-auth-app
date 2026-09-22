import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowRight, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError, validateEmail, validatePassword } from "@/lib/auth-validation";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account — Aegis" },
      { name: "description", content: "Create your secure Aegis account." },
      { property: "og:title", content: "Create account — Aegis" },
      { property: "og:description", content: "Create your secure Aegis account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; confirm?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean; confirm?: boolean }>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function confirmError(value: string, pwd: string) {
    if (!value) return "Please re-enter your password.";
    return value === pwd ? "" : "Passwords do not match.";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const matchError = confirmError(confirm, password);
    setTouched({ email: true, password: true, confirm: true });
    if (emailError || passwordError || matchError) {
      setFieldErrors({
        email: emailError || undefined,
        password: passwordError || undefined,
        confirm: matchError || undefined,
      });
      return;
    }
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (authError) {
      setError(friendlyAuthError(authError.message));
      setLoading(false);
      return;
    }
    if (!data.session) {
      setMessage("Check your email to confirm your account, then log in.");
      setLoading(false);
      return;
    }
    await navigate({ to: "/home", replace: true });
  }

  return (
    <AuthShell animation="enter-signup">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Get started</p>
      <h1 className="mt-3 font-display text-3xl font-semibold">Create your account</h1>
      <p className="mt-2 text-sm text-muted-foreground">One quiet, secure place for you.</p>
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
              aria-invalid={Boolean(touched.email && fieldErrors.email)}
              onChange={(event) => {
                setEmail(event.target.value);
                if (touched.email) setFieldErrors((p) => ({ ...p, email: validateEmail(event.target.value) || undefined }));
              }}
              onBlur={(event) => {
                setTouched((p) => ({ ...p, email: true }));
                setFieldErrors((p) => ({ ...p, email: validateEmail(event.target.value) || undefined }));
              }}
              placeholder="you@example.com"
            />
          </span>
          {touched.email && fieldErrors.email ? (
            <span className="block text-xs font-normal text-destructive">{fieldErrors.email}</span>
          ) : null}
        </label>
        <label className="block space-y-2 text-sm font-medium">
          <span>Password</span>
          <span className="relative block">
            <LockKeyhole className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="h-11 pl-10"
              type="password"
              autoComplete="new-password"
              value={password}
              aria-invalid={Boolean(touched.password && fieldErrors.password)}
              onChange={(event) => {
                setPassword(event.target.value);
                if (touched.password) setFieldErrors((p) => ({ ...p, password: validatePassword(event.target.value) || undefined }));
              }}
              onBlur={(event) => {
                setTouched((p) => ({ ...p, password: true }));
                setFieldErrors((p) => ({ ...p, password: validatePassword(event.target.value) || undefined }));
              }}
              placeholder="At least 6 characters"
            />
          </span>
          {touched.password && fieldErrors.password ? (
            <span className="block text-xs font-normal text-destructive">{fieldErrors.password}</span>
          ) : null}
        </label>
        <label className="block space-y-2 text-sm font-medium">
          <span>Confirm password</span>
          <span className="relative block">
            <LockKeyhole className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="h-11 pl-10"
              type="password"
              autoComplete="new-password"
              value={confirm}
              aria-invalid={Boolean(touched.confirm && fieldErrors.confirm)}
              onChange={(event) => {
                setConfirm(event.target.value);
                if (touched.confirm) setFieldErrors((p) => ({ ...p, confirm: confirmError(event.target.value, password) || undefined }));
              }}
              onBlur={(event) => {
                setTouched((p) => ({ ...p, confirm: true }));
                setFieldErrors((p) => ({ ...p, confirm: confirmError(event.target.value, password) || undefined }));
              }}
              placeholder="Re-enter your password"
            />
          </span>
          {touched.confirm && fieldErrors.confirm ? (
            <span className="block text-xs font-normal text-destructive">{fieldErrors.confirm}</span>
          ) : null}
        </label>
        {error ? (
          <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {message ? (
          <p role="status" className="rounded-md border border-primary/25 bg-primary/10 p-3 text-sm text-primary">{message}</p>
        ) : null}
        <Button type="submit" variant="premium" size="auth" disabled={loading}>
          {loading ? (
            <>
              <LoaderCircle className="animate-spin" /> Creating account…
            </>
          ) : (
            <>
              Create account <ArrowRight />
            </>
          )}
        </Button>
      </form>
      <p className="mt-7 text-center text-sm text-muted-foreground">
        Already have an account? <Link to="/" className="font-semibold text-primary hover:underline">Log in</Link>
      </p>
    </AuthShell>
  );
}
