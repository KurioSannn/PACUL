import { cn } from "@/lib/utils";

type StatusTone = "neutral" | "success" | "warning" | "danger" | "info";

const toneClasses: Record<StatusTone, string> = {
  neutral: "bg-[var(--color-sage-50)] text-[var(--color-ink-700)]",
  success: "bg-[var(--color-mint-100)] text-[var(--color-leaf-700)]",
  warning: "bg-[var(--color-amber-100)] text-[var(--color-amber-600)]",
  danger: "bg-[var(--color-red-100)] text-[var(--color-red-700)]",
  info: "bg-[var(--color-blue-100)] text-[var(--color-blue-700)]",
};

export function StatusBadge({
  label,
  tone = "neutral",
  className,
}: {
  label: string;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
        toneClasses[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}

export function statusToneForWaste(status: string): StatusTone {
  if (["available", "sorted", "converted_to_material"].includes(status)) return "success";
  if (["claimed", "pickup_planned", "sorting", "negotiating"].includes(status)) return "info";
  if (["cancelled", "rejected"].includes(status)) return "danger";
  if (["draft"].includes(status)) return "warning";
  return "neutral";
}

export function statusToneForOrder(status: string): StatusTone {
  if (["completed", "accepted"].includes(status)) return "success";
  if (["negotiating", "created"].includes(status)) return "info";
  if (["cancelled", "rejected"].includes(status)) return "danger";
  return "neutral";
}

export function statusToneForTransaction(status: string): StatusTone {
  if (status === "completed" || status === "simulated_paid") return "success";
  if (status === "simulated_pending") return "warning";
  if (status === "cancelled") return "danger";
  return "neutral";
}
