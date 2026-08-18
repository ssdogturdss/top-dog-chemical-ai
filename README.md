# Top Dog Chemical AI

A professional **field operations platform** for car-wash chemical technicians.

Built on a pnpm monorepo with a React/Vite frontend, an Express/Node.js API, and PostgreSQL.

---

## Features

| Module | Description |
|--------|-------------|
| **Logbook** | Create, search, pin, and manage field notes |
| **Dilution Expert** | Forward/reverse injector lookup across 65+ configurations and 8 brands |
| **AI Assistant** | GPT-powered streaming chat for chemical guidance |
| **Auth** | Session-based operator login with rate-limited password auth |

---

## Requirements

- **Node.js 20+** (22 or 24 recommended)
- **pnpm 9+** — `npm install -g pnpm`
- **PostgreSQL 14+** running locally or remotely
- An **OpenAI API key** (or compatible provider) for the AI Assistant

> **Docker path:** Docker Compose handles Node and PostgreSQL for you — no local installs needed beyond Docker itself.

---

## Quick Start (local development)

```bash
# 1. Clone
git clone https://github.com/ssdogturdss/top-dog-chemical-ai.git
cd top-dog-chemical-ai

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL, OPENAI_API_KEY, ADMIN_PASSWORD, SESSION_SECRET

# 4. Push the database schema
pnpm db:push

# 5. Seed the database (65 injector configs + sample notes)
pnpm db:seed

# 6. Start development (API + frontend in parallel)
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — the default operator password is `topdog` (change via `ADMIN_PASSWORD`).

---

## Environment Variables

See [`.env.example`](.env.example) for a fully-annotated list. Key variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `SESSION_SECRET` | ✅ prod | `dev-only-insecure-secret` | Signs session cookies |
| `ADMIN_PASSWORD` | — | `topdog` | Operator login password |
| `OPENAI_API_KEY` | ✅ AI | — | Standard OpenAI key |
| `OPENAI_BASE_URL` | — | `https://api.openai.com/v1` | Custom OpenAI-compatible endpoint |
| `PORT` | — | `8080` | API server port |
| `FRONTEND_ORIGIN` | — prod | `http://localhost:3000` | Added to CORS allowlist |
| `NODE_ENV` | — | `development` | `development` \| `production` |

---

## Development

```bash
# Start everything concurrently (requires .env)
pnpm dev

# API server only (port 8080)
pnpm dev:api

# Frontend only (port 3000)
pnpm dev:web

# Type-check all packages
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format
```

---

## Production Build

```bash
# Build all packages (type-check → build libs → build artifacts)
pnpm build

# Start the production API server
# The frontend is served as static files from the API server
pnpm start
```

### Serving the frontend in production

The production API server only serves JSON APIs. Serve the built frontend separately:

- **Nginx** — see [`deploy/nginx.conf.example`](deploy/nginx.conf.example)
- **Docker Compose** — see below (Nginx + app container included)
- **CDN/static host** — copy `artifacts/top-dog-app/dist/public` to your host

---

## Database

This project uses **PostgreSQL** with **Drizzle ORM**.

```bash
# Push schema to the database (development — destructive if schema changed)
pnpm db:push

# Generate and apply migrations (production-safe)
pnpm db:generate  # generates migration files
pnpm db:migrate   # applies pending migrations

# Seed the database (idempotent — safe to run multiple times)
pnpm db:seed
```

Schema source of truth: `lib/db/src/schema/`

---

## Docker

### Development with Docker Compose

Starts PostgreSQL + the API server + an Nginx reverse-proxy serving the built frontend:

```bash
cp .env.example .env
# Edit .env — set OPENAI_API_KEY, ADMIN_PASSWORD, SESSION_SECRET

docker compose up --build
```

Then open [http://localhost:3000](http://localhost:3000).

### Production image only

```bash
# Build the production image
docker build -t top-dog-chemical-ai .

# Run (database must be external)
docker run -d \
  -e DATABASE_URL=postgresql://user:pass@your-db:5432/topdog \
  -e SESSION_SECRET=your-secret \
  -e ADMIN_PASSWORD=your-password \
  -e OPENAI_API_KEY=sk-... \
  -e FRONTEND_ORIGIN=https://topdog.example.com \
  -e NODE_ENV=production \
  -p 8080:8080 \
  top-dog-chemical-ai
```

---

## Testing

```bash
# Run all tests
pnpm test

# API integration tests only
pnpm --filter @workspace/api-server run test

# Frontend unit tests only
pnpm --filter @workspace/top-dog-app run test
```

The CI pipeline (`ci.yml`) runs: install → typecheck → lint → test → build on every push.

---

## Deployment (Linux VPS)

### Prerequisites

```bash
# Install Node.js 22 via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 22 && nvm use 22

# Install pnpm
npm install -g pnpm

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres psql -c "CREATE DATABASE topdog; CREATE USER topdog WITH PASSWORD 'yourpassword'; GRANT ALL PRIVILEGES ON DATABASE topdog TO topdog;"
```

### Deploy steps

```bash
git clone https://github.com/ssdogturdss/top-dog-chemical-ai.git
cd top-dog-chemical-ai
cp .env.example .env
# Edit .env with production values

pnpm install --frozen-lockfile
pnpm build
pnpm db:push
pnpm db:seed

# Start with PM2 for process management
npm install -g pm2
pm2 start "pnpm start" --name topdog
pm2 save && pm2 startup

# Configure Nginx (see deploy/nginx.conf.example)
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/topdog
sudo ln -s /etc/nginx/sites-available/topdog /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## Repository Structure

```
top-dog-chemical-ai/
├── artifacts/
│   ├── api-server/          # Express API server (Node.js)
│   └── top-dog-app/         # React + Vite frontend
├── lib/
│   ├── api-spec/            # OpenAPI specification + Orval codegen config
│   ├── api-client-react/    # Auto-generated TanStack Query hooks
│   ├── api-zod/             # Auto-generated Zod validators
│   ├── db/                  # Drizzle ORM schema, migrations, seed
│   ├── integrations-openai-ai-server/  # OpenAI server-side client
│   └── integrations-openai-ai-react/   # OpenAI browser-side hooks
├── .env.example             # Environment variable template
├── Dockerfile               # Production container image
├── docker-compose.yml       # Full-stack local development
├── deploy/
│   └── nginx.conf.example   # Nginx reverse-proxy config
└── .github/
    └── workflows/
        └── ci.yml           # GitHub Actions CI pipeline
```

---

## Troubleshooting

**`DATABASE_URL` error on startup**
Ensure PostgreSQL is running and `DATABASE_URL` in `.env` points to an accessible database. Run `pnpm db:push` to create tables before starting the server.

**`OPENAI_API_KEY` error**
Set `OPENAI_API_KEY` in `.env`. The AI Assistant will return an error if no key is configured — all other features work without it.

**Login page always shows after login**
Make sure `FRONTEND_ORIGIN` matches exactly the URL you open in your browser (scheme + host + port). CORS will block credentialed requests from unrecognized origins.

**Port already in use**
Change `PORT` (API) or `FRONTEND_PORT` in `.env`, or stop the conflicting process.

**`pnpm: command not found`**
Install pnpm: `npm install -g pnpm`, then re-run.

**Docker: `permission denied`**
Run Docker commands with `sudo`, or add your user to the `docker` group: `sudo usermod -aG docker $USER`.
