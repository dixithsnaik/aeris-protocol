# Aeris

The trusted real estate ledger. Aeris is a verified marketplace for high-value property: buyers discover listings, sellers publish passports, and verification, messaging, and settlement stay on one ledger.

## Stack

| | |
| --- | --- |
| Client | Vite, React, TypeScript, Tailwind CSS v4 |
| Server | Flask, Poetry, MySQL (`mysql-connector-python`), PyJWT |
| Money | INR (₹) |

Frontend lives in `client/`. Backend lives in `server/`.

## What it does

- Phone OTP sign-in (JWT). Demo OTP is `000000` until an SMS provider is wired.
- Property discovery with location search, budget, type, and verified-only filters.
- Seller dashboard: list a property, photos, edit, delete.
- Listing passport: overview, contracts, financials, timeline, support.
- Track a listing; owners see watchers under **Interest & chats**.
- Secure messages between buyer and owner (stored in MySQL).
- Subscribe to verify: Basic ₹20,000 / Verified ₹36,000 / Escrow-Ready ₹50,000, plus a 2.9% processing fee. Amounts come from the server; the client cannot set the price.
- Header notifications for new messages, new watchers, and verify status.
- Optional ngrok tunnel for phone testing.

## Setup

**Need:** Node.js, Python 3.12 or 3.13, Poetry, MySQL.

```bash
git clone <this-repo>
cd aeris-proj
npm install
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Edit `server/.env`:

- `MYSQL_*` — local MySQL (database `aeris` is created on first run)
- `JWT_SECRET` — long random string (do not leave the example value in production)
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — leave empty for the mock checkout overlay; set both for live Razorpay orders

`client/.env` already points at `http://127.0.0.1:5000`.

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
  schema.sql       reference DDL (live schema is ensured on boot)
```

Do not commit `.env`, `server/.env`, or other secrets.
