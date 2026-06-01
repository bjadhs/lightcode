import { Hono } from "hono"
import { logger } from "hono/logger"
import { cors } from "hono/cors"
import { streamText } from "ai"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { GenerateRequest } from "@lightcode/shared"
import { ZodError } from "zod"

const app = new Hono()

const MODEL = process.env.LLM_MODEL ?? "anthropic/claude-haiku-4.5"
const MAX_TOKENS = Number(process.env.LLM_MAX_TOKENS ?? "500")

const DEFAULT_SYSTEM = `You are LightCode, a terminal coding assistant integrated with Claude via OpenRouter.

Guidelines:
- Be concise. Use code blocks when sharing code. Prefer short, direct explanations.
- Help with: code generation, debugging, explanation, refactoring, shell commands, git operations.
- When suggesting shell commands, wrap them in triple-backtick bash blocks.
- Default to TypeScript/JavaScript unless the user specifies otherwise.
- If the user's request is ambiguous, ask ONE clarifying question — don't dump a list.
- Keep responses under 200 lines. Use bullet points. No fluff.`

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
})

// Simple in-memory rate limiter: one request per IP per second
const rateLimits = new Map<string, number>()

app.use(logger())
app.use("/*", cors())

app.get("/", (c) => c.json({ message: "Hello from Lightcode API", ok: true }))

app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }))

app.post("/generate", async (c) => {
  // Rate limiting
  const ip = c.req.header("x-forwarded-for") ?? "unknown"
  const last = rateLimits.get(ip)
  if (last && Date.now() - last < 1000) {
    return c.json({ message: "Rate limited. Please slow down." }, 429)
  }
  rateLimits.set(ip, Date.now())

  // Validate request body
  let body: { prompt: string; system?: string }
  try {
    body = GenerateRequest.parse(await c.req.json())
  } catch (err) {
    if (err instanceof ZodError) {
      return c.json({ message: err.issues.map((e) => e.message).join(", ") }, 400)
    }
    throw err
  }

  const result = streamText({
    model: openrouter.chat(MODEL),
    system: body.system ?? DEFAULT_SYSTEM,
    prompt: body.prompt,
    maxOutputTokens: MAX_TOKENS,
  })

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.textStream) {
          controller.enqueue(new TextEncoder().encode(chunk))
        }
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })

  return c.body(stream, 200, {
    "Content-Type": "text/plain; charset=utf-8",
  })
})

app.notFound((c) => c.json({ message: "Not Found" }, 404))

app.onError((err, c) => {
  console.error(err)
  return c.json({ message: "Internal Server Error" }, 500)
})

export default {
  port: Number(process.env.PORT ?? 3000),
  fetch: app.fetch,
}

console.log(`Server running on http://localhost:${process.env.PORT ?? 3000}`)