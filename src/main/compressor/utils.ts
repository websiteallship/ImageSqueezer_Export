/**
 * Utility: convert a string to URL/SEO-friendly slug.
 * Handles Vietnamese diacritical marks.
 */
export function toSlug(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/đ/gi, 'd')
    .replace(/[_\s]+/g, '-')         // underscore/space → hyphen BEFORE stripping
    .replace(/[^a-z0-9-]/gi, '')     // strip remaining special chars
    .toLowerCase()
    .replace(/-+/g, '-')             // collapse multiple hyphens
    .replace(/^-+|-+$/g, '')         // trim leading/trailing hyphens
}
