# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Deployment (Vercel + Vercel Postgres)

This project is configured to deploy to Vercel with serverless API routes under `api/` that connect to Vercel Postgres (free tier).

### Steps

1. Create a Vercel Postgres database (free tier) from your Vercel project dashboard.
2. Set the following environment variables in Vercel Project Settings → Environment Variables:
   - `POSTGRES_URL` (provided by Vercel Postgres)
   - `POSTGRES_PRISMA_URL` (optional, not required if not using Prisma)
   - `JWT_SECRET` (any strong random string)
3. Initialize the database schema once locally or via Vercel CLI:
   - Locally (requires `POSTGRES_URL` in your shell):
     - `npm install`
     - `POSTGRES_URL=... JWT_SECRET=... npm run db:setup`
   - Or run the `scripts/init_db.mjs` with your env configured in your CI/CLI.
4. Deploy to Vercel (import this repo or use `vercel` CLI). Vercel will build the Vite app and deploy serverless functions from `api/`.

### Notes

- Frontend now calls relative API URLs like `/api/drivers`, `/api/driver-stats/[driverId]`, etc.
- Serverless functions use `@vercel/postgres` (`api/_db.js`) instead of the local SQLite database.
- Original Express server and SQLite-based scripts remain for reference but are not used in Vercel.
- Schema for Postgres lives at `db/postgres_schema.sql`; the init script is `scripts/init_db.mjs`.

