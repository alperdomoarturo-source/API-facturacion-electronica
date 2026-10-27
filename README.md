# API Software

Sistema integral de administración para restaurantes con POS, facturación electrónica, inventario, caja y finanzas.

## Características

- **POS**: Punto de venta con carrito de compras, efectivo recibido y cálculo de devuelta
- **Menú**: Gestión de productos y categorías
- **Inventario**: Control de ingredientes con alertas de stock bajo
- **Recetas**: Cálculo automático de costos de producción
- **Clientes**: Gestión de base de datos de clientes
- **Caja**: Apertura, movimientos y cierre de caja con arqueo
- **Compras**: Registro de compras a proveedores
- **Proveedores**: Gestión de proveedores
- **Gastos**: Registro y categorización de gastos
- **Cuentas por cobrar**: Gestión de créditos a clientes
- **Cuentas por pagar**: Gestión de obligaciones con proveedores
- **Facturación electrónica**: Integración con DIAN (Colombia)
- **Dashboard**: Métricas y estadísticas en tiempo real
- **Roles**: ADMIN (acceso completo) y CAJERO (POS, ventas, clientes, caja)

## Tecnologías

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Supabase (Base de datos, Auth, Storage, RLS)
- Recharts (Gráficas)
- React Hook Form + Zod (Validación de formularios)

## Configuración Inicial

### 1. Clonar el proyecto

```bash
cd api-software
npm install
```

### 2. Configurar Supabase

1. Crear un proyecto en [Supabase](https://supabase.com)
2. Ir al SQL Editor en Supabase
3. Ejecutar el archivo `supabase/schema.sql` para crear las tablas
4. Ejecutar el archivo `supabase/migrations/0001_multi_tenant.sql` (aislamiento por cuenta)
5. `supabase/seed.sql` es opcional y solo para pruebas locales: inserta filas sin cuenta
   asociada, así que con el RLS activo la aplicación no las muestra

> Si la base de datos ya está en producción, basta con ejecutar
> `supabase/migrations/0001_multi_tenant.sql`. Es idempotente, conserva las cuentas de
> usuario y **elimina los datos de prueba** (productos, clientes, ventas, caja, compras).

### 3. Configurar variables de entorno

Crear un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key
```

Obtener estas credenciales desde tu proyecto de Supabase:
- Project Settings > API

### 4. Crear la cuenta administrador

1. Ejecutar la aplicación: `npm run dev`
2. Ir a `http://localhost:3000/auth/signup`
3. Completar nombre del negocio, nombre, correo y contraseña
4. El trigger `handle_new_user` de la base crea el restaurante, la configuración de
   facturación y **un único perfil con rol ADMIN**. Ya no hay que ajustar el rol a mano en
   Supabase ni existe un perfil de cajero automático.

## Estructura del Proyecto

```
src/
├── app/                    # Next.js App Router
│   ├── auth/              # Páginas de autenticación
│   ├── dashboard/         # Dashboard del administrador
│   ├── pos/               # Punto de venta
│   ├── menu/              # Gestión de menú
│   ├── inventory/         # Inventario
│   ├── recipes/           # Recetas
│   ├── customers/         # Clientes
│   ├── suppliers/         # Proveedores
│   ├── purchases/         # Compras
│   ├── cash/              # Caja
│   ├── expenses/          # Gastos
│   ├── accounts-receivable/ # Cuentas por cobrar
│   ├── accounts-payable/  # Cuentas por pagar
│   ├── invoicing/         # Facturación electrónica
│   └── layout.tsx         # Layout principal
├── components/
│   ├── layout/            # Componentes de layout (Sidebar)
│   ├── dashboard/         # Componentes del dashboard
│   └── ui/                # Componentes UI reutilizables
├── services/              # Servicios de lógica de negocio
│   ├── authService.ts
│   ├── productService.ts
│   ├── inventoryService.ts
│   ├── recipeService.ts
│   ├── salesService.ts
│   ├── customerService.ts
│   ├── cashService.ts
│   ├── invoiceService.ts
│   ├── purchaseService.ts
│   ├── supplierService.ts
│   ├── expenseService.ts
│   ├── dianService.ts
│   ├── reportService.ts
│   └── accountingService.ts
├── hooks/                 # Custom React hooks
│   └── useAuth.ts
├── types/                 # TypeScript types
│   └── index.ts
├── supabase/              # Configuración de Supabase
│   ├── client.ts
│   ├── server.ts
│   ├── schema.sql         # Schema de base de datos
│   └── seed.sql           # Datos de prueba
└── lib/                   # Utilidades
```

## Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start

# Linting
npm run lint
```

## Seguridad

- **Row Level Security (RLS)**: Implementado en todas las tablas, filtrando por
  `restaurant_id = public.current_restaurant_id()` (la cuenta del usuario autenticado)
- **Roles**: ADMIN (acceso completo) y CAJERO (acceso limitado)
- **Autenticación**: Supabase Auth con sesión segura
- **Permisos**: Validados tanto en frontend como en backend

## Facturación Electrónica

La aplicación está preparada para integración con DIAN:

1. Ir a Facturación > Configuración DIAN
2. Configurar:
   - Ambiente (Pruebas/Producción)
   - Proveedor tecnológico
   - Resolución de facturación
   - Rango autorizado
   - API Key del proveedor
3. Probar conexión
4. Las facturas se generarán automáticamente al crear ventas

**Importante**: No se muestra "Aceptada por DIAN" hasta que exista una respuesta real del servicio.

## Datos de Prueba

El archivo `supabase/seed.sql` incluye:

- Restaurante de ejemplo
- 4 categorías de productos
- 12 productos con precios
- 12 ingredientes con stock
- 3 recetas con cálculo de costos
- 5 proveedores
- 5 clientes
- 3 compras de ejemplo
- 4 gastos de ejemplo
- Configuración de facturación (modo pruebas)
- 1 cuenta por cobrar
- 1 cuenta por pagar

## Deployment en Vercel

1. Crear cuenta en [Vercel](https://vercel.com)
2. Conectar el repositorio de GitHub
3. Configurar variables de entorno en Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy automático

## Notas Importantes

- Cada cuenta (restaurante) trabaja con su propia información: el aislamiento se resuelve en la
  base de datos con la columna `restaurant_id` y las políticas RLS, de modo que ninguna cuenta
  ve los productos, clientes, ventas ni cajas de otra.
- Al registrarse se crea una sola cuenta, con rol ADMIN y su propio restaurante.
- Mientras haya una caja abierta, el menú lateral solo muestra POS y Caja; al cerrarla vuelven
  todas las opciones.
- Los Cajeros no pueden modificar precios, inventario, recetas o configuración
- Las facturas electrónicas requieren configuración previa del proveedor tecnológico
- El cierre de caja no puede modificarse una vez confirmado
- Todas las operaciones importantes se registran en auditoría

## Soporte

Para soporte o preguntas, contactar a: soporte@apisoftware.com

## Licencia

Copyright © 2026 API Software. Todos los derechos reservados.
