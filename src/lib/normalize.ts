export function normalizeKoreanText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "").replace(/[^\p{L}\p{N}]/gu, "");
}
