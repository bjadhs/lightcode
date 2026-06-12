import { guardPath } from "./guard"
import { readdir } from "fs/promises"

export async function listDirectory({ path: p }: { path: string }): Promise<string> {
  const resolved = guardPath(p)
  const entries = await readdir(resolved, { withFileTypes: true })
  const lines = entries.map((e) => (e.isDirectory() ? `${e.name}/` : e.name))
  return lines.join("\n") || "(empty directory)"
}
