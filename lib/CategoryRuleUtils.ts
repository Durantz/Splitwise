/**
 * Converte un pattern wildcard (* = qualsiasi sequenza) in stringa regex.
 * Utilizzato sia nel server (MongoDB $regex) che nel client (useXlsxParser).
 */
export function patternToRegexString(pattern: string): string {
  return pattern
    .toLowerCase()
    .trim()
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
}
