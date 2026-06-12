import { z } from "zod"

export const SessionResponse = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type SessionResponse = z.infer<typeof SessionResponse>

export const MessageResponse = z.object({
  id: z.string(),
  role: z.string(),
  content: z.string(),
  createdAt: z.string(),
})

export type MessageResponse = z.infer<typeof MessageResponse>

export const SessionDetailResponse = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  messages: z.array(MessageResponse),
})

export type SessionDetailResponse = z.infer<typeof SessionDetailResponse>
