import { Hono } from "hono"
import { logger } from "hono/logger"
import { cors } from "hono/cors"
import { streamText } from "ai"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"

const app = new Hono()

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
})

app.use(logger())
app.use("/*", cors())

app.get("/", (c) => c.json({ message: "Hello from Lightcode API", ok: true }))

app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }))

app.post("/generate", async (c) => {
  const body = await c.req.json<{ prompt?: string; system?: string }>()
  if (!body.prompt || typeof body.prompt !== "string") {
    return c.json({ message: "Missing or invalid prompt" }, 400)
  }
  const result = streamText({
    model: openrouter.chat("anthropic/claude-haiku-4.5"),
    system: body.system ?? "You are a creative songwriter. Write an original song based on the user's request.",
    prompt: body.prompt,
    maxOutputTokens: 500,
  })
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of result.textStream) {
        controller.enqueue(new TextEncoder().encode(chunk))
      }
      controller.close()
    },
  })
  return c.body(stream)
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