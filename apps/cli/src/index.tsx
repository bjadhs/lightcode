import { createCliRenderer } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { RouterProvider } from "react-router"
import { router } from "./router"

function App() {
  return <RouterProvider router={router} />
}

const renderer = await createCliRenderer({ exitOnCtrlC: true })
createRoot(renderer).render(<App />)
