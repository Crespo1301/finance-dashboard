import { normalizeTransactions } from './transactions'

export const BACKUP_SCHEMA_VERSION = 2

const safeParseJSON = (text) => {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

const isPlainObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v)

const sanitizeBudgets = (obj) => {
  if (!isPlainObject(obj)) return {}
  const next = {}
  for (const [monthKey, cats] of Object.entries(obj)) {
    if (!isPlainObject(cats)) continue
    const cleanCats = {}
    for (const [cat, limit] of Object.entries(cats)) {
      const n = Number(limit)
      if (Number.isFinite(n) && n > 0) cleanCats[String(cat)] = n
    }
    next[String(monthKey)] = cleanCats
  }
  return next
}

export const buildBackupObject = () => {
  const transactionsRaw = safeParseJSON(localStorage.getItem('transactions')) || []
  const budgetsRaw = safeParseJSON(localStorage.getItem('budgets')) || {}
  const presetsRaw = safeParseJSON(localStorage.getItem('transactionListPresets_v1')) || []
  const privacyPreferences = safeParseJSON(localStorage.getItem('privacyPreferences_v1')) || null

  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      transactions: transactionsRaw,
      budgets: budgetsRaw,
      currency: localStorage.getItem('currency') || 'USD',
      presets: presetsRaw,
      theme: localStorage.getItem('theme') || null,
      lastTxType: localStorage.getItem('last_tx_type') || null,
      lastTxCategory: localStorage.getItem('last_tx_category') || null,
      privacyPreferences,
    },
  }
}

const migrateToV2Data = (parsed) => {
  // Accept v1 formats:
  // - { schemaVersion: 1, data: {...} }
  // - raw { transactions, budgets, ... } (legacy)
  if (!parsed || typeof parsed !== 'object') return null

  const data = isPlainObject(parsed.data) ? parsed.data : parsed
  if (!isPlainObject(data)) return null

  return {
    transactions: Array.isArray(data.transactions) ? data.transactions : [],
    budgets: isPlainObject(data.budgets) ? data.budgets : {},
    currency: typeof data.currency === 'string' ? data.currency : 'USD',
    presets: Array.isArray(data.presets) ? data.presets : [],
    theme: typeof data.theme === 'string' ? data.theme : null,
    lastTxType: typeof data.lastTxType === 'string' ? data.lastTxType : null,
    lastTxCategory: typeof data.lastTxCategory === 'string' ? data.lastTxCategory : null,
    privacyPreferences: isPlainObject(data.privacyPreferences) ? data.privacyPreferences : null,
  }
}

export const parseBackupText = (text) => {
  const parsed = safeParseJSON(text)
  if (!parsed) return { ok: false, error: 'Invalid JSON' }

  const schemaVersion = Number(parsed.schemaVersion || 1)
  const exportedAt = typeof parsed.exportedAt === 'string' ? parsed.exportedAt : null

  const dataV2 = migrateToV2Data(parsed)
  if (!dataV2) return { ok: false, error: 'Unrecognized backup format' }

  const normalizedTx = normalizeTransactions(dataV2.transactions)
  const invalidTxCount = (Array.isArray(dataV2.transactions) ? dataV2.transactions.length : 0) - normalizedTx.length
  const budgets = sanitizeBudgets(dataV2.budgets)

  const warnings = []
  if (invalidTxCount > 0) warnings.push(`${invalidTxCount} invalid transaction(s) were ignored for safety.`)

  return {
    ok: true,
    schemaVersion,
    exportedAt,
    data: {
      ...dataV2,
      transactions: normalizedTx,
      budgets,
    },
    warnings,
    summary: {
      transactionCount: normalizedTx.length,
      budgetMonths: Object.keys(budgets).length,
      presetCount: dataV2.presets.length,
    },
  }
}

export const applyBackupToStorage = (data) => {
  // Expects sanitized data from parseBackupText
  localStorage.setItem('transactions', JSON.stringify(data.transactions || []))
  localStorage.setItem('budgets', JSON.stringify(data.budgets || {}))

  if (typeof data.currency === 'string') localStorage.setItem('currency', data.currency)

  if (Array.isArray(data.presets)) {
    localStorage.setItem('transactionListPresets_v1', JSON.stringify(data.presets))
  }

  if (typeof data.theme === 'string') localStorage.setItem('theme', data.theme)
  if (typeof data.lastTxType === 'string') localStorage.setItem('last_tx_type', data.lastTxType)
  if (typeof data.lastTxCategory === 'string') localStorage.setItem('last_tx_category', data.lastTxCategory)

  if (data.privacyPreferences && typeof data.privacyPreferences === 'object') {
    localStorage.setItem('privacyPreferences_v1', JSON.stringify(data.privacyPreferences))
  }
}

export const downloadBackupObject = (obj, filename) => {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
