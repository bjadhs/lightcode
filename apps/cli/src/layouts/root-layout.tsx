import type { KeyEvent } from "@opentui/core"
import { useKeyboard, useRenderer } from "@opentui/react"
import { Outlet } from "react-router"
import { PromptInput } from "../components/prompt-input"

export function RootLayout() {
  const renderer = useRenderer()
  useKeyboard((event: KeyEvent) => {
    if (event.name === "q") renderer.destroy()
  })
  return (
    <box flexDirection="column" flexGrow={1}>
      <box flexGrow={1}>
        <Outlet />
      </box>
      <PromptInput />
    </box>
  )
}
