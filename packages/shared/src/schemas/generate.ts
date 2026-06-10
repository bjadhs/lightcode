import { z } from "zod"

export const GenerateRequest = z.object({
  prompt: z.string().min(1),
  system: z.string().optional(),
  conversationId: z.string().optional(),
})

export type GenerateRequest = z.infer<typeof GenerateRequest>