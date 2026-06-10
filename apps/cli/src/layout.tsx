import { TextAttributes } from "@opentui/core"
import { Outlet, useLocation } from "react-router"
import { PromptInput } from "./components/prompt-input"

export function RootLayout() {
  const location = useLocation()
  return (
    <box flexDirection="column" flexGrow={1}>
      <box height={1} paddingX={1} justifyContent="flex-start" alignItems="center">
        <text attributes={TextAttributes.DIM}>{location.pathname}</text>
      </box>
      <box flexGrow={1}>
        <Outlet />
      </box>
      <PromptInput />
    </box>
  )
}
