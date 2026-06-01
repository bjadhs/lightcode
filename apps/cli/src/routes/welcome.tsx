import { Banner } from "../components/banner"

export function Welcome() {
  return (
    <box flexGrow={1} justifyContent="center" alignItems="center" padding={2}>
      <Banner />
    </box>
  )
}
