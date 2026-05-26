import { appendFileSync } from 'node:fs'
import { join } from 'node:path'

const LOG_FILE = join(process.cwd(), 'security.log')

export function logSecurityEvent(type, data, request) {
  const event = {
    timestamp: new Date().toISOString(),
    type,
    ip: request?.ip,
    userAgent: request?.headers?.['user-agent'],
    ...data,
  }
  const line = `[SECURITY] ${JSON.stringify(event)}\n`
  console.log(line.trim())
  try { appendFileSync(LOG_FILE, line) } catch { /* no bloquear si el FS falla */ }
}