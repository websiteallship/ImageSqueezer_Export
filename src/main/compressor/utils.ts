/**
 * Utility: convert a string to URL/SEO-friendly slug.
 * Handles Vietnamese diacritical marks.
 */
export function toSlug(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/đ/gi, 'd')
    .replace(/[^a-z0-9\s-]/gi, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
}
