import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Building2, Mail, User as UserIcon } from "lucide-react";
import { AuthShell } from "./AuthShell";
import { Field, Select, PasswordNote } from "./fields";
import { Button } from "@/components/ui";
import { useAuth } from "@/lib/auth";

const ROLES = ["Operations", "FPO / Cooperative", "Processor", "Mandi / Market", "Food bank / NGO", "Logistics"];

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [role, setRole] = useState(ROLES[0]);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setBusy(true);
    await signUp({ name, email, org, role });
    navigate("/command");
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
        <Field label="Full name" icon={<UserIcon size={16} />} value={name} onChange={setName} placeholder="Ravi Kumar" autoFocus />
        <Field label="Work email" icon={<Mail size={16} />} type="email" value={email} onChange={setEmail} placeholder="you@company.in" />
        <Field label="Organization" icon={<Building2 size={16} />} value={org} onChange={setOrg} placeholder="FreshRoots FPO" />
        <Select label="Your role" value={role} onChange={setRole} options={ROLES} />
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "Creating…" : "Create workspace"} <ArrowRight size={16} />
        </Button>
        <PasswordNote />
      </form>
    </AuthShell>
  );
}
