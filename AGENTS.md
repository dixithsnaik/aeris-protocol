# Aeris — agent contract

Read this file before changing code. Cursor also loads `.cursor/rules/` on every session.

This project is **Aeris**. Frontend is `client/`. Backend is `server/`.

---

## Ponytail (always on)

You are a lazy senior developer. Lazy means efficient, not careless. The best code is the code never written.

Before writing any code, stop at the first rung that holds:

1. Does this need to be built at all? (YAGNI)
2. Does it already exist in this codebase? Reuse it.
3. Does the standard library already do this? Use it.
4. Does a native platform feature cover it? Use it.
5. Does an already-installed dependency solve it? Use it.
6. Can this be one line? Make it one line.
7. Only then: write the minimum code that works.

Read the code the change touches and trace the real flow before picking a rung.

Rules:

- No abstractions that weren't explicitly requested.
- No new dependency if it can be avoided.
- No boilerplate nobody asked for.
- Deletion over addition. Boring over clever. Fewest files possible.
- Shortest **correct** diff wins.
- Mark deliberate shortcuts with a `ponytail:` comment (ceiling + upgrade path).

Not lazy about: understanding the problem, trust-boundary validation, data-loss error handling, security, accessibility, anything **explicitly requested**.

### Cursor note

Cursor uses `.cursor/rules/ponytail.mdc`. It does **not** run Ponytail's two Node.js lifecycle hooks (those are Claude Code / Codex only). If `node` is missing from PATH, Ponytail skills still work; hook activation just stays quiet.

### Architecture override (explicitly requested)

Do **not** treat the frontend or backend systems below as optional Ponytail skip-work. They are requested. Ponytail still means: no extra libraries, no unused modules, no speculative folders, reuse existing pieces.

---

## Frontend (`client/`)

Stack: Vite, React, TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`). Styling is Tailwind + CSS variables only. No CSS-in-JS. No component library unless the user asks.

### Design tokens

Put semantic variables in `client/src/index.css` with Tailwind v4 `@theme`. Components consume **token names**, not raw palettes.

```css
@import "tailwindcss";

@theme {
  --color-bg: #0b0f14;
  --color-surface: #121821;
  --color-fg: #e8eef5;
  --color-muted: #9aa8b8;
  --color-brand: #3b82f6;
  --color-brand-fg: #ffffff;
  --color-danger: #ef4444;
  --font-sans: ui-sans-serif, system-ui, sans-serif;
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
}
```

Then use `bg-bg`, `bg-surface`, `text-fg`, `text-muted`, `bg-brand`, `text-brand-fg`, `rounded-md`.

Do not scatter `bg-blue-500`, hex values, or one-off magic numbers in JSX. If a value is visual language, it belongs in `@theme`.

Layout utilities (`flex`, `grid`, `min-h-screen`, `gap-4`, `p-4`) are allowed.

### Component layers

Compose small pieces into larger ones. Do **not** name folders atoms / molecules / organisms.

Target tree (create a file when something needs it, not before):

```
client/src/
  config/
    routes.ts          # path, auth, layout, element
    ui.ts              # nav, titles, layout flags
  app/
    router.tsx         # builds routes from config
    providers.tsx      # wrappers (auth, theme, etc.)
  components/
    ui/                # Button, Input, Text, Icon, Spinner
    patterns/          # FormField, SearchBar, NavItem
    sections/          # Header, Sidebar, LoginForm
  layouts/
    AppLayout.tsx      # chrome + <Outlet />
    AuthLayout.tsx
  routes/
    ProtectedRoute.tsx
    PublicRoute.tsx
  pages/
```

Layer rules:

| Folder | May do | Must not |
| --- | --- | --- |
| `ui` | Primitive markup + token classes + simple variants | Import pages, call APIs, use `useNavigate` |
| `patterns` | Compose `ui`, local UI state | Duplicate `ui` markup, fetch data |
| `sections` | Compose patterns/`ui`, accept data props | Own the router, hardcode the app nav map |
| `layouts` | Chrome + `<Outlet />` | Page business logic |
| `pages` | Compose sections, load data, use route params | Paste primitive button/input styles |

If the same control appears twice, it belongs in `ui` (or `patterns`). Pages assemble; they do not restyle primitives.

```tsx
// BAD — one-off styles in a page
<button className="bg-blue-600 text-white px-4 py-2 rounded-lg">Save</button>

// GOOD — primitive in components/ui using tokens
<Button variant="primary">Save</Button>
```

### Routing

When navigation exists, use `react-router-dom` (install that one package; not another router).

- One router at the app root (`RouterProvider` or `BrowserRouter` in `main.tsx` / `app/router.tsx`).
- Nested routes. Layouts and guards render `<Outlet />`.
- Protected routes wrap private pages. Unauthenticated users `<Navigate />` to login (keep `location` in state if return-to is needed).
- Public-only routes (login) redirect away if already signed in.
- Route table is data in `config/routes.ts`. Do not sprinkle path strings through random components; export path helpers from config if links need them.

```tsx
<Route element={<ProtectedRoute />}>
  <Route element={<AppLayout />}>
    <Route path="/dashboard" element={<DashboardPage />} />
  </Route>
</Route>
```

```tsx
export function ProtectedRoute() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
```

### Config-driven wrappers

UI structure comes from config, not from copy-pasted JSX trees.

- `config/routes.ts` — routes, auth, which layout.
- `config/ui.ts` — nav items, document titles, feature flags, shell options.
- `app/providers.tsx` — compose providers (auth, theme). Add a provider when a concern exists, not "for later".
- Header, sidebar, and command palettes **map over config**. Changing a nav item should not require editing the section's markup structure.

### Dependencies

Allowed without asking: `react-router-dom` when adding routes.

Ask first: UI kits, state libraries, form libraries, animation libraries, icon packs, CSS frameworks other than Tailwind.

Prefer native HTML + tokens (`<input type="date">`) unless a `ui` component already wraps that control.

---

## Backend (`server/`)

Stack: Flask, Poetry, `mysql-connector-python`, PyJWT. No SQLAlchemy, no Flask-RESTful, no Flask-JWT-Extended unless the user asks.

Run both from the repo root (`client` via Vite, `server` via `server/.venv`):

```bash
npm install
npm run dev
```

Server only:

```bash
cd server
poetry install
poetry run python app.py
```

Env lives in `server/.env` (see `.env.example`). Do not commit secrets.

### Layout

```
server/
  pyproject.toml
  schema.sql
  app.py                # create_app
  config.py
  db.py                 # mysql connector pool
  log.py                # logging setup; import this logger
  tokens.py             # JWT issue / decode
  middleware/
    request_log.py
    auth.py             # JWT guard
  models/               # SQL fetch/insert only
  views/                # process model data, return (body, status)
  routes/               # HTTP in, view out
```

### Model → view → route

| Layer | Does | Does not |
| --- | --- | --- |
| `models/` | Run SQL via `db.py`. Return rows/dicts. | Import Flask, JWT, or shape HTTP errors |
| `views/` | Validate input, call model, hash/check password, issue JWT, shape the payload | Execute SQL, read `request` |
| `routes/` | Read JSON/query, call one view, return `(body, status)` | Contain business logic or SQL |

```python
# models/user.py
def fetch_user_by_email(email): ...

# views/auth.py
def login(email, password):
    user = fetch_user_by_email(email)
    ...
    return {"token": token}, 200

# routes/auth.py
@bp.post("/login")
def login_route():
    body = request.get_json(silent=True) or {}
    return login(body.get("email"), body.get("password"))
```

### Middleware

Import the logger from `log.py` — do not `logging.getLogger` ad-hoc in every file unless you pass that module logger.

- `before_request` / `after_request`: request log (method, path, status).
- JWT guard: Bearer token on every path **not** in `config.PUBLIC_PATHS`. Sets `g.user_id`. Invalid/missing token → `{"error": "unauthorized"}`, 401.
- Routes stay unaware of token parsing.

Auth is phone OTP + JWT (HS256). `send_otp` is the SMS hook (returns `000000` until a provider is wired). Passwords: not used.

### Dependencies

Allowed without asking: Flask, `mysql-connector-python`, PyJWT, Poetry.

Ask first: ORMs, extra Flask extensions, Redis, Celery, CORS libraries (add CORS when the client actually calls the API).

---

## Working agreement

1. Read this file and the matching `.cursor/rules/*.mdc`.
2. Climb the Ponytail ladder.
3. For `client/` work, place code in `ui` / `patterns` / `sections` and drive chrome/routes from config.
4. For `server/` work, keep SQL in models, processing in views, HTTP in routes; use the JWT and logging middleware.
5. Build the pieces the current task needs, in the right folders.
