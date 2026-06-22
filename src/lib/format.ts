export const formatWeight = (weightKg: number) => `${weightKg.toLocaleString("id-ID")} kg`;

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    currency: "IDR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amount);
