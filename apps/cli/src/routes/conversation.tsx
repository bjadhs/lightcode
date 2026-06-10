import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router"
import { TextAttributes } from "@opentui/core"
import { useTerminalDimensions } from "@opentui/react"
import { createClient } from "@lightcode/api-client"
import type { ConversationDetailResponse } from "@lightcode/shared"

export function Conversation() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { width } = useTerminalDimensions()
  const [conversation, setConversation] = useState<ConversationDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Industry-standard responsive width: full width with margins on small screens,
  // capped at 100 cols on larger screens (max-width container pattern)
  const containerWidth = Math.min(width - 8, 100)

  useEffect(() => {
    async function fetchConversation() {
      if (!id) return
      try {
        const client = createClient()
        const data = await client.getConversation(id)
        setConversation(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setLoading(false)
      }
    }
    fetchConversation()
  }, [id])

  if (loading) {
    return (
      <box flexGrow={1} justifyContent="center" alignItems="center">
        <text attributes={TextAttributes.DIM}>Loading conversation...</text>
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

  if (!conversation) {
    return (
      <box flexGrow={1} justifyContent="center" alignItems="center">
        <text attributes={TextAttributes.DIM}>Conversation not found.</text>
      </box>
    )
  }

  return (
    <box flexDirection="column" flexGrow={1} alignItems="center" paddingY={2}>
      <box flexDirection="column" width={containerWidth} gap={1}>
        <box flexDirection="row" justifyContent="space-between" alignItems="center">
          <text fg="cyan" attributes={TextAttributes.BOLD}>
            {conversation.title}
          </text>
          <text attributes={TextAttributes.DIM}>
            {new Date(conversation.createdAt).toLocaleString()}
          </text>
        </box>
        <box flexGrow={1} flexDirection="column" gap={1}>
          {conversation.messages.map((message) => (
            <box
              key={message.id}
              flexDirection="row"
              flexGrow={1}
            >
              <box
                width={1}
                backgroundColor={message.role === "user" ? "#4FC3F7" : "#666666"}
              />
              <box
                flexGrow={1}
                flexDirection="column"
                paddingX={1}
                paddingY={1}
                backgroundColor={message.role === "user" ? "#333333" : "#2d3748"}
              >
                <box flexDirection="row" gap={1} marginBottom={1}>
                  <text
                    fg={message.role === "user" ? "#4FC3F7" : "#e2e8f0"}
                    attributes={TextAttributes.BOLD}
                  >
                    {message.role === "user" ? "You" : "Assistant"}
                  </text>
                </box>
                <text wrapMode="word" fg={message.role === "assistant" ? "#e2e8f0" : undefined}>
                  {message.content}
                </text>
              </box>
            </box>
          ))}
        </box>
        <box flexDirection="row" gap={3}>
          <text attributes={TextAttributes.DIM}>↵ continue conversation</text>
          <text attributes={TextAttributes.DIM}>esc go back</text>
        </box>
      </box>
    </box>
  )
}
