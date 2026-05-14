# MateBot 🧉

El socio digital de tu negocio. SaaS de automatización de WhatsApp para pymes argentinas.

## Stack

- **Backend:** Node.js 20 + Fastify 4 + Prisma + PostgreSQL
- **Panel:** React 18 + Vite + TailwindCSS + Zustand
- **Landing:** React 18 + Vite + Framer Motion
- **IA:** GPT-4o mini (OpenAI)
- **WhatsApp:** Meta Cloud API v19.0

## Setup local

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd matebot

# 2. Copiar y completar variables de entorno
cp .env.example .env
# Editá .env con tus credenciales

# 3. Instalar dependencias
npm install
cd panel && npm install && cd ..
cd landing && npm install && cd ..

# 4. Sincronizar base de datos
npm run db:push

# 5. Levantar todo
npm run start:all
```

O usá el script de setup automático:
```bash
node setup.js
```

## URLs locales

| Servicio | URL |
|----------|-----|
| Backend API | http://localhost:3000 |
| Panel admin | http://localhost:5173 |
| Landing | http://localhost:5174 |
| Prisma Studio | http://localhost:5555 |

## Variables de entorno

Copiá `.env.example` → `.env` y completá los valores. Los campos críticos son:

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Conexión a PostgreSQL |
| `JWT_SECRET` | Generar con `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `META_APP_SECRET` | App Secret en Meta for Developers |
| `META_ACCESS_TOKEN` | Token de acceso de WhatsApp |
| `OPENAI_API_KEY` | Clave de OpenAI para el módulo de IA |
| `ALLOWED_ORIGINS` | Orígenes CORS permitidos (separados por coma) |

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Solo backend (nodemon) |
| `npm run start:all` | Backend + panel + landing |
| `npm run db:push` | Sincronizar schema con la DB |
| `npm run db:studio` | Abrir Prisma Studio |

## Arquitectura — Motor de decisión en cascada

Cada mensaje de WhatsApp pasa por 4 niveles:

1. **Reglas** — keyword / regex / exact / startsWith → respuesta inmediata
2. **Módulos** — intenciones específicas (turnos, catálogo, finanzas)
3. **IA** — GPT-4o mini con contexto del negocio (si módulo `ai` activo)
4. **Fallback** — mensaje genérico

> El módulo `finance` solo responde si el mensaje proviene del `ownerPhone` del account.

## Estructura del proyecto

```
src/                    Backend (Fastify)
├── server.js           Webhook + auth + Socket.io
├── brain/              Motor de decisión
├── modules/            appointments | catalog | finance
├── routes/             auth + panel API (JWT protegido)
└── utils/whatsapp.js   Meta Cloud API v19.0

panel/src/              Admin dashboard (React)
├── pages/              Login | Register | Dashboard | Catalog | ...
├── components/         Layout | ProtectedRoute | ChatWindow | ...
├── api/client.js       Axios con JWT auto-inject
└── store/authStore.js  Zustand con persistencia

landing/src/            Landing page (React)
└── sections/           Hero | Pricing | HowItWorks | ...
```

## Deploy

- **Backend:** Railway (Node.js + PostgreSQL addon)
- **Panel:** Vercel (React SPA, `panel/` subdirectorio)
- **Landing:** Vercel (React SPA, `landing/` subdirectorio)

Configurar las variables de `.env.production` en cada plataforma.
Para Meta: actualizar la Webhook URL con la URL de producción del backend.

## Health check

```
GET http://localhost:3000/health
→ {"status":"ok","ts":"..."}
```