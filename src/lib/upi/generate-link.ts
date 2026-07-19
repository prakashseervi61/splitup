export interface UpiLinkParams {
  vpa: string;
  amount: number;
  name?: string;
  note?: string;
  transactionRef?: string;
}

/**
 * Build a UPI deep-link URL.
 *
 * Format: upi://pay?pa=<vpa>&pn=<name>&am=<amount>&tn=<note>&tr=<ref>&cu=INR
 *
 * Truncates note to 40 chars and rounds amount to 2 decimals per NPCI spec.
 */
export function generateUpiLink(params: UpiLinkParams): string {
  const { vpa, amount, name, note, transactionRef } = params;

  const q = new URLSearchParams();
  q.set("pa", vpa);
  if (name) q.set("pn", name);
  q.set("am", amount.toFixed(2));
  if (note) q.set("tn", note.slice(0, 40));
  if (transactionRef) q.set("tr", transactionRef);
  q.set("cu", "INR");

  return `upi://pay?${q.toString()}`;
}
