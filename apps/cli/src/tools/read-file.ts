import { guardPath } from "./guard"

export async function readFile({ path: p }: { path: string }): Promise<string> {
  const resolved = guardPath(p)
  const file = Bun.file(resolved)
  if (!(await file.exists())) {
    throw new Error(`File not found: ${p}`)
  }
  return await file.text()
}
