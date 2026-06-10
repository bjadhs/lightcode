import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { TextAttributes } from "@opentui/core"
import { createClient } from "@lightcode/api-client"
import type { ConversationResponse } from "@lightcode/shared"

export function History() {
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<ConversationResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchConversations() {
      try {
        const client = createClient()
        const data = await client.listConversations()
        setConversations(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setLoading(false)
      }
    }
    fetchConversations()
  }, [])

  function handleSelect(_index: number, option: { name: string; value?: string } | null) {
    if (!option?.value) return
    navigate(`/conversation/${option.value}`)
  }

  if (loading) {
    return (
      <box flexGrow={1} justifyContent="center" alignItems="center">
        <text attributes={TextAttributes.DIM}>Loading conversations...</text>
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

  if (conversations.length === 0) {
    return (
      <box flexGrow={1} justifyContent="center" alignItems="center">
        <text attributes={TextAttributes.DIM}>No conversations yet.</text>
      </box>
    )
  }

  const options = conversations.map((conv) => ({
    name: conv.title,
    description: new Date(conv.updatedAt).toLocaleString(),
    value: conv.id,
  }))

  return (
    <box flexDirection="column" flexGrow={1} padding={2} gap={1}>
      <text fg="cyan" attributes={TextAttributes.BOLD}>
        Conversation History
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
        Press Enter to open a conversation
      </text>
    </box>
  )
}
