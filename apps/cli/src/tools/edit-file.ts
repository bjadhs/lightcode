import { guardPath } from "./guard"

export async function editFile({
  path: p,
  old_str,
  new_str,
}: {
  path: string
  old_str: string
  new_str: string
}): Promise<string> {
  const resolved = guardPath(p)
  const file = Bun.file(resolved)
  if (!(await file.exists())) {
    throw new Error(`File not found: ${p}`)
  }

  const content = await file.text()
  const count = content.split(old_str).length - 1

  if (count === 0) {
    throw new Error(`old_str not found in ${p}`)
  }
  if (count > 1) {
    throw new Error(`old_str appears ${count} times in ${p} — must be unique`)
  }

  await Bun.write(resolved, content.replace(old_str, new_str))
  return `Edited ${p}`
}
