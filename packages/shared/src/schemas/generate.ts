import { z } from "zod"

export const GenerateRequest = z.object({
  messages: z.array(z.any()),
  sessionId: z.string().optional(),
})

export type GenerateRequest = z.infer<typeof GenerateRequest>

export const StreamChunk = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), delta: z.string() }),
  z.object({
    type: z.literal("tool_call"),
    id: z.string(),
    name: z.string(),
    input: z.unknown(),
  }),
  z.object({ type: z.literal("error"), message: z.string() }),
  z.object({ type: z.literal("finish") }),
])

export type StreamChunk = z.infer<typeof StreamChunk>

export const FinalizeSessionRequest = z.object({
  sessionId: z.string().optional(),
  userContent: z.string(),
  assistantContent: z.string(),
})

export type FinalizeSessionRequest = z.infer<typeof FinalizeSessionRequest>

export const FinalizeSessionResponse = z.object({
  sessionId: z.string(),
})

export type FinalizeSessionResponse = z.infer<typeof FinalizeSessionResponse>
