import { tool } from "ai"
import { z } from "zod"

export const editFileTool = tool({
  description:
    "Replace the first occurrence of old_str with new_str in a file. old_str must be an exact, unique string in the file.",
  inputSchema: z.object({
    path: z.string().describe("File path relative to the working directory"),
    old_str: z
      .string()
      .describe("Exact string to replace — must appear exactly once in the file"),
    new_str: z.string().describe("Replacement string"),
  }),
})
