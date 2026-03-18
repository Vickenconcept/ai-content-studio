# Content Studio (Additional Frontend #1)

Content Studio is a focused Next.js frontend built on your existing KHub backend.

## Problem Solved

Users have valuable PDFs, notes, and course files, but cannot quickly convert them into publish-ready campaigns.

This app solves that by turning selected documents into:
- social posts
- email drafts
- blog outlines
- campaign pack assets

## Backend APIs Used

- Core auth: `POST /api/auth/login`, `POST /api/auth/register`
- Core docs: `GET /api/documents`
- Addition v1 generation: `POST /api/addition/v1/content/generate`

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_CLIENT_APP=content_studio_web
```

3. Run dev server:

```bash
npm run dev
```

4. Open `http://localhost:3000`

## App Structure

- Landing page: `src/app/page.tsx`
- Login: `src/app/login/page.tsx`
- Register: `src/app/register/page.tsx`
- Dashboard with sidebar + generator UI: `src/app/dashboard/page.tsx`
- API integration layer: `src/lib/api-client.ts`

## Notes

- Registration is tagged by client app via `X-Client-App` and `registered_from`.
- This frontend is intentionally focused for product-market testing and JVZoo launch experiments.
