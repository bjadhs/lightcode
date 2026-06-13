import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { streamText, type ModelMessage } from "ai"
import { GenerateRequest } from "@lightcode/shared"
import { openrouter, MODEL, MAX_TOKENS, DEFAULT_SYSTEM } from "@lightcode/ai"
import { tools } from "@lightcode/tools"
import { checkRateLimit } from "../lib/rate-limit"

const validateBody = zValidator("json", GenerateRequest)

const generate = new Hono().post("/", validateBody, async (c) => {
  // Take only the first hop — x-forwarded-for can be a comma-separated list
  const rawIp = c.req.header("x-forwarded-for") ?? "unknown"
  const ip = (rawIp.split(",")[0] ?? "unknown").trim()
  if (!checkRateLimit(ip)) {
    return c.json({ message: "Rate limited. Please slow down." }, 429)
  }

  const body = c.req.valid("json")

  const result = streamText({
    model: openrouter.chat(MODEL, { usage: { include: true } }),
    system: DEFAULT_SYSTEM,
    messages: body.messages as ModelMessage[],
    maxOutputTokens: MAX_TOKENS,
    tools,
    // Stop generating (and billing) when the client disconnects
    abortSignal: c.req.raw.signal,
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
                  JSON.stringify({ type: "error", message: String(part.error) }) + "\n"
                )
              )
              break
          }
        }

        const usage = await result.totalUsage
        const providerMetadata = await result.providerMetadata
        const openrouterMeta = providerMetadata?.openrouter as
          | { usage?: { cost?: number } }
          | undefined

        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "usage",
              promptTokens: usage.inputTokens ?? 0,
              completionTokens: usage.outputTokens ?? 0,
              totalTokens: usage.totalTokens ?? 0,
              cost: openrouterMeta?.usage?.cost ?? null,
            }) + "\n"
          )
        )
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

export default generate
