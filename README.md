# Prescripto — Full Stack Medical Appointment App

This repository contains three apps used together:

- `backend` — Express + MongoDB API (Node, Cloudinary for file uploads, Stripe/Razorpay optional)
- `frontend` — Patient-facing React app (Vite + Tailwind)
- `admin` — Admin panel React app (Vite + Tailwind)

This README provides exact, copy-paste instructions to run and debug locally, the full list of required environment variables, Cloudinary troubleshooting, testing tips, and optional guidance to add a safe AI suggestion endpoint.

## Quick checklist

- [x] Install dependencies for each app
- [x] Set environment variables in `backend/.env`
- [x] Start backend, frontend, and admin in separate terminals
- [x] Verify Cloudinary uploads (no quotes in env values)

---

## Prerequisites

- Node.js 18+ and npm
- A MongoDB Atlas cluster or other MongoDB connection
- A Cloudinary account (cloud name, API key, secret)
 

## Project structure (important files)

- `backend/` — Express API
   - `server.js` — entry point, connects to MongoDB and Cloudinary
   - `config/cloudinary.js` — Cloudinary initializer (reads env vars)
   - `controllers/` — contains `adminController.js`, `userController.js`, etc.
   - `routes/` — API routes
   - `.env` — environment variables (local only)

- `frontend/` — public patient app (Vite + React)
- `admin/` — admin panel (Vite + React)

## Environment variables (backend)

Create `backend/.env` with these keys. Replace placeholders with your real values.

```
CURRENCY=INR
JWT_SECRET=greatstack

# Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=greatstack123

# MongoDB
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.hozvx7s.mongodb.net/<dbname>

# Cloudinary
CLOUDINARY_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_SECRET_KEY=your_cloudinary_secret

# Optional payment keys
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
STRIPE_SECRET_KEY=...

## (No AI features included)
This repository does not include any AI / OpenAI integrations by default.
```

Important: do NOT wrap values in quotes. Wrong:

```
CLOUDINARY_NAME="dkoubcnc9"   # <-- this will break Cloudinary and cause "Invalid cloud_name" errors
```


## Run locally (PowerShell / Windows)

Open three terminals and run one command in each.

Backend

```powershell
cd 'C:\Users\bhupa\OneDrive\Desktop\prescripto-full-stack\backend'
npm install
npm run server   # uses nodemon if available, or `npm start` to run once
```

Frontend (patient app)

```powershell
cd 'C:\Users\bhupa\OneDrive\Desktop\prescripto-full-stack\frontend'
npm install
npm run dev
```

Admin panel

```powershell
cd 'C:\Users\bhupa\OneDrive\Desktop\prescripto-full-stack\admin'
npm install
npm run dev
```

## Cloudinary troubleshooting ("Invalid cloud_name ...")

Cause
- The most common cause is that `.env` values include surrounding quotes or stray whitespace. The `cloudinary` SDK expects the raw cloud name string.

Fix
- Ensure `CLOUDINARY_NAME` in `backend/.env` has no quotes and no leading/trailing spaces.
- Restart the backend after any `.env` change.

Verify at runtime (quick check):

```powershell
cd 'C:\Users\bhupa\OneDrive\Desktop\prescripto-full-stack\backend'
node -e "require('dotenv').config(); console.log(process.env.CLOUDINARY_NAME)"
```

Expected output: the plain cloud name (e.g. `dkoubcnc9`) with no surrounding quotes.

If the name prints with quotes, fix `backend/.env` and retry.

## How Cloudinary is initialized in this repo

Open `backend/config/cloudinary.js` — it calls `cloudinary.config({ cloud_name: process.env.CLOUDINARY_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_SECRET_KEY })`.

Ensure `server.js` calls the initializer before any upload code runs (the current `server.js` does this by calling `connectCloudinary()` on startup).

<!-- AI integration instructions removed as requested -->

## Testing & smoke checks

- API root: `GET http://localhost:4000/` should respond "API Working".
- Admin and user endpoints: use Postman or a simple `curl` to test auth and uploads.
- Test Cloudinary upload via the admin UI or the backend upload endpoints.

<!-- AI endpoint example removed -->

## Deployment notes

- `frontend` and `admin` are static Vite apps — good to deploy on Vercel, Netlify, or any static host. Use the provided `vercel.json` if using Vercel.
- `backend` can be deployed to Heroku, Railway, Render, or any Node host. Provide the same env vars on the host. For production, set NODE_ENV=production and enable secure CORS, HTTPS, and reasonable rate-limiting.

## Security checklist

- Don't commit `backend/.env` to git.
- Rotate API keys if they were exposed accidentally.
- Add authentication and authorization for admin endpoints.
- Add rate-limiting to public endpoints and AI endpoints.

## Troubleshooting quick list

- "Invalid cloud_name ..." — fix `.env` quotes (see Cloudinary troubleshooting above).
- Uploads failing — ensure `connectCloudinary()` runs before upload calls and Cloudinary keys are valid.
- Server fails to start — check `node` version, run `npm install`, inspect backend terminal logs for stack traces.


---

Last updated: 2025-08-24

