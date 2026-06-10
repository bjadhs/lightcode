import { createMemoryRouter } from "react-router"
import { RootLayout } from "./layout"
import { About } from "./routes/about"
import { Conversation } from "./routes/conversation"
import { GenerateResult } from "./routes/generate-result"
import { History } from "./routes/history"
import { NotFound } from "./routes/not-found"
import { Settings } from "./routes/settings"
import { Welcome } from "./routes/welcome"

export const router = createMemoryRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Welcome /> },
      { path: "about", element: <About /> },
      { path: "settings", element: <Settings /> },
      { path: "result", element: <GenerateResult /> },
      { path: "history", element: <History /> },
      { path: "conversation/:id", element: <Conversation /> },
      { path: "*", element: <NotFound /> },
    ],
  },
])
