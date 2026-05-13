# TiendaPOS

Sistema POS profesional para tiendas de ropa. Multi-rol, multi-variante (tallas/colores), caja diaria, kardex y reportes — desplegable en Vercel + Neon PostgreSQL.

> **Estado actual: Las 4 fases completas — sistema listo para producción.** POS + Inventario + Caja + Clientes + Reportes PDF/Excel + Gestión de usuarios + Dashboard con datos reales.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router, Server Actions) |
| Lenguaje | TypeScript |
| UI | Tailwind CSS · Shadcn/ui · Lucide Icons · Framer Motion |
| Estado | Zustand · React Hook Form · Zod |
| ORM | Prisma · Neon PostgreSQL |
| Auth | JWT (jose) en cookie httpOnly + bcryptjs |
| Gráficas | Recharts |
| Notificaciones | Sonner |
| Tema | next-themes (light / dark / system) |

---

## Estructura

```
tiendapos/
├─ prisma/
│  ├─ schema.prisma       # Modelos: User, Product, Variant, Sale, etc.
│  └─ seed.ts             # Admin + cajero + marcas + categorías + producto demo
├─ src/
│  ├─ app/
│  │  ├─ (auth)/login/    # Login con server action
│  │  ├─ (dashboard)/
│  │  │  ├─ dashboard/    # KPIs + gráfica
│  │  │  ├─ pos/          # ✓ Búsqueda + carrito + checkout
│  │  │  ├─ products/     # ✓ CRUD + variantes dinámicas
│  │  │  ├─ categories/   # ✓ CRUD con borrado lógico
│  │  │  ├─ brands/       # ✓ CRUD con logo opcional
│  │  │  ├─ inventory/    # ✓ Stock por variante + alertas
│  │  │  │  └─ movements/ # ✓ Kardex completo
│  │  │  ├─ sales/        # ✓ Lista + detalle + anulación
│  │  │  ├─ customers/    # ✓ CRUD + historial + selector POS
│  │  │  ├─ cash-register/# ✓ Apertura/cierre con cuadre
│  │  │  ├─ reports/      # ✓ Tabs + export PDF/Excel (admin)
│  │  │  ├─ users/        # ✓ Gestión de cuentas (admin)
│  │  │  └─ settings/     # ✓ Datos empresa + cambio password
│  │  ├─ api/auth/logout/ # Cierre de sesión
│  │  └─ layout.tsx       # Theme provider + Sonner
│  ├─ components/
│  │  ├─ ui/              # Shadcn primitives
│  │  ├─ layout/          # Sidebar, Navbar, UserMenu
│  │  ├─ dashboard/       # KpiCard, SalesChart
│  │  └─ common/          # ComingSoon, etc.
│  ├─ lib/
│  │  ├─ auth.ts          # Sesiones JWT + bcrypt
│  │  ├─ db.ts            # Cliente Prisma singleton
│  │  ├─ utils.ts         # cn, formatCurrency, formatDate, slugify
│  │  ├─ constants.ts     # Empresa, IGV, métodos de pago
│  │  └─ validations/     # Esquemas Zod
│  └─ middleware.ts       # Protección de rutas + role gate
├─ .env.example
├─ components.json        # Config Shadcn
└─ tailwind.config.ts     # Paleta brand (rosado) + tokens shadcn
```

---

## Setup local

```powershell
# 1) Instalar dependencias
npm install

# 2) Configurar variables (Neon, JWT, etc.)
Copy-Item .env.example .env
# Edita .env con tus credenciales reales

# 3) Empujar el schema a la base de datos
npm run db:push

# 4) Sembrar datos demo
npm run db:seed

# 5) Levantar el servidor de desarrollo
npm run dev
```

Abre <http://localhost:3000>. Serás redirigido a `/login`.

### Cuentas demo (creadas por el seed)

| Rol | Email | Password |
|---|---|---|
| Administrador | `admin@tiendapos.com` | `Admin123!` |
| Cajero | `cajero@tiendapos.com` | `Caja123!` |

> ⚠️ Cambia estas contraseñas antes de poner en producción.

---

## Scripts útiles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo (HMR) |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier + plugin Tailwind |
| `npm run db:push` | Sincronizar schema con la BD (dev rápido) |
| `npm run db:migrate` | Crear migración SQL (para producción) |
| `npm run db:studio` | Abre Prisma Studio (GUI de la BD) |
| `npm run db:seed` | Reejecuta el seed |

---

## Deployment en Vercel

### 1. Neon PostgreSQL

1. Crea proyecto en <https://console.neon.tech>.
2. Copia las URLs:
   - **Pooled connection** → `DATABASE_URL`
   - **Direct connection** → `DIRECT_URL`

### 2. Vercel

1. Sube el repo a GitHub.
2. En Vercel: **New Project** → importa el repo.
3. En **Environment Variables** pega todas las del `.env.example`:
   - `DATABASE_URL`, `DIRECT_URL`
   - `JWT_SECRET` (genera uno nuevo y largo para producción)
   - `SESSION_COOKIE_NAME`, `SESSION_MAX_AGE_DAYS`
   - `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_EMPRESA_*`, `NEXT_PUBLIC_IGV_PERCENT`
   - (cuando uses uploads) `CLOUDINARY_*`
4. **Deploy**. El `postinstall` corre `prisma generate` y el build corre la app.

### 3. Migración inicial en producción

La primera vez, desde tu máquina:

```powershell
# Asegúrate que .env apunta a la BD de producción
npx prisma migrate deploy
npm run db:seed
```

### Generar un JWT secret fuerte

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

---

## Modelo de datos (resumen)

- **User** → Admin/Cajero, con sesiones JWT, hash bcrypt, `lastLoginAt`.
- **Product** → SKU base + precio costo/venta + categoría + marca + min stock.
- **Variant** → Talla × Color (con stock por variante, barcode, colorHex).
- **InventoryMovement** → Kardex completo: IN/OUT/ADJUSTMENT/RETURN con snapshots de stock.
- **Sale** + **SaleDetail** + **Payment** → Venta con múltiples métodos de pago (CASH/YAPE/PLIN/CARD/TRANSFER), IGV calculado, snapshot del producto.
- **Customer** → DNI/RUC/CE, puntos de fidelización, historial.
- **CashRegister** → Apertura/cierre diario con cuadre (esperado vs contado).

Todos los modelos tienen índices en las columnas que se consultan más (códigos, SKU, fechas, status).

---

## Roadmap

- **Fase 1 ✓** — Scaffolding · Prisma · Auth · Layout dashboard
- **Fase 2 ✓** — Productos · Categorías · Marcas · Variantes (talla×color) · Inventario · Kardex
- **Fase 3 ✓** — POS Ventas · Carrito persistente · Pagos múltiples · Boleta PDF · Caja diaria
- **Fase 4 ✓** — Clientes · Reportes (PDF/Excel) · Gestión de usuarios · Configuración · Dashboard con datos reales

### Modelo fiscal (IGV)

Los precios de productos se guardan **sin IGV**. En el checkout:
- `subtotal` = Σ (precio × cantidad − descuento de línea)
- `IGV` = (subtotal − descuento global) × `NEXT_PUBLIC_IGV_PERCENT` (default 18%)
- `total` = subtotal − descuento global + IGV

Si más adelante quieres precios "con IGV incluido" (típico retail Perú), basta cambiar la fórmula en `src/lib/sales.ts:computeTotals`.

### Imágenes de productos

Esta versión usa **URLs externas HTTPS** (el admin pega el link público desde Instagram, Drive, Imgur, etc.). Sin storage SaaS, sin upload — máxima simplicidad. Si más adelante quieres reemplazar por Vercel Blob o UploadThing, el único cambio es agregar un componente de upload que devuelva la URL al campo `imageUrl` del formulario de producto.

---

## Seguridad

Cobertura por categoría OWASP / vector común:

### Autenticación y sesiones
- Passwords hasheados con **bcryptjs** (cost 10).
- Política de contraseña: ≥8 caracteres, al menos una letra y un dígito (enforced en Zod + server).
- Sesiones **JWT firmadas HS256** en cookie `httpOnly + sameSite=lax + secure` en prod.
- Middleware en Edge protege todas las rutas excepto `/login`, `/api/health`, `/api/auth/*` y assets.
- Las rutas ADMIN-only están enforced en middleware *y* re-validadas server-side en cada Server Action.
- Las Server Actions empiezan con `const session = await getSession(); if (!session) return fail(...)` — patrón explícito que reconocen los revisores de seguridad.

### Brute-force al login
- **Rate-limit + lockout por cuenta**: 5 intentos fallidos consecutivos → bloqueo de 15 min (`failedLoginAttempts` y `lockedUntil` en `User`).
- **Mitigación de user-enumeration**: si el email no existe, igualmente se ejecuta un `bcrypt.compare` contra un hash dummy para igualar el tiempo de respuesta.
- Mensajes genéricos ("Credenciales incorrectas") — no revelan si el email está registrado.

### SQL Injection
- 100% de las queries pasan por **Prisma** (parametrizadas). Cero SQL crudo en el repo.

### XSS
- React auto-escapa todo lo que pinta. No usamos `dangerouslySetInnerHTML` en ninguna parte.
- Las URLs externas de imágenes van en `<img>` o `next/image`, no en `srcDoc` ni en HTML interpolado.
- Inputs de usuario validados con Zod en cliente y server.

### CSRF
- **Server Actions** de Next 15 validan el header `Origin` automáticamente.
- Cookies con `sameSite=lax`: el browser no las envía en POST cross-origin.
- Rutas `/api` que escriben (logout) usan POST; las de lectura (PDF, reportes) son GET con auth por cookie.

### Headers de seguridad (`next.config.mjs`)
- `X-Frame-Options: DENY` — anti-clickjacking
- `X-Content-Type-Options: nosniff` — bloquea MIME sniffing
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (solo en prod)
- `X-Powered-By` removido

### Helpers de DB
- Los helpers que toman un parámetro de identidad (`userId`, etc.) **viven fuera de archivos `"use server"`** (en `src/lib/*-queries.ts` con `import "server-only"`) para que no sean invocables como server actions desde el cliente con un id arbitrario.

### Variables sensibles
- Todo lo no prefijado con `NEXT_PUBLIC_` queda fuera del bundle cliente.
- `JWT_SECRET` generado con `crypto.randomBytes(48).toString("base64")`. Rotar para producción.
- `.env` no se commitea (vive en `.gitignore`).

### Pendientes recomendados antes de producción
1. **Cambiar las contraseñas del seed** (`Admin123!`, `Caja123!`) — útiles solo para demo.
2. **Rotar `JWT_SECRET` y credenciales de Neon** si las pegaste en algún canal no seguro.
3. **Considerar 2FA** para cuentas ADMIN si manejas tiendas con varios cajeros.
4. **Logs de auditoría** (qué admin hizo qué) — útil cuando hay >2 admins.

---

## Licencia

Privado · Uso comercial autorizado por el propietario.
