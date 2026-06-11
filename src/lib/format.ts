const fmt = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

export const formatEur = (amount: number) => fmt.format(amount);
