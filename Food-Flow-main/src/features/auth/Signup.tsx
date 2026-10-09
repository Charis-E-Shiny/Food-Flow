import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Building2, Lock, Mail, User as UserIcon } from "lucide-react";
import { AuthShell } from "./AuthShell";
import { Field, FormError, Select, PasswordNote } from "./fields";
import { Button } from "@/components/ui";
import { useAuth } from "@/lib/auth";

const ROLES = ["Operations", "FPO / Cooperative", "Processor", "Mandi / Market", "Food bank / NGO", "Logistics"];

export default function Signup() {
  const { signUp, error: authError } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [role, setRole] = useState(ROLES[0]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signUp({ name, email, password, org, role });
      navigate("/command");
    } catch (signUpError) {
      setError(signUpError instanceof Error ? signUpError.message : "Could not create your account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Start with FoodFlow"
      subtitle="Create a workspace and open the command center in seconds."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name" icon={<UserIcon size={16} />} value={name} onChange={setName} placeholder="Ravi Kumar" autoFocus required autoComplete="name" />
        <Field label="Work email" icon={<Mail size={16} />} type="email" value={email} onChange={setEmail} placeholder="you@company.in" required autoComplete="email" />
        <Field label="Organization" icon={<Building2 size={16} />} value={org} onChange={setOrg} placeholder="FreshRoots FPO" />
        <Select label="Your role" value={role} onChange={setRole} options={ROLES} />
        <Field label="Password" icon={<Lock size={16} />} type="password" value={password} onChange={setPassword} placeholder="At least 6 characters" required minLength={6} autoComplete="new-password" />
        <Field label="Confirm password" icon={<Lock size={16} />} type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Re-enter your password" required minLength={6} autoComplete="new-password" />
        <FormError>{error ?? authError}</FormError>
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "Creating…" : "Create workspace"} <ArrowRight size={16} />
        </Button>
        <PasswordNote />
      </form>
    </AuthShell>
  );
}
