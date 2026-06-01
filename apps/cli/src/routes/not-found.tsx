import { TextAttributes } from "@opentui/core"

export function NotFound() {
  return (
    <box flexGrow={1} alignItems="center" justifyContent="center">
      <box flexDirection="column" alignItems="center" gap={1}>
        <text fg="red" attributes={TextAttributes.BOLD}>
          Unknown command
        </text>
        <text attributes={TextAttributes.DIM}>Type /about or /settings to navigate</text>
      </box>
    </box>
  )
}
