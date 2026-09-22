import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowRight, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

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
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (authError) {
      setError(authError.message);
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
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <label className="block space-y-2 text-sm font-medium">
          <span>Email address</span>
          <span className="relative block"><Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><Input className="h-11 pl-10" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></span>
        </label>
        <label className="block space-y-2 text-sm font-medium">
          <span>Password</span>
          <span className="relative block"><LockKeyhole className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><Input className="h-11 pl-10" type="password" autoComplete="new-password" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" /></span>
        </label>
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        {message ? <p role="status" className="rounded-md border border-primary/25 bg-primary/10 p-3 text-sm text-primary">{message}</p> : null}
        <Button type="submit" variant="premium" size="auth" disabled={loading}>
          {loading ? <LoaderCircle className="animate-spin" /> : <>Create account <ArrowRight /></>}
        </Button>
      </form>
      <p className="mt-7 text-center text-sm text-muted-foreground">
        Already have an account? <Link to="/" className="font-semibold text-primary hover:underline">Log in</Link>
      </p>
    </AuthShell>
  );
}