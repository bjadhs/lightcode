import { z } from "zod"

export const GenerateResponse = z.object({
  text: z.string(),
})

export type GenerateResponse = z.infer<typeof GenerateResponse>
