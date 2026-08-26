# Aeris

The trusted real estate ledger. Aeris is a verified marketplace for high-value property: buyers discover listings, sellers publish passports, and verification, messaging, and settlement stay on one ledger.

## Stack

| | |
| --- | --- |
| Client | Vite, React, TypeScript, Tailwind CSS v4 |
| Server | Flask, Poetry, MySQL or SQLite, PyJWT |
| Money | INR (₹) |

Frontend lives in `client/`. Backend lives in `server/`.

## What it does

- Phone OTP sign-in (JWT). Demo OTP is `000000` until an SMS provider is wired.
- Property discovery with location search, budget, type, and verified-only filters.
- Seller dashboard: list a property, photos, edit, delete.
- Listing passport: overview, contracts, financials, timeline, support.
- Track a listing; owners see watchers under **Interest & chats**.
- Secure messages between buyer and owner (stored in MySQL or SQLite).
- Subscribe to verify: Basic ₹20,000 / Verified ₹36,000 / Escrow-Ready ₹50,000, plus a 2.9% processing fee. Amounts come from the server; the client cannot set the price.
- Header notifications for new messages, new watchers, and verify status.
- Optional ngrok tunnel for phone testing.

## Setup

**Need:** Node.js, Python 3.12 or 3.13, Poetry. MySQL only if you keep the default engine.

```bash
git clone <this-repo>
cd aeris-proj
npm install
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Edit `server/.env`:

- `AERIS_DB` — `mysql` (default locally) or `sqlite` (one file, no database server)
- `MYSQL_*` — when `AERIS_DB=mysql` (database `aeris` is created on first run)
- `SQLITE_PATH` — when `AERIS_DB=sqlite`; default `data/aeris.sqlite` under `server/`
- `JWT_SECRET` — long random string (do not leave the example value in production)
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — leave empty for the mock checkout overlay; set both for live Razorpay orders

`client/.env` already points at `http://127.0.0.1:5000`.

## Database

Same Flask models either way. Flip the engine with `AERIS_DB`; do not migrate the schema by hand.

| `AERIS_DB` | Where data lives | Use when |
| --- | --- | --- |
| `mysql` (default off Vercel) | Hosted/local MySQL | Local `npm run dev`, or production that must keep data |
| `sqlite` (also `file` / `fs`) | `SQLITE_PATH` file | A container/VPS with a volume, or skipping MySQL |

SQLite example:

```
AERIS_DB=sqlite
SQLITE_PATH=data/aeris.sqlite
```

On Vercel the API uses SQLite automatically (`/tmp/aeris.sqlite`). That file is wiped on cold start and the catalog is re-seeded; set `AERIS_DB=mysql` plus `MYSQL_*` if you need data to stick.

Do not commit `*.sqlite` or `server/data/`. MySQL and SQLite are separate stores — switching engines does not copy rows.

## Run

From the repo root (starts Vite on **5173** and Flask on **5000**):

```bash
npm run dev
```

The API process is `server/.venv` Python, not system Python. First run creates the venv and runs `poetry install`.

Server only:

```bash
cd server
poetry install
poetry run python app.py
```

Public URL (needs `NGROK_AUTHTOKEN` in the repo-root `.env`):

```bash
cp .env.example .env   # if you have not already
npm run ngrok
```

## Auth

1. Open `/login`
2. Enter a 10-digit Indian mobile number
3. Enter OTP `000000`

JWT is stored in a cookie. Protected routes: sell, profile, verify checkout.

## Payments

Checkout **does not trust an amount from the browser**. The page loads packages from `GET /properties/:id/verify`, then `POST /properties/:id/verify/checkout` with only `package_id`. The server signs a checkout ticket (and creates a Razorpay order when keys are set). Completing pay without a valid ticket does not mark the listing pending.

Empty Razorpay keys → in-app mock overlay (UPI QR on desktop, UPI app link on phone, plus card / netbanking / wallet tabs).

## Tests

```bash
cd server
poetry run python -m unittest discover -s tests -v
```

## Layout

```
client/src/
  config/          routes, UI copy
  components/ui    primitives (tokens only)
  components/patterns
  components/sections
  pages/

server/
  models/          SQL
  views/           validate, process, shape JSON
  routes/          HTTP in, view out
  middleware/      request log, JWT
  schema.sql       MySQL reference DDL (live schema is ensured on boot)
  db.py            MySQL + SQLite; `AERIS_DB` picks the engine
```

Do not commit `.env`, `server/.env`, or other secrets.
