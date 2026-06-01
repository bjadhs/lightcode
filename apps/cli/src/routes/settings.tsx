import { TextAttributes } from "@opentui/core"

export function Settings() {
  return (
    <box flexDirection="column" flexGrow={1} padding={2}>
      <text fg="cyan" attributes={TextAttributes.BOLD} marginBottom={1}>
        Settings
      </text>
      <text attributes={TextAttributes.DIM}>No settings yet.</text>
    </box>
  )
}
