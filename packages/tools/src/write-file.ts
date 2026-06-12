import { tool } from "ai"
import { z } from "zod"

export const writeFileTool = tool({
  description:
    "Write content to a file, creating it or overwriting it. Path must be within the working directory.",
  inputSchema: z.object({
    path: z.string().describe("File path relative to the working directory"),
    content: z.string().describe("Content to write"),
  }),
})
