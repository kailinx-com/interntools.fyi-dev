import type { Offer } from "./api";

export function formatOfferCompensationLine(o: Offer): string {
  if (o.payAmount != null && o.compensationType) {
    if (o.compensationType === "hourly") {
      return `$${o.payAmount}/hr`;
    }
    return `$${Number(o.payAmount).toLocaleString("en-US")}/mo`;
  }
  const n = o.notes?.trim();
  if (n) {
    const first = n.split("\n")[0];
    return first.length > 100 ? `${first.slice(0, 100)}…` : first;
  }
  return "—";
}
