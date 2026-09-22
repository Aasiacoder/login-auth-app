import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowRight, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError || !data.user) {
      setError(authError?.message ?? "Unable to log in.");
      setLoading(false);
      return;
    }
    const timestamp = new Date().toISOString();
    const { error: profileError } = await supabase
      .from("users_profile")
      .upsert({ id: data.user.id, last_login_at: timestamp }, { onConflict: "id" });
    if (profileError) {
      setError("Signed in, but the login time could not be saved.");
      setLoading(false);
      return;
    }
    await navigate({ to: "/home", replace: true });
  }

  return (
    <AuthShell animation="enter-login">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Welcome back</p>
      <h1 className="mt-3 font-display text-3xl font-semibold">Log in to Aegis</h1>
      <p className="mt-2 text-sm text-muted-foreground">Enter your details to continue.</p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <label className="block space-y-2 text-sm font-medium">
          <span>Email address</span>
          <span className="relative block">
            <Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input className="h-11 pl-10" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
          </span>
        </label>
        <label className="block space-y-2 text-sm font-medium">
          <span>Password</span>
          <span className="relative block">
            <LockKeyhole className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input className="h-11 pl-10" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" />
          </span>
        </label>
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" variant="premium" size="auth" disabled={loading}>
          {loading ? <LoaderCircle className="animate-spin" /> : <>Log in <ArrowRight /></>}
        </Button>
      </form>
      <p className="mt-7 text-center text-sm text-muted-foreground">
        New here? <Link to="/signup" className="font-semibold text-primary hover:underline">Create an account</Link>
      </p>
    </AuthShell>
  );
}
