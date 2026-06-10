import { z } from "zod"

export const ConversationResponse = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type ConversationResponse = z.infer<typeof ConversationResponse>

export const MessageResponse = z.object({
  id: z.string(),
  role: z.string(),
  content: z.string(),
  createdAt: z.string(),
})

export type MessageResponse = z.infer<typeof MessageResponse>

export const ConversationDetailResponse = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  messages: z.array(MessageResponse),
})

export type ConversationDetailResponse = z.infer<typeof ConversationDetailResponse>
