import { Hono } from "hono"
import { logger } from "hono/logger"
import { cors } from "hono/cors"
import { streamText, type ModelMessage } from "ai"
import { ZodError } from "zod"
import { GenerateRequest, FinalizeSessionRequest } from "@lightcode/shared"
import { prisma } from "@lightcode/database"
import { openrouter, MODEL, MAX_TOKENS, DEFAULT_SYSTEM } from "@lightcode/ai"
import { tools } from "@lightcode/tools"

const app = new Hono()

// Simple in-memory rate limiter: one request per IP per second
const rateLimits = new Map<string, number>()

app.use(logger())
app.use("/*", cors())

app.get("/", (c) => c.json({ message: "Hello from Lightcode API", ok: true }))

app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }))

app.post("/generate", async (c) => {
  const ip = c.req.header("x-forwarded-for") ?? "unknown"
  const last = rateLimits.get(ip)
  if (last && Date.now() - last < 1000) {
    return c.json({ message: "Rate limited. Please slow down." }, 429)
  }
  rateLimits.set(ip, Date.now())

  let body: { messages: unknown[]; sessionId?: string }
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
    system: DEFAULT_SYSTEM,
    messages: body.messages as ModelMessage[],
    maxOutputTokens: MAX_TOKENS,
    tools,
  })

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const part of result.fullStream) {
          switch (part.type) {
            case "text-delta":
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({ type: "text", delta: part.text }) + "\n"
                )
              )
              break
            case "tool-call":
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: "tool_call",
                    id: part.toolCallId,
                    name: part.toolName,
                    input: part.input,
                  }) + "\n"
                )
              )
              break
            case "finish":
              controller.enqueue(
                encoder.encode(JSON.stringify({ type: "finish" }) + "\n")
              )
              break
            case "error":
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: "error",
                    message: String(part.error),
                  }) + "\n"
                )
              )
              break
          }
        }
        controller.close()
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            JSON.stringify({ type: "error", message: String(err) }) + "\n"
          )
        )
        controller.close()
      }
    },
  })

  return c.body(stream, 200, {
    "Content-Type": "application/x-ndjson",
  })
})

app.post("/sessions/finalize", async (c) => {
  let body: { sessionId?: string; userContent: string; assistantContent: string }
  try {
    body = FinalizeSessionRequest.parse(await c.req.json())
  } catch (err) {
    if (err instanceof ZodError) {
      return c.json({ message: err.issues.map((e) => e.message).join(", ") }, 400)
    }
    throw err
  }

  let sessionId = body.sessionId
  if (!sessionId) {
    const session = await prisma.conversation.create({
      data: { title: body.userContent.slice(0, 100) },
    })
    sessionId = session.id
  }

  await prisma.message.createMany({
    data: [
      { role: "user", content: body.userContent, conversationId: sessionId },
      { role: "assistant", content: body.assistantContent, conversationId: sessionId },
    ],
  })

  await prisma.conversation.update({
    where: { id: sessionId },
    data: { updatedAt: new Date() },
  })

  return c.json({ sessionId })
})

app.get("/sessions", async (c) => {
  const sessions = await prisma.conversation.findMany({
    orderBy: { updatedAt: "desc" },
    take: 50,
  })
  return c.json(sessions)
})

app.get("/sessions/:id", async (c) => {
  const id = c.req.param("id")
  const session = await prisma.conversation.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  })
  if (!session) {
    return c.json({ message: "Session not found" }, 404)
  }
  return c.json(session)
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
