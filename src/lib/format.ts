export const formatWeight = (weightKg: number | null | undefined) =>
  `${(weightKg ?? 0).toLocaleString("id-ID")} kg`;

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    currency: "IDR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amount);
