import { useRef, useState } from "react"
import { useNavigate } from "react-router"
import { useKeyboard, useTerminalDimensions } from "@opentui/react"
import { TextAttributes } from "@opentui/core"
import type { SelectOption, TextareaRenderable } from "@opentui/core"

const ROUTES: SelectOption[] = [
  { name: "Home", description: "Welcome screen", value: "/" },
  { name: "About", description: "About this app", value: "/about" },
  { name: "Settings", description: "App settings", value: "/settings" },
  { name: "Result", description: "Last generation result", value: "/result" },
]

export function PromptInput() {
  const textareaRef = useRef<TextareaRenderable>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const { width } = useTerminalDimensions()
  const navigate = useNavigate()

  useKeyboard((key) => {
    if (key.name === "escape") {
      textareaRef.current?.clear()
      setShowDropdown(false)
    }
  })

  function handleContentChange() {
    const text = textareaRef.current?.plainText ?? ""
    setShowDropdown(text.startsWith("/"))
  }

  function handleSubmit() {
    const value = textareaRef.current?.plainText.trim() ?? ""
    if (!value) return
    if (value.startsWith("/")) {
      navigate(value)
      textareaRef.current?.clear()
      setShowDropdown(false)
      return
    }
    textareaRef.current?.clear()
    setShowDropdown(false)
    navigate("/result", { state: { prompt: value } })
  }

  function handleSelect(_index: number, option: SelectOption | null) {
    if (!option) return
    navigate(String(option.value))
    textareaRef.current?.clear()
    setShowDropdown(false)
  }

  return (
    <box flexDirection="column" gap={1}>
      {showDropdown && (
        <box border borderStyle="rounded" padding={1}>
          <select
            options={ROUTES}
            onSelect={handleSelect}
            focused
            height={6}
            width={width - 8}
          />
        </box>
      )}
      <box border borderStyle="rounded" paddingX={1}>
        <textarea
          ref={textareaRef}
          placeholder="Ask anything…"
          keyBindings={[
            { name: "return", action: "submit" },
            { name: "return", shift: true, action: "newline" },
          ]}
          onSubmit={handleSubmit}
          onContentChange={handleContentChange}
          focused={!showDropdown}
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
