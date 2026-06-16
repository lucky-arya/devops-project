# devops-project

An Express.js REST API with Drizzle ORM and Neon Postgres — fully Dockerized for both local development and production.

| Environment | Database | How |
|-------------|----------|-----|
| **Development** | Neon Cloud (ephemeral branch) | Neon Local Docker proxy auto-creates a fresh branch on startup |
| **Production** | Neon Cloud (main branch) | Direct serverless connection via `DATABASE_URL` |

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Development Setup (Local with Neon Local)](#development-setup-local-with-neon-local)
- [Running Database Migrations](#running-database-migrations)
- [Production Deployment](#production-deployment)
- [Environment Variable Reference](#environment-variable-reference)
- [How Environment Switching Works](#how-environment-switching-works)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | ≥ 24 | Must be running |
| [Node.js](https://nodejs.org/) | ≥ 22 | Only for local non-Docker runs |
| [Neon account](https://neon.tech) | — | Free tier works |

You will need from the [Neon Console](https://console.neon.tech):
- **API Key** → Account Settings → API Keys → Generate
- **Project ID** → Your Project → Settings → General
- **Branch ID** → Your Project → Branches (use `main` branch ID as `PARENT_BRANCH_ID`)

---

## Project Structure

```
devops-project/
├── src/
│   ├── app.js                    # Express app setup
│   ├── index.js                  # Entry point
│   ├── server.js                 # HTTP server
│   ├── config/
│   │   └── database.js           # Drizzle + Neon connection (env-aware)
│   ├── models/                   # Drizzle schema definitions
│   ├── routes/                   # API route handlers
│   └── ...
├── drizzle/                      # Generated migration files
├── Dockerfile                    # Multi-stage Docker image
├── .dockerignore
├── docker-compose.dev.yml        # Dev: app + Neon Local proxy
├── docker-compose.prod.yml       # Prod: app only (Neon Cloud)
├── .env.development.example      # Dev env template (safe to commit)
├── .env.production.example       # Prod env template (safe to commit)
├── drizzle.config.js
└── package.json
```

---

## Development Setup (Local with Neon Local)

Neon Local is a Docker proxy that sits between your app and Neon Cloud. When using `PARENT_BRANCH_ID`, it **automatically creates a fresh ephemeral branch** every time you start the stack — and **deletes it** when you stop.

### Step 1 — Create your `.env.development` file

```bash
cp .env.development.example .env.development
```

Open `.env.development` and fill in your real values:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgres://neon:npg@db:5432/neondb

NEON_API_KEY=your_neon_api_key_here
NEON_PROJECT_ID=your_neon_project_id_here
PARENT_BRANCH_ID=br_your_main_branch_id_here

JWT_SECRET=any_dev_secret_here
ARCJET_KEY=your_arcjet_key_here
```

> **Tip:** Find your branch ID in the Neon Console → Your Project → Branches. The `main` branch ID starts with `br_`.

### Step 2 — Start the development stack

```bash
docker compose -f docker-compose.dev.yml up --build
```

This will:
1. Pull and start `neondatabase/neon_local` as the `db` service on port `5432`
2. Neon Local authenticates with your API key and creates a new ephemeral branch
3. Build your app image and start it on port `3000`
4. Your app connects to Neon Local at `http://db:5432/sql` (HTTP transport, not WebSockets)

You should see something like:
```
db   | ✓ Created ephemeral branch: br_dev_abc123
db   | ✓ Listening on port 5432
app  | Listening On http://localhost:3000/
```

### Step 3 — Verify it's working

```bash
# Health check
curl http://localhost:3000/health

# API check
curl http://localhost:3000/api
```

### Step 4 — Stop and clean up

```bash
docker compose -f docker-compose.dev.yml down
```

The Neon Local container will **automatically delete the ephemeral branch** from Neon Cloud.

---

## Running Database Migrations

Run Drizzle migrations inside the running `app` container:

```bash
# Generate migration files from schema changes
docker compose -f docker-compose.dev.yml exec app npm run db:generate

# Apply migrations to the current branch (dev ephemeral branch)
docker compose -f docker-compose.dev.yml exec app npm run db:migrate

# Open Drizzle Studio (requires port forwarding)
docker compose -f docker-compose.dev.yml exec app npm run db:studio
```

For production migrations, run against your production database **before** deploying:

```bash
# Using .env.production credentials
DATABASE_URL="postgres://..." npm run db:migrate
```

---

## Production Deployment

### Step 1 — Create your `.env.production` file

```bash
cp .env.production.example .env.production
```

Fill in your **real Neon Cloud connection string** (copy from Neon Console → Connection Details):

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgres://neondb_owner:your_pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require

JWT_SECRET=a_very_long_and_random_secret_minimum_32_chars
ARCJET_KEY=your_arcjet_key_here
```

> **Security Note:** Never commit `.env.production`. On real servers (AWS, Railway, Render, etc.), inject these as platform environment variables or secrets.

### Step 2 — Run the production stack

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

- Builds the optimized production image (`NODE_ENV=production`)
- Connects directly to Neon Cloud — no Neon Local proxy
- Runs with `restart: unless-stopped` for automatic recovery
- Memory limited to 512MB (adjust in `docker-compose.prod.yml` as needed)

### Step 3 — View logs

```bash
docker compose -f docker-compose.prod.yml logs -f app
```

### Step 4 — Stop the production stack

```bash
docker compose -f docker-compose.prod.yml down
```

---

## Environment Variable Reference

### Development (`.env.development`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | ✅ | Must be `development` |
| `PORT` | ✅ | App port (default: `3000`) |
| `DATABASE_URL` | ✅ | `postgres://neon:npg@db:5432/neondb` (fixed for Neon Local) |
| `NEON_API_KEY` | ✅ | Your Neon API key |
| `NEON_PROJECT_ID` | ✅ | Your Neon project ID |
| `PARENT_BRANCH_ID` | ⚠️ | Parent branch ID — enables ephemeral branch creation |
| `BRANCH_ID` | ⚠️ | Connect to a specific existing branch (use instead of `PARENT_BRANCH_ID`) |
| `NEON_LOCAL_HOST` | ❌ | Defaults to `db` (Neon Local service name) |
| `JWT_SECRET` | ✅ | JWT signing secret |
| `ARCJET_KEY` | ✅ | Arcjet security API key |

> ⚠️ Provide either `PARENT_BRANCH_ID` **or** `BRANCH_ID`, not both.

### Production (`.env.production`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | ✅ | Must be `production` |
| `PORT` | ✅ | App port (default: `3000`) |
| `DATABASE_URL` | ✅ | Your full Neon cloud connection string with `?sslmode=require` |
| `JWT_SECRET` | ✅ | Strong secret (min 32 chars) |
| `ARCJET_KEY` | ✅ | Arcjet security API key |

---

## How Environment Switching Works

The entire database connection behavior is controlled by **`NODE_ENV`**:

```
┌─────────────────────┬──────────────────────────────────────────────────────┐
│ NODE_ENV            │ Database behavior                                    │
├─────────────────────┼──────────────────────────────────────────────────────┤
│ development         │ Neon Local proxy (HTTP transport, no WebSockets)     │
│                     │ DATABASE_URL → postgres://neon:npg@db:5432/neondb    │
│                     │ fetchEndpoint → http://db:5432/sql                   │
├─────────────────────┼──────────────────────────────────────────────────────┤
│ production          │ Direct Neon Cloud serverless connection               │
│                     │ DATABASE_URL → postgres://...neon.tech/...           │
│                     │ Standard @neondatabase/serverless defaults            │
└─────────────────────┴──────────────────────────────────────────────────────┘
```

The relevant code is in [`src/config/database.js`](./src/config/database.js):

```js
if (process.env.NODE_ENV === 'development') {
  const dbHost = process.env.NEON_LOCAL_HOST || 'db';
  neonConfig.fetchEndpoint = `http://${dbHost}:5432/sql`;
  neonConfig.useSecureWebSocket = false;
  neonConfig.poolQueryViaFetch = true;
}
```

---

## Troubleshooting

### `app` container exits immediately on startup

Make sure `.env.development` exists. The compose file requires it:
```bash
cp .env.development.example .env.development
# fill in NEON_API_KEY, NEON_PROJECT_ID, PARENT_BRANCH_ID
```

### `db` container fails with authentication error

Your `NEON_API_KEY` or `NEON_PROJECT_ID` is incorrect. Verify them in the [Neon Console](https://console.neon.tech/app/settings/api-keys).

### `fetch failed` or connection refused errors

Neon Local may still be initializing. The `app` service waits for the `db` healthcheck to pass before starting. If it fails repeatedly:
```bash
docker compose -f docker-compose.dev.yml logs db
```
Look for errors about rate limits or invalid branch IDs.

### `PARENT_BRANCH_ID` not found

The branch ID must be the **ID** (e.g. `br_wispy_brook_123456`), not the branch name. Find it in Neon Console → Branches.

### Neon Local on Mac with VirtioFS

If using Docker Desktop for Mac with git-branch-per-branch mode, switch your VM to **gRPC FUSE** (not VirtioFS) under Docker Desktop → Settings → General. There is a known bug with VirtioFS that prevents branch detection.

### Running migrations fails in production

Run migrations **before** updating the running container:
```bash
# Run with your production DATABASE_URL
NODE_ENV=production DATABASE_URL="postgres://..." npm run db:migrate
# Then deploy
docker compose -f docker-compose.prod.yml up --build -d
```
