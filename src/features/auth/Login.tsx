import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { AuthShell } from "./AuthShell";
import { Field, PasswordNote } from "./fields";
import { Button } from "@/components/ui";
import { useAuth } from "@/lib/auth";

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("ops@freshroots.in");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    await signIn(email, password);
    navigate("/command");
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your FoodFlow workspace."
      footer={
        <>
          New to FoodFlow?{" "}
          <Link to="/signup" className="font-semibold text-brand hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field
          label="Work email"
          icon={<Mail size={16} />}
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@company.in"
          autoFocus
        />
        <Field
          label="Password"
          icon={<Lock size={16} />}
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          rightLabel={<span className="text-xs text-ink-3 hover:text-ink">Forgot?</span>}
        />
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"} <ArrowRight size={16} />
        </Button>
        <PasswordNote />
      </form>
    </AuthShell>
  );
}
