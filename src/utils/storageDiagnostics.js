// Lightweight localStorage diagnostics utilities.
// Used in Settings to help users understand what's stored locally.

export function getLocalStorageKeySizes() {
  const items = []
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (!key) continue
      const value = localStorage.getItem(key) || ''
      // JS strings are UTF-16; byte size is approximate.
      const bytes = value.length * 2
      items.push({ key, bytes })
    }
  } catch {
    return []
  }

  return items.sort((a, b) => b.bytes - a.bytes)
}

export function getLocalStorageApproxBytes() {
  const sizes = getLocalStorageKeySizes()
  return sizes.reduce((sum, item) => sum + item.bytes, 0)
}

export function formatBytes(bytes) {
  const n = Number(bytes)
  if (!Number.isFinite(n) || n <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let v = n
  let u = 0
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024
    u += 1
  }
  return `${v.toFixed(v >= 10 || u === 0 ? 0 : 1)} ${units[u]}`
}
