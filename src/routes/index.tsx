import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowRight, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError, validateEmail, validatePassword } from "@/lib/auth-validation";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Log in — Aegis" },
      { name: "description", content: "Sign in securely to your Aegis account." },
      { property: "og:title", content: "Log in — Aegis" },
      { property: "og:description", content: "Sign in securely to your Aegis account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string | undefined; password?: string | undefined }>({});
  const [touched, setTouched] = useState<{ email?: boolean | undefined; password?: boolean | undefined }>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function checkEmail(value: string) {
    setFieldErrors((prev) => ({ ...prev, email: validateEmail(value) || undefined }));
  }
  function checkPassword(value: string) {
    setFieldErrors((prev) => ({ ...prev, password: validatePassword(value) || undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    setTouched({ email: true, password: true });
    if (emailError || passwordError) {
      setFieldErrors({ email: emailError || undefined, password: passwordError || undefined });
      return;
    }
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (authError || !data.user) {
      setError(friendlyAuthError(authError?.message));
      setLoading(false);
      return;
    }
    const timestamp = new Date().toISOString();
    const { error: profileError } = await supabase
      .from("users_profile")
      .upsert({ id: data.user.id, email: data.user.email ?? null, last_login_at: timestamp }, { onConflict: "id" });
    if (profileError) {
      setError("Signed in, but the login time could not be saved.");
      setLoading(false);
      return;
    }
    const next = new URLSearchParams(window.location.search).get("next");
    if (next && next.startsWith("/") && !next.startsWith("//")) {
      window.location.href = next;
      return;
    }
    await navigate({ to: "/home", replace: true });
  }

  return (
    <AuthShell animation="enter-login">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Welcome back</p>
      <h1 className="mt-3 font-display text-3xl font-semibold">Log in to Aegis</h1>
      <p className="mt-2 text-sm text-muted-foreground">Enter your details to continue.</p>
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
                if (touched.email) checkEmail(event.target.value);
              }}
              onBlur={(event) => {
                setTouched((prev) => ({ ...prev, email: true }));
                checkEmail(event.target.value);
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
              autoComplete="current-password"
              value={password}
              aria-invalid={Boolean(touched.password && fieldErrors.password)}
              onChange={(event) => {
                setPassword(event.target.value);
                if (touched.password) checkPassword(event.target.value);
              }}
              onBlur={(event) => {
                setTouched((prev) => ({ ...prev, password: true }));
                checkPassword(event.target.value);
              }}
              placeholder="Enter your password"
            />
          </span>
          {touched.password && fieldErrors.password ? (
            <span className="block text-xs font-normal text-destructive">{fieldErrors.password}</span>
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
              <LoaderCircle className="animate-spin" /> Logging in…
            </>
          ) : (
            <>
              Log in <ArrowRight />
            </>
          )}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm">
        <Link to="/forgot-password" className="font-medium text-muted-foreground hover:text-primary hover:underline">
          Forgot your password?
        </Link>
      </p>
      <p className="mt-3 text-center text-sm text-muted-foreground">
        New here? <Link to="/signup" className="font-semibold text-primary hover:underline">Create an account</Link>
      </p>
    </AuthShell>
  );
}
