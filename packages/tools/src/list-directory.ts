import { tool } from "ai"
import { z } from "zod"

export const listDirectoryTool = tool({
  description:
    'List the files and subdirectories in a directory. Use "." for the working directory.',
  inputSchema: z.object({
    path: z
      .string()
      .describe(
        'Directory path relative to the working directory. Use "." for root.'
      ),
  }),
})
