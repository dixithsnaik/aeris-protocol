# Aeris

The trusted real estate ledger. Aeris is a verified marketplace for high-value property: buyers discover listings, sellers publish passports, and verification, messaging, and settlement stay on one ledger.

## Stack

| | |
| --- | --- |
| Client | Vite, React, TypeScript, Tailwind CSS v4 |
| Server | Flask, Poetry, MySQL or SQLite, PyJWT |
| Chain | Hash-chain service on **5001** (SHA-256 blocks in a JSONL file) |
| Money | INR (₹) |

Frontend lives in `client/`. Backend lives in `server/`.

## What it does

- Phone OTP sign-in (JWT). Demo OTP is `000000` until an SMS provider is wired.
- Property discovery with location search, budget, type, and verified-only filters.
- Seller dashboard: list a property, photos, edit, delete.
- Listing passport: overview, contracts, financials, timeline, support. **Download certificate** is a signed PDF with public facts, metadata, and vault hashes — not the deeds. Anyone can check it at `/passport` without seeing the documents; an edited file fails the signature.
- Track a listing; owners see watchers under **Interest & chats**.
- Secure messages between buyer and owner (stored in MySQL or SQLite).
- Subscribe to verify: Basic ₹20,000 / Verified ₹36,000 / Escrow-Ready ₹50,000, plus a 2.9% processing fee. Amounts come from the server; the client cannot set the price.
- After lawyer sign-off the chain service mints a **block token**. Anyone can paste it on the passport to verify the **trust factor**.
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
- `CHAIN_URL` — hash-chain service (default `http://127.0.0.1:5001`)
- `CHAIN_SECRET` — shared mint key for Aeris ↔ chain (must match on both)

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

From the repo root (starts Vite on **5173**, Flask on **5000**, chain on **5001**):

```bash
npm run dev
```

The API and chain processes use `server/.venv` Python, not system Python. First run creates the venv and runs `poetry install`.

Server only:

```bash
cd server
poetry install
poetry run python app.py
```

Chain only (same venv):

```bash
npm run chain
```

The chain writes `chain/data/chain.jsonl`. Do not commit that file.

## Block token

1. Owner pays to verify → listing is **Pending** (legal review).
2. **Counsel signed off** (same stamp a lawyer portal would send) hits `POST /properties/:id/approve`. Aeris then `POST`s the chain at `/mint` and puts the token in the notification.
3. On the passport, paste the token → **Add token** / **Verify trust**. Trust is 0–100 from lawyer seal plus later blocks (confirmations).

Mint is idempotent per listing. If the chain process is down, the listing still verifies; the token is missing until chain is up and sign-off is stamped again.

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

Chain ledger:

```bash
cd chain
python -m unittest test_ledger.py -v
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

chain/
  app.py           mint + token lookup (port 5001)
  ledger.py        append-only SHA-256 file chain
```

Do not commit `.env`, `server/.env`, or other secrets.
