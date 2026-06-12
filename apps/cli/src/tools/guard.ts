import path from "path"

export function guardPath(p: string): string {
  const cwd = process.cwd()
  const resolved = path.resolve(cwd, p)
  if (resolved !== cwd && !resolved.startsWith(cwd + path.sep)) {
    throw new Error(`Access denied: '${p}' escapes the working directory`)
  }
  return resolved
}
