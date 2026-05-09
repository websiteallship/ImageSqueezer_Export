export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
}

export function formatPercent(value: number, total: number): string {
  if (total === 0) return '0%'
  return `${Math.round((value / total) * 100)}%`
}

export function getFileIcon(type: string): string {
  if (type.includes('jpeg') || type.includes('jpg')) return 'JPG'
  if (type.includes('png')) return 'PNG'
  if (type.includes('webp')) return 'WEBP'
  if (type.includes('avif')) return 'AVIF'
  return 'IMG'
}
