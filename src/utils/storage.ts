import type { ParsedTemplate, SavedTemplate } from '../types/template'

const TEMPLATES_KEY = 'invoice_templates'
const MAX_TEMPLATES = 20

function readAll(): SavedTemplate[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeAll(templates: SavedTemplate[]) {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates))
}

export function getSavedTemplates(): SavedTemplate[] {
  return readAll().sort((a, b) => b.createdAt - a.createdAt)
}

export function saveTemplate(parsed: ParsedTemplate): SavedTemplate {
  const templates = readAll()

  const existing = templates.findIndex(
    (t) => t.fileName === parsed.fileName,
  )

  const entry: SavedTemplate = {
    id: existing >= 0 ? templates[existing].id : crypto.randomUUID(),
    name: parsed.name,
    fileName: parsed.fileName,
    fieldCount: parsed.fields.length,
    createdAt: Date.now(),
    fileBase64: parsed.fileBase64,
  }

  if (existing >= 0) {
    templates[existing] = entry
  } else {
    templates.unshift(entry)
  }

  while (templates.length > MAX_TEMPLATES) {
    templates.pop()
  }

  writeAll(templates)
  return entry
}

export function deleteTemplate(id: string) {
  const templates = readAll().filter((t) => t.id !== id)
  writeAll(templates)
}

export function getTemplateFile(id: string): string | null {
  const t = readAll().find((t) => t.id === id)
  return t?.fileBase64 ?? null
}
