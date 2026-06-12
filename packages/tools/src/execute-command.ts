import { tool } from "ai"
import { z } from "zod"

export const executeCommandTool = tool({
  description:
    "Run a shell command in the working directory. Use for git, bun, file operations, or any CLI task. Stdout and stderr are returned.",
  inputSchema: z.object({
    command: z.string().describe("Shell command to execute"),
  }),
})
