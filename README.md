# Food Product Authentication

A web app for verifying food product authenticity using FSSAI (Food Safety and Standards Authority of India) license data. Upload product labels, run OCR to extract license details, and check them against the database.

## Features

- Image-based verification (OCR on product labels)
- Trust score (0–100) from FSSAI license checks
- Database verification against FSSAI licenses and blacklisted brands
- Browse verified products and report suspected fakes

## Tech Stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase
- Tesseract.js for OCR
- React Query

## Getting Started

Node.js and npm required.

```bash
git clone <repo-url>
cd Food_Product_Authentication-main
npm install
npm run dev
```

Dev server runs at `http://localhost:8080`.

## Scripts

- `npm run dev` – start dev server
- `npm run build` – production build
- `npm run preview` – preview production build
- `npm run lint` – run ESLint
- `npm run test` – run tests

## Environment

Create a `.env` file with your Supabase config:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

## Admin

Only admins can add products and set trust scores. Default admin:

- Email: `21054cs051@gmail.com`
- Password: `12345678`

Go to **Admin** in the nav or `/admin` to log in. On first login, the account is created if it does not exist (ensure Supabase email confirmation is off or confirm the email).
