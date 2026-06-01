import { useRef } from "react"
import { useNavigate } from "react-router"
import { useKeyboard, useTerminalDimensions } from "@opentui/react"
import { TextAttributes } from "@opentui/core"
import type { TextareaRenderable } from "@opentui/core"

export function PromptInput() {
  const textareaRef = useRef<TextareaRenderable>(null)
  const { width } = useTerminalDimensions()
  const navigate = useNavigate()

  useKeyboard((key) => {
    if (key.name === "escape") {
      textareaRef.current?.clear()
    }
  })

  function handleSubmit() {
    const value = textareaRef.current?.plainText.trim() ?? ""
    if (value.startsWith("/")) {
      navigate(value)
      textareaRef.current?.clear()
    }
  }

  return (
    <box flexDirection="column" gap={1}>
      <box border borderStyle="rounded" paddingX={1}>
        <textarea
          ref={textareaRef}
          placeholder="Ask anything…"
          keyBindings={[
            { name: "return", action: "submit" },
            { name: "return", shift: true, action: "newline" },
          ]}
          onSubmit={handleSubmit}
          focused
          width={width - 8}
          height={3}
          wrapMode="word"
        />
      </box>
      <box flexDirection="row" gap={3}>
        <text attributes={TextAttributes.DIM}>↵ submit</text>
        <text attributes={TextAttributes.DIM}>shift+↵ new line</text>
        <text attributes={TextAttributes.DIM}>esc clear</text>
        <text attributes={TextAttributes.DIM}>ctrl+c quit</text>
      </box>
    </box>
  )
}
