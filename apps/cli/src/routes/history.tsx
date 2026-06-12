import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { TextAttributes } from "@opentui/core"
import { createClient } from "@lightcode/api-client"
import type { SessionResponse } from "@lightcode/shared"

export function History() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<SessionResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSessions() {
      try {
        const client = createClient()
        const data = await client.listSessions()
        setSessions(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setLoading(false)
      }
    }
    fetchSessions()
  }, [])

  function handleSelect(_index: number, option: { name: string; value?: string } | null) {
    if (!option?.value) return
    navigate(`/chat/${option.value}`)
  }

  if (loading) {
    return (
      <box flexGrow={1} justifyContent="center" alignItems="center">
        <text attributes={TextAttributes.DIM}>Loading sessions...</text>
      </box>
    )
  }

  if (error) {
    return (
      <box flexGrow={1} justifyContent="center" alignItems="center" padding={2}>
        <text fg="red">Error: {error}</text>
      </box>
    )
  }

  if (sessions.length === 0) {
    return (
      <box flexGrow={1} justifyContent="center" alignItems="center">
        <text attributes={TextAttributes.DIM}>No sessions yet.</text>
      </box>
    )
  }

  const options = sessions.map((session) => ({
    name: session.title,
    description: new Date(session.updatedAt).toLocaleString(),
    value: session.id,
  }))

  return (
    <box flexDirection="column" flexGrow={1} padding={2} gap={1}>
      <text fg="cyan" attributes={TextAttributes.BOLD}>
        Session History
      </text>
      <box flexGrow={1}>
        <select
          options={options}
          onSelect={handleSelect}
          focused
          height={20}
          showScrollIndicator
        />
      </box>
      <text attributes={TextAttributes.DIM}>
        Press Enter to open a session
      </text>
    </box>
  )
}
