import { TextAttributes } from "@opentui/core"

export function About() {
  return (
    <box flexDirection="column" flexGrow={1} padding={2}>
      <text fg="cyan" attributes={TextAttributes.BOLD} marginBottom={1}>
        About
      </text>
      <text>Lightcode — a terminal-native coding assistant.</text>
    </box>
  )
}
