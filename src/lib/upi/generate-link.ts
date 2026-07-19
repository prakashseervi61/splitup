export interface UpiLinkParams {
  vpa: string;
  amount: number;
  name?: string;
  note?: string;
  transactionRef?: string;
}

/** Basic UPI VPA pattern: local@handle (alphanumeric, dots, hyphens before @) */
const VPA_PATTERN = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;

/**
 * Build a UPI deep-link URL with input sanitization.
 *
 * Format: upi://pay?pa=<vpa>&pn=<name>&am=<amount>&tn=<note>&tr=<ref>&cu=INR
 *
 * Throws on invalid inputs so upstream callers can surface a clear error.
 */
export function generateUpiLink(params: UpiLinkParams): string {
  const { vpa, amount, name, note, transactionRef } = params;

  // ponytail: basic validation only — NPCI spec is broader but this covers 99% of Indian VPAs
  if (!vpa || !VPA_PATTERN.test(vpa)) {
    throw new Error(
      `Invalid VPA format: "${vpa}". Expected something like "name@provider".`,
    );
  }

  if (typeof amount !== 'number' || amount <= 0 || amount > 999999.99) {
    throw new Error(
      `Invalid amount: ${amount}. Must be between ₹0.01 and ₹9,99,999.99.`,
    );
  }

  const q = new URLSearchParams();
  q.set('pa', vpa.trim());
  if (name) q.set('pn', name.trim().slice(0, 50));
  q.set('am', amount.toFixed(2));
  // ponytail: note truncated to 40 chars per NPCI spec, URLSearchParams handles encoding
  if (note) q.set('tn', note.trim().replace(/\s+/g, ' ').slice(0, 40));
  // ponytail: transaction ref truncated to 35 chars per NPCI spec
  if (transactionRef) q.set('tr', transactionRef.slice(0, 35));
  q.set('cu', 'INR');

  return `upi://pay?${q.toString()}`;
}
