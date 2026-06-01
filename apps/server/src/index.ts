import { Hono } from "hono"
import { logger } from "hono/logger"
import { cors } from "hono/cors"
import { generateText } from "ai"
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
  const { prompt } = await c.req.json<{ prompt?: string }>()
  if (!prompt || typeof prompt !== "string") {
    return c.json({ message: "Missing or invalid prompt" }, 400)
  }
  const { text } = await generateText({
    model: openrouter.chat("moonshotai/kimi-k2.6"),
    prompt,
  })
  return c.json({ text })
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