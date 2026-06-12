import { tool } from "ai"
import { z } from "zod"

export const readFileTool = tool({
  description:
    "Read the full contents of a file. Path must be within the working directory.",
  inputSchema: z.object({
    path: z.string().describe("File path relative to the working directory"),
  }),
})
