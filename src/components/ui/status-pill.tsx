import { cn } from "@/lib/utils";

type StatusPillProps = {
  label: string;
  tone?: "available" | "waiting" | "active" | "cancelled";
};

export function StatusPill({ label, tone = "available" }: StatusPillProps) {
  return <span className={cn("status-pill", `status-${tone}`)}>{label}</span>;
}
