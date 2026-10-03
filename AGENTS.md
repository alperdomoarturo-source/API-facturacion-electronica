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
- Located in `supabase/schema.sql`
- 23 tables with Row Level Security (RLS)
- Single restaurant architecture (no multi-tenant)

## Key Services
All services are in `src/services/`:
- authService, productService, inventoryService, recipeService
- salesService, customerService, cashService, invoiceService
- purchaseService, supplierService, expenseService
- dianService, reportService, accountingService

## Roles
- ADMIN: Full access to all modules
- CASHIER: POS, Sales, Customers, Cash only

## Important Files
- `supabase/schema.sql` - Database schema
- `supabase/seed.sql` - Test data
- `src/types/index.ts` - TypeScript types
- `src/middleware.ts` - Auth middleware
- `.env.local` - Environment variables (not in git)

## Setup Instructions
1. Create Supabase project
2. Run `supabase/schema.sql` in SQL Editor
3. Run `supabase/seed.sql` for test data
4. Configure `.env.local` with Supabase credentials
5. Run `npm run dev`
6. Register first user and change role to ADMIN in Supabase

## Deployment
Target: Vercel
Required env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
