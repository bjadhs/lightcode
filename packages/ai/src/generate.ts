import { streamText } from "ai"
import { openrouter } from "./openrouter"
import { MODEL, MAX_TOKENS, DEFAULT_SYSTEM } from "./constants"

export interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

export interface GenerateOptions {
  messages: Message[]
  system?: string
  maxOutputTokens?: number
}

export function generateStream(options: GenerateOptions) {
  return streamText({
    model: openrouter.chat(MODEL),
    system: options.system ?? DEFAULT_SYSTEM,
    messages: options.messages,
    maxOutputTokens: options.maxOutputTokens ?? MAX_TOKENS,
  })
}
