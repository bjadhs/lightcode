# Lightcode

A terminal-based AI coding assistant. Type a prompt in the CLI, and it streams back code, explanations, or shell commands via a connected language model — live to your terminal.

## What it does

- **Terminal UI** — A keyboard-driven TUI built with OpenTUI and React. Navigate with slash commands (`/about`, `/settings`, `/result`), type prompts, and watch responses stream in real time.
- **Streaming generation** — When you submit a prompt, the server streams the LLM response back word-by-word. No waiting for the entire song to finish.
- **AI-powered backend** — The Hono API server talks to OpenRouter using Claude Haiku 4.5, a fast and cheap model.

## Architecture

This is a Bun monorepo with two apps and a few shared packages:

```
apps/
  server/     # Hono HTTP API (Bun)
  cli/        # OpenTUI React terminal app (Bun)
packages/
  shared/     # Zod schemas shared between server and CLI
  api-client/ # Typed fetch wrapper the CLI uses to talk to the server
  database/   # Prisma + Postgres (unused today, wired for future features)
  config/     # Shared TypeScript configs
```

The server exposes a single endpoint:

```
POST /generate
Body: { "prompt": "a song about summer" }
Response: text/plain stream (the generated response, chunked)
```

The CLI sends the prompt to `/generate`, reads the stream chunk by chunk, and updates the screen as text arrives.

## Getting started

### 1. Install dependencies

```bash
bun install
```

### 2. Add your OpenRouter API key

Create a `.env` file in the project root:

```bash
OPENROUTER_API_KEY=your_key_here
```

Get a free key at [openrouter.ai](https://openrouter.ai).

### 3. Run the server

```bash
cd apps/server
OPENROUTER_API_KEY=your_key_here bun run dev
```

The server starts on `http://localhost:3000`.

### 4. Run the CLI (in another terminal)

```bash
cd apps/cli
bun run dev
```

### 5. Ask a question

Type a prompt like:

```
how do I reverse an array in JavaScript
```

Press **Enter**. The app switches to the **Result** screen and streams the response live.

### Navigation shortcuts

| Key | Action |
|-----|--------|
| `↵` | Submit prompt |
| `/` | Show route dropdown (Home, About, Settings, Result) |
| `↑` / `↓` | Navigate dropdown |
| `esc` | Clear input / close dropdown |
| `q` | Quit the app |
| `ctrl+c` | Quit the app |

## Tech stack

- **Runtime:** Bun (no Node.js)
- **API:** Hono
- **TUI:** OpenTUI with React reconciler
- **AI:** Vercel AI SDK + OpenRouter (Claude Haiku 4.5)
- **Validation:** Zod
- **Language:** TypeScript throughout

## Project conventions

- ESM only — every package is `"type": "module"`
- File names are `kebab-case.ts(x)`
- Source of truth for API shapes lives in `@lightcode/shared`
- The CLI never talks to the database directly — only through the API
- No tests in this repo (by design)

## License

Private — not open source.
