import { motion } from "framer-motion";
import { Check, Clock, PackageCheck, Timer } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHead } from "@/components/layout/PageHead";
import { Card, SectionTitle, Badge, Button } from "@/components/ui";
import { RECIPIENTS } from "@/data/mockData";
import { RECON, CHAIN, type ReconStatus } from "@/data/delivery";
import { tonnes, hours } from "@/lib/format";
import type { Recipient } from "@/types";
import { useOperationalRecords } from "@/hooks/useOperationalRecords";

const RECON_DISCREPANCY = +RECON.reduce((a, r) => a + (r.discrepancyT ?? 0), 0).toFixed(1);

const reconTone: Record<ReconStatus, { tone: "ok" | "warn" | "demand"; label: string }> = {
  received: { tone: "ok", label: "Received" },
  in_transit: { tone: "warn", label: "In transit" },
  dispatched: { tone: "demand", label: "Dispatched" },
};

const statusMeta: Record<Recipient["status"], { tone: "neutral" | "warn" | "ok"; label: string }> = {
  offered: { tone: "neutral", label: "Offered" },
  accepted: { tone: "warn", label: "Accepted · inbound" },
  received: { tone: "ok", label: "Received" },
};

export default function RecipientView() {
  const { records, loading, saving, error, save } = useOperationalRecords();
  const items = RECIPIENTS.map((recipient) => {
    const saved = records.find((record) => record.kind === "recipient" && record.id === recipient.id);
    return { ...recipient, status: saved?.kind === "recipient" ? saved.status : recipient.status };
  });
  const advance = (recipient: Recipient) => {
    const status = recipient.status === "offered" ? "accepted" : "received";
    void save({ id: recipient.id, kind: "recipient", status });
  };

  const inbound = items.filter((r) => r.status !== "received").reduce((a, r) => a + r.incomingT, 0);

  return (
    <div>
      <PageHead
        eyebrow="07 · Verify"
        title="Delivery confirmations"
        sub="Did it arrive? Recipient confirmations across incoming lots — accept, then confirm receipt."
      />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-3">
        <span>Delivery updates save to your private Firebase account.</span>
        {loading && <span role="status">Loading saved updates…</span>}
      </div>
      {error && <p role="alert" className="mb-3 rounded-lg border border-risk/25 bg-risk-soft px-3 py-2 text-sm text-risk">{error}</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MiniKpi label="Inbound now" value={tonnes(inbound)} icon={<PackageCheck size={16} />} />
        <MiniKpi label="Offers pending" value={String(items.filter((r) => r.status === "offered").length)} icon={<Clock size={16} />} />
        <MiniKpi label="Received today" value={String(items.filter((r) => r.status === "received").length)} icon={<Check size={16} />} />
      </div>

      {/* Delivery reconciliation */}
      <Card className="mt-4 overflow-hidden p-0">
        <div className="flex flex-wrap items-end justify-between gap-3 p-5 pb-3">
          <SectionTitle eyebrow="Reconciliation · batch KF-TOM-1026" title="Allocated vs dispatched vs received" sub="Verified receipts feed the Impact Center." />
          <Link to="/impact" className="text-xs font-semibold text-brand hover:underline">View impact →</Link>
        </div>
        <div className="hidden grid-cols-[1.6fr_repeat(4,0.8fr)_0.9fr] gap-3 border-y border-line bg-surface-2 px-5 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-3 sm:grid">
          <span>Destination</span>
          <span className="text-right">Allocated</span>
          <span className="text-right">Dispatched</span>
          <span className="text-right">Received</span>
          <span className="text-right">Δ</span>
          <span className="text-right">Status</span>
        </div>
        {RECON.map((r) => {
          const m = reconTone[r.status];
          return (
            <div key={r.nodeId} className="grid grid-cols-2 gap-2 border-b border-line px-5 py-3 text-sm last:border-b-0 sm:grid-cols-[1.6fr_repeat(4,0.8fr)_0.9fr]">
              <span className="font-medium text-ink">{r.nodeName}</span>
              <span className="nums text-right text-ink-2">{tonnes(r.allocatedT)}</span>
              <span className="nums text-right text-ink-2">{tonnes(r.dispatchedT)}</span>
              <span className="nums text-right font-semibold text-ink">{r.receivedT != null ? tonnes(r.receivedT) : "—"}</span>
              <span className={"nums text-right " + (r.discrepancyT ? "text-warn" : "text-ink-3")}>{r.discrepancyT != null ? (r.discrepancyT > 0 ? `−${r.discrepancyT.toFixed(1)}` : "0.0") : "—"}</span>
              <span className="flex justify-end sm:block sm:text-right">
                <Badge tone={m.tone} dot className="px-1.5 py-0.5 text-[10px]">{m.label}</Badge>
              </span>
            </div>
          );
        })}
        <div className="grid grid-cols-2 gap-2 bg-surface-2 px-5 py-3 text-sm sm:grid-cols-[1.6fr_repeat(4,0.8fr)_0.9fr]">
          <span className="font-semibold text-ink">Total</span>
          <span className="nums text-right font-semibold text-ink">{tonnes(CHAIN.allocatedT)}</span>
          <span className="nums text-right font-semibold text-ink">{tonnes(CHAIN.dispatchedT)}</span>
          <span className="nums text-right font-semibold text-ink">{tonnes(CHAIN.receivedT)}</span>
          <span className="nums text-right font-semibold text-warn">−{RECON_DISCREPANCY.toFixed(1)}</span>
          <span className="text-right text-[11px] text-ink-3">{CHAIN.verifiedLegs}/{CHAIN.totalLegs} verified</span>
        </div>
      </Card>

      <Card className="mt-4 p-5">
        <SectionTitle eyebrow="Incoming" title="Food offered to you" sub="Accept to reserve capacity; confirm receipt when it arrives." />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {items.map((r) => (
            <RecipientCard key={r.id} r={r} onAdvance={() => advance(r)} disabled={loading || saving === `recipient-${r.id}`} />
          ))}
        </div>
      </Card>
    </div>
  );
}

function RecipientCard({ r, onAdvance, disabled }: { r: Recipient; onAdvance: () => void; disabled: boolean }) {
  const meta = statusMeta[r.status];
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold text-ink">{r.name}</div>
          <div className="text-xs text-ink-3">{r.type}</div>
        </div>
        <Badge tone={meta.tone} dot>{meta.label}</Badge>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <div className="nums text-2xl font-extrabold text-ink">{tonnes(r.incomingT)}</div>
          <div className="text-xs text-ink-3">{r.incomingCrop}</div>
        </div>
        <div className="space-y-1 text-right text-xs">
          <div className="flex items-center justify-end gap-1 text-ink-2">
            <Clock size={12} /> ETA {hours(r.etaHours)}
          </div>
          <div className="flex items-center justify-end gap-1 text-ink-2">
            <Timer size={12} /> window {hours(r.usableWindowHours)}
          </div>
        </div>
      </div>

      <div className="mt-4">
        {r.status === "offered" && (
          <Button size="sm" className="w-full" onClick={onAdvance} disabled={disabled}>
            Accept offer
          </Button>
        )}
        {r.status === "accepted" && (
          <Button size="sm" variant="secondary" className="w-full" onClick={onAdvance} disabled={disabled}>
            <Check size={15} /> Confirm receipt
          </Button>
        )}
        {r.status === "received" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-ok/25 bg-ok-soft py-2 text-sm font-semibold text-ok"
          >
            <Check size={15} /> Receipt confirmed
          </motion.div>
        )}
      </div>
    </div>
  );
}

function MiniKpi({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-tint text-brand">{icon}</span>
      <div>
        <div className="nums text-xl font-bold text-ink">{value}</div>
        <div className="text-xs text-ink-3">{label}</div>
      </div>
    </Card>
  );
}
