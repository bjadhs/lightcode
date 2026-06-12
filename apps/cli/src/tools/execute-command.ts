export async function executeCommand({
  command,
}: {
  command: string
}): Promise<string> {
  const proc = Bun.spawn(["sh", "-c", command], {
    cwd: process.cwd(),
    stdout: "pipe",
    stderr: "pipe",
  })

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ])

  const out = [stdout, stderr].filter(Boolean).join("\n").trim()
  return `Exit ${exitCode}\n${out || "(no output)"}`
}
