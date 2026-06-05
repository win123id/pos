# Digital Printing POS

A personal-use point of sale system for a digital printing business. It covers products, customers, sales, invoice PDF generation, COGS reporting, user profiles, and admin user management.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Supabase
- jsPDF

## Main Features

- Product management for `size` and `quantity` products
- Customer management
- Sales creation, editing, viewing, and deletion
- PDF invoice generation
- COGS reporting
- User profile management
- Admin-only user management

## Routes

### Auth

- `/auth/login`
- `/auth/sign-up`
- `/auth/forgot-password`
- `/auth/update-password`

### Dashboard

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

## Environment Variables

Create `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Notes

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is used by the browser, server, and middleware Supabase clients.
- `SUPABASE_SERVICE_ROLE_KEY` is used for admin user-management operations and must never be exposed to the client.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Project Structure

```text
app/
  (auth)/
  (dashboard)/
  api/
components/
  layout/
  ui/
lib/
  supabase/
  currency.ts
  pdf-server.ts
  utils.ts
public/
```

## Business Rules

- Products use `type = size` or `type = quantity`.
- Quantity products are priced by `quantity * price_per_unit`.
- Size products are priced by `width * height * quantity * price_per_unit`.
- Size-based totals are rounded up to the nearest thousand.
- Customer on a sale is optional to support walk-in transactions.

## Current Limitations

- `npm run lint` is currently broken because of the ESLint config setup.
- Some API routes need stronger in-handler auth and role checks.
- Sales totals and pricing should be fully enforced server-side.
- Non-admin redirect behavior needs cleanup.

## Notes

This repo is for personal use, so the docs are intentionally lightweight and practical.
