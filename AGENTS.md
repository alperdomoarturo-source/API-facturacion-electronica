<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change. committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# API Software - Project Information

## Overview
API Software is a complete restaurant management SaaS application for Colombian restaurants.

## Tech Stack
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL, Auth, Storage, RLS)
- Recharts
- React Hook Form + Zod

## Database Schema
- Base schema in `supabase/schema.sql`
- Multi-tenant migration in `supabase/migrations/0001_multi_tenant.sql` (must run on every
  existing database: adds `restaurant_id` + tenant RLS + `handle_new_user` trigger)
- 23 tables with Row Level Security (RLS)
- Multi-tenant: every account (restaurant) only sees its own data. The tenant is resolved by
  `public.current_restaurant_id()` (from `profiles.restaurant_id`) and used both as the column
  DEFAULT and inside the RLS policies, so services keep inserting without passing the tenant.
- Uniqueness is per account (`restaurant_id, document_number`, `restaurant_id, invoice_number`, ...)

## Key Services
All services are in `src/services/`:
- authService, productService, inventoryService, recipeService
- salesService, customerService, cashService, invoiceService
- purchaseService, supplierService, expenseService
- dianService, reportService, accountingService

## Roles
- ADMIN: Full access to all modules. This is the account created on signup, together with its
  own `restaurant` row and `electronic_invoicing_config` (trigger `on_auth_user_created`).
- CASHIER: POS, Sales, Customers, Cash only. Created manually in Supabase for now (no UI).
- While the user has an open `cash_registers` row, the sidebar only shows POS and Caja.

## Important Files
- `supabase/schema.sql` - Database schema
- `supabase/seed.sql` - Test data
- `src/types/index.ts` - TypeScript types
- `src/middleware.ts` - Auth middleware
- `.env.local` - Environment variables (not in git)

## Setup Instructions
1. Create Supabase project
2. Run `supabase/schema.sql` in SQL Editor
3. Run `supabase/migrations/0001_multi_tenant.sql` in SQL Editor
4. Run `supabase/seed.sql` only for local demo data (it inserts rows without a tenant, so the
   app will not show them once RLS is on)
5. Configure `.env.local` with Supabase credentials
6. Run `npm run dev`
7. Register at `/auth/signup`: the signup creates one ADMIN account plus its restaurant. No manual
   role change in Supabase is needed.

## Deployment
Target: Vercel
Required env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
