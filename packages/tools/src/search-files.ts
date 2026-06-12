import { tool } from "ai"
import { z } from "zod"

export const searchFilesTool = tool({
  description:
    'Search for files by glob pattern, or grep for a regex pattern inside files. Use searchType "glob" to find files by name, "content" to search inside files.',
  inputSchema: z.object({
    pattern: z
      .string()
      .describe(
        'Glob pattern (e.g. "src/**/*.ts") for glob search, or regex string for content search'
      ),
    searchType: z
      .enum(["glob", "content"])
      .describe('"glob" finds files by path pattern; "content" greps inside files'),
    fileGlob: z
      .string()
      .optional()
      .describe(
        'When searchType is "content", limit search to files matching this glob (e.g. "**/*.ts")'
      ),
  }),
})
