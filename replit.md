# Top Dog Chemical AI

A professional car wash chemical operations platform for field technicians. Features a logbook for field notes, a dilution expert for injector lookup (forward and reverse), and an AI assistant powered by GPT for chemical operations guidance.

## Run & Operate

- `pnpm --filter @workspace/top-dog-app run dev` — run the frontend (reads `PORT` env)
- `pnpm --filter @workspace/api-server run dev` — run the API server (reads `PORT` env)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `SESSION_SECRET` — session signing secret
- Required env: `AI_INTEGRATIONS_OPENAI_API_KEY` / `AI_INTEGRATIONS_OPENAI_BASE_URL` — provisioned via Replit OpenAI integration
- Optional env: `ADMIN_PASSWORD` — operator login password (default in dev: `topdog`; set a strong value for production)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Wouter routing, TanStack Query, Shadcn UI, Tailwind CSS
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (v3), `drizzle-zod`
- API codegen: Orval 8.23 (from OpenAPI spec in `lib/api-spec/openapi.yaml`)
- Build: esbuild (ESM bundle)
- AI: OpenAI via Replit AI Integrations proxy (`gpt-5.6-luna`)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle table definitions (notes, dilution, conversations, messages)
- `lib/api-client-react/src/generated/` — auto-generated React Query hooks (do not edit manually)
- `lib/api-zod/src/generated/` — auto-generated Zod schemas (do not edit manually)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/top-dog-app/src/pages/` — React page components
- `artifacts/top-dog-app/src/index.css` — design tokens (Safety Orange brand, industrial theme)

## Architecture decisions

- **`type: number` instead of `type: integer` in OpenAPI spec** — Orval 8.23 generates `zod.int()` (Zod v4 API) but workspace pins Zod v3, which lacks `.int()`. All integer fields use `type: number` to emit `zod.number()`.
- **OpenAI via Replit AI Integrations** — `setupReplitAIIntegrations({ providerSlug: "openai" })` auto-provisions `AI_INTEGRATIONS_OPENAI_BASE_URL` and `AI_INTEGRATIONS_OPENAI_API_KEY`. Model: `gpt-5.6-luna`.
- **SSE streaming for chat** — POST `/api/openai/conversations/:id/messages` streams chunks as `data: {"content":"..."}\n\n`, terminates with `data: {"done":true}\n\n`. Frontend uses `fetch` + `ReadableStream` (not EventSource) to process the stream.
- **Orval mutation body wrapping** — Orval-generated mutations pass the body as `{ data: <body> }`, not bare. E.g. `mutateAsync({ data: { title } })`, not `mutateAsync({ title })`.

## Product

- **Logbook** (`/`) — Create, search, filter, and pin field operation notes by category
- **Dilution Expert** (`/dilution`) — Forward lookup (injector + tip color → ratio/oz/gal/GPM) and reverse lookup (target ratio → matching injector configs) across 65+ configurations from 8 brands
- **AI Assistant** (`/chat`) — GPT-powered chat with streaming responses, conversation history, and deep car wash chemical expertise built into the system prompt

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after editing `openapi.yaml` — the generated client and Zod schemas must stay in sync.
- The `useLookupDilution` and `useReverseDilutionLookup` hooks require `{ query: { enabled } as any }` to conditionally enable — TanStack Query's `UseQueryOptions` type requires `queryKey` which the generated hook computes internally.
- Dilution brands hook is `useListDilutionBrands` (not `useGetDilutionBrands`).

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
