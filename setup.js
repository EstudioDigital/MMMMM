#!/usr/bin/env node
// node setup.js — verifica el entorno y da instrucciones para arrancar MateBot

import { existsSync, readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = __dirname

const ok = (msg) => console.log(`  ✅ ${msg}`)
const warn = (msg) => console.log(`  ⚠️  ${msg}`)
const fail = (msg) => console.log(`  ❌ ${msg}`)
const info = (msg) => console.log(`  ℹ️  ${msg}`)

console.log('\n🧉 MateBot — Setup inicial\n')

// ── 1. Verificar .env ─────────────────────────────────────────────────────────
console.log('📋 Verificando variables de entorno...')

const envPath = join(root, '.env')
if (!existsSync(envPath)) {
  fail('.env no encontrado. Copiá .env.example → .env y completá las variables.')
  process.exit(1)
}

const env = readFileSync(envPath, 'utf8')
const checks = [
  ['DATABASE_URL', /DATABASE_URL=.+/],
  ['JWT_SECRET', /JWT_SECRET=[a-f0-9]{64,}/],
  ['JWT_EXPIRES_IN', /JWT_EXPIRES_IN=.+/],
  ['ALLOWED_ORIGINS', /ALLOWED_ORIGINS=.+/],
]

let envOk = true
for (const [name, regex] of checks) {
  if (regex.test(env)) {
    ok(name)
  } else {
    const hasVar = env.includes(`${name}=`)
    if (name === 'JWT_SECRET' && hasVar) {
      warn(`${name} existe pero parece un valor por defecto — generá uno seguro con:\n     node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)
    } else if (!hasVar) {
      fail(`${name} no está definido en .env`)
      envOk = false
    } else {
      warn(`${name} está vacío`)
    }
  }
}

// ── 2. Verificar dependencias ─────────────────────────────────────────────────
console.log('\n📦 Verificando dependencias...')

const checkNodeModules = (dir, label) => {
  if (existsSync(join(root, dir, 'node_modules'))) {
    ok(`${label} (${dir})`)
  } else {
    warn(`${label}: ejecutá "cd ${dir} && npm install"`)
  }
}

checkNodeModules('.', 'Backend')
checkNodeModules('panel', 'Panel')
checkNodeModules('landing', 'Landing')

// ── 3. Verificar PostgreSQL ───────────────────────────────────────────────────
console.log('\n🗄️  Verificando base de datos...')

try {
  execSync('npx prisma db pull --dry-run 2>&1', { cwd: root, stdio: 'pipe' })
  ok('PostgreSQL accesible')
} catch {
  warn('No se pudo conectar a PostgreSQL. Verificá DATABASE_URL en .env')
}

// ── 4. Resumen ────────────────────────────────────────────────────────────────
console.log('\n🚀 Cómo arrancar:')
info('npm run start:all   → Backend (3000) + Panel (5173) + Landing (5174)')
info('npm run db:push     → Sincronizar schema con la DB')
info('npm run db:studio   → Abrir Prisma Studio')

console.log('\n🔗 URLs locales:')
info('Backend API → http://localhost:3000/health')
info('Panel       → http://localhost:5173')
info('Landing     → http://localhost:5174')

console.log()