# Casa Nativa Landing Page

A responsive showroom landing page for Casa Nativa. Its goal is to present the brand, explain its services, and start qualified conversations through WhatsApp.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints in the terminal, normally `http://localhost:5173`.

## Edit content

- Business details and WhatsApp number: `src/config/business.ts`
- Page structure and copy: `src/pages/Landing.tsx`
- Visual design and responsive styles: `src/landing.css`
- Landing photography: `src/assets/`

## Analytics

Google Analytics is optional. Copy `.env.example` to `.env.local` and set:

```env
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

For GitHub Pages, add the same value as the repository secret `VITE_GA_MEASUREMENT_ID`. No Supabase, backend, catalog, or administrator credentials are required for this landing page.

## Deploy to GitHub Pages

The workflow in `.github/workflows/deploy-pages.yml` deploys pushes to `main`. In GitHub, set **Settings → Pages → Source** to **GitHub Actions**, then push `main`.
