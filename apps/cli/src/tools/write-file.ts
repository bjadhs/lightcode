import { guardPath } from "./guard"

export async function writeFile({
  path: p,
  content,
}: {
  path: string
  content: string
}): Promise<string> {
  const resolved = guardPath(p)
  await Bun.write(resolved, content)
  return `Written ${content.length} bytes to ${p}`
}
