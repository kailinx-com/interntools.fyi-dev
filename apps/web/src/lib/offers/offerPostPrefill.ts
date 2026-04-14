import type { Offer } from "./api";
import { formatOfferCompensationLine } from "./formatOffer";

function userFacingNotesFromOffer(notes: string | null | undefined): string {
  if (!notes?.trim()) return "";
  try {
    JSON.parse(notes);
    return "";
  } catch {
    return notes.trim();
  }
}

function extraDetailLines(offer: Offer): string {
  const lines: string[] = [];
  if (offer.employmentType) {
    lines.push(`Employment: ${offer.employmentType}`);
  }
  if (offer.hoursPerWeek != null) {
    lines.push(`Hours per week: ${offer.hoursPerWeek}`);
  }
  if (offer.daysInOffice != null) {
    lines.push(`Days in office: ${offer.daysInOffice}`);
  }
  if (offer.signOnBonus != null) {
    lines.push(`Sign-on bonus: $${offer.signOnBonus.toLocaleString("en-US")}`);
  }
  if (offer.relocationAmount != null) {
    lines.push(`Relocation: $${offer.relocationAmount.toLocaleString("en-US")}`);
  }
  if (offer.equityNotes?.trim()) {
    lines.push(`Equity: ${offer.equityNotes.trim()}`);
  }
  return lines.join("\n");
}

export function offerToPostSubmitPrefill(offer: Offer): {
  title: string;
  officeLocation: string;
  singleCompany: string;
  singleRole: string;
  compensation: string;
  notes: string;
} {
  const company = offer.company?.trim() ?? "";
  const role = offer.title?.trim() ?? "";
  const title =
    company && role ? `${company} — ${role}` : company || role || "Offer update";

  const userNotes = userFacingNotesFromOffer(offer.notes);
  const details = extraDetailLines(offer);
  const mergedNotes = [userNotes, details].filter(Boolean).join("\n\n");

  const compLine = formatOfferCompensationLine(offer);
  const compensation = compLine === "—" ? "" : compLine;

  return {
    title,
    officeLocation: offer.officeLocation?.trim() ?? "",
    singleCompany: company,
    singleRole: role,
    compensation,
    notes: mergedNotes,
  };
}
