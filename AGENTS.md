# AGENTS.md

## Project Overview

This is a personal-use POS system for a digital printing business built with Next.js and Supabase.

The app manages:

- products
- customers
- sales
- invoice PDFs
- COGS reporting
- user profiles
- admin user management

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- Supabase
- jsPDF

## Repository Map

- `app/(auth)`: authentication pages and auth callback routes
- `app/(dashboard)`: main authenticated application pages
- `app/api`: route handlers for sales, products, customers, profiles, users, PDF generation, and COGS
- `components/layout`: sidebar, top header, and app shell
- `components/ui`: shared UI primitives
- `lib/supabase`: browser, server, middleware, and admin Supabase clients
- `lib/pdf-server.ts`: server-side PDF generation
- `lib/currency.ts`: Rupiah formatting helpers

## Routes

### Auth routes

- `/auth/login`
- `/auth/sign-up`
- `/auth/forgot-password`
- `/auth/update-password`

### Main app routes

- `/`
- `/sales`
- `/sales/new`
- `/sales/[id]`
- `/sales/[id]/edit`
- `/products`
- `/customers`
- `/cogs`
- `/profiles`
- `/profiles/[id]`
- `/users`

## Authentication And Roles

- Auth is handled with Supabase.
- Profiles are stored in the `profiles` table.
- Roles currently used are `admin` and `user`.

### Expectations

- Admin-only behavior must be enforced in API handlers, not only in middleware or page routing.
- Any route using the service-role key must explicitly check that the caller is an authenticated admin.

## Environment Variables

Required:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
INVOICE_COMPANY_NAME=
INVOICE_COMPANY_TAGLINE=
INVOICE_COMPANY_CONTACT=
INVOICE_BANK_NAME=
INVOICE_BANK_ACCOUNT_NO=
INVOICE_BANK_ACCOUNT_NAME=
```

### Usage

- `NEXT_PUBLIC_SUPABASE_URL`: shared Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: used by browser, server, and middleware Supabase clients
- `SUPABASE_SERVICE_ROLE_KEY`: used only for server-side admin operations
- `INVOICE_COMPANY_NAME`: company name shown in invoice PDFs and text-logo fallback
- `INVOICE_COMPANY_TAGLINE`: company tagline shown in invoice PDFs
- `INVOICE_COMPANY_CONTACT`: company contact line shown in invoice PDFs
- `INVOICE_BANK_NAME`: bank name shown in invoice PDF payment details
- `INVOICE_BANK_ACCOUNT_NO`: bank account number shown in invoice PDF payment details
- `INVOICE_BANK_ACCOUNT_NAME`: bank account name shown in invoice PDF payment details

## Data Model

### `profiles`

- `id`
- `full_name`
- `role`
- `avatar_url`
- `created_at`

### `products`

- `id`
- `name`
- `type`
- `price_per_unit`
- `cost_price`
- `created_at`

### `customers`

- `id`
- `name`
- `email`
- `phone`
- `address`
- `created_at`

### `sales`

- `id`
- `total_price`
- `customer_id`
- `created_at`

### `sale_items`

- `id`
- `sale_id`
- `product_id`
- `quantity`
- `width`
- `height`
- `description`
- `item_total`
- `cost_price`
- `price_per_unit`

## Business Rules

- `products.type` is either `size` or `quantity`.
- Quantity products use `quantity * price_per_unit`.
- Size products use `width * height * quantity * price_per_unit`.
- Size totals are rounded up to the nearest thousand.
- A sale may have no customer for walk-in purchases.

## API Guardrails

- Do not trust client-sent totals, prices, or costs as source of truth.
- Recalculate sale totals on the server using canonical product data.
- Prefer transactional behavior for sale create/update flows.
- Do not expose service-role behavior without explicit admin authorization checks.
- For PDF generation, prefer fetching canonical sale data server-side instead of trusting arbitrary posted sale payloads.

## Change Rules

- Prefer the smallest correct change.
- Preserve existing UI patterns unless there is a clear reason to change them.
- Do not introduce new abstractions unless they simplify repeated logic.
- Keep documentation aligned with actual route names, env names, and file paths.
- If changing auth, sales, or admin code, verify behavior carefully because those are high-risk areas in this repo.

## Verification

Run when relevant:

```bash
npm run build
npm run lint
```

### Current note

- `npm run build` currently passes.
- `npm run lint` is currently broken and should not be treated as a reliable gate until the ESLint config is fixed.

## Priority Areas For Future Cleanup

1. Lock down admin APIs with in-handler role checks.
2. Move sales pricing and totals fully to the server.
3. Make sales writes transactional.
4. Fix non-admin redirect behavior.
5. Restore a working lint setup.
