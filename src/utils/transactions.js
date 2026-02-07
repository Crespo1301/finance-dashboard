// Shared transaction parsing/normalization utilities.
// Goal: avoid runtime crashes (charts/budgets/exports) from malformed localStorage or imports.

export const safeNumber = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export const safeDate = (d) => {
  const dt = d instanceof Date ? d : new Date(d)
  return Number.isFinite(dt.getTime()) ? dt : null
}

export const safeCategory = (cat, fallback = 'Other') => {
  const v = String(cat ?? '').trim()
  return v ? v : fallback
}

export const safeType = (type) => (type === 'income' ? 'income' : 'expense')

// Returns a normalized transaction object, or null if it cannot be safely represented.
// We keep unknown properties via spread to avoid breaking other features.
export const normalizeTransaction = (t) => {
  if (!t || typeof t !== 'object') return null
  const d = safeDate(t.date)
  if (!d) return null

  const id = t.id ?? null
  if (id == null) return null

  return {
    ...t,
    id,
    date: d.toISOString(),
    type: safeType(t.type),
    category: safeCategory(t.category),
    amount: safeNumber(t.amount),
    description: String(t.description ?? ''),
  }
}

export const normalizeTransactions = (transactions) => {
  if (!Array.isArray(transactions)) return []
  const out = []
  for (const t of transactions) {
    const norm = normalizeTransaction(t)
    if (norm) out.push(norm)
  }
  return out
}

export const isInRangeInclusive = (date, range) => {
  if (!range?.start || !range?.end) return true
  return date >= range.start && date <= range.end
}

export const formatSafeDate = (dateLike, locale = 'en-US', opts) => {
  const d = safeDate(dateLike)
  if (!d) return '—'
  try {
    return d.toLocaleDateString(locale, opts)
  } catch {
    return '—'
  }
}

export const formatSafeDateTime = (dateLike, locale = 'en-US', opts) => {
  const d = safeDate(dateLike)
  if (!d) return '—'
  try {
    return d.toLocaleString(locale, opts)
  } catch {
    return '—'
  }
}
