# TiendaPOS

Sistema POS profesional para tiendas de ropa. Multi-rol, multi-variante (tallas/colores), caja diaria, kardex y reportes — desplegable en Vercel + Neon PostgreSQL.

> **Estado actual: Fase 1 completa.** Login funcional, dashboard con KPIs y gráfica, layout responsive con sidebar + dark mode, base de datos en Neon con schema completo y datos demo.

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
│  │  │  ├─ pos/          # ⏳ Fase 3
│  │  │  ├─ products/     # ⏳ Fase 2
│  │  │  ├─ inventory/    # ⏳ Fase 2
│  │  │  ├─ sales/        # ⏳ Fase 3
│  │  │  ├─ customers/    # ⏳ Fase 4
│  │  │  ├─ cash-register/# ⏳ Fase 3
│  │  │  ├─ reports/      # ⏳ Fase 4 (solo admin)
│  │  │  └─ users/        # ⏳ Fase 4 (solo admin)
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
- **Fase 2** — Productos · Categorías · Marcas · Variantes · Inventario · Kardex · Cloudinary
- **Fase 3** — POS Ventas · Carrito · Pagos · Tickets PDF · Caja diaria
- **Fase 4** — Clientes · Reportes (PDF/Excel) · Gestión de usuarios · Configuración

---

## Seguridad

- Passwords con **bcryptjs** (10 rounds).
- Sesiones JWT firmadas con HS256, cookies **httpOnly + sameSite=lax + secure** en producción.
- Middleware protege todas las rutas excepto `/login`, `/api/health`, `/api/auth/*` y archivos estáticos.
- Rutas `ADMIN`-only enforced en middleware + `requireRole()` server-side.
- Variables sensibles fuera del bundle cliente (todo lo no prefijado con `NEXT_PUBLIC_`).

---

## Licencia

Privado · Uso comercial autorizado por el propietario.
