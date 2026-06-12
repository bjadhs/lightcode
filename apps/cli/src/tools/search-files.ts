import { guardPath } from "./guard"
import { Glob } from "bun"

export async function searchFiles({
  pattern,
  searchType,
  fileGlob,
}: {
  pattern: string
  searchType: "glob" | "content"
  fileGlob?: string
}): Promise<string> {
  const cwd = process.cwd()

  if (searchType === "glob") {
    const glob = new Glob(pattern)
    const matches: string[] = []
    for await (const file of glob.scan({ cwd, dot: true })) {
      matches.push(file)
    }
    return matches.length > 0 ? matches.join("\n") : "No files found"
  }

  // content search: find matching files then grep
  const globPat = fileGlob ?? "**/*"
  const fileGlobObj = new Glob(globPat)
  const regex = new RegExp(pattern)
  const results: string[] = []

  for await (const relPath of fileGlobObj.scan({ cwd, dot: true })) {
    try {
      guardPath(relPath)
      const file = Bun.file(`${cwd}/${relPath}`)
      const stat = await file.exists()
      if (!stat) continue

      const text = await file.text()
      const lines = text.split("\n")
      for (let i = 0; i < lines.length; i++) {
        if (regex.test(lines[i]!)) {
          results.push(`${relPath}:${i + 1}: ${lines[i]}`)
        }
      }
    } catch {
      // skip unreadable files
    }
  }

  return results.length > 0 ? results.slice(0, 200).join("\n") : "No matches found"
}
