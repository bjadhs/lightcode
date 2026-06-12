import { createMemoryRouter } from "react-router"
import { RootLayout } from "./layout"
import { Chat } from "./routes/chat"
import { History } from "./routes/history"
import { Welcome } from "./routes/welcome"

export const router = createMemoryRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Welcome /> },
      { path: "chat", element: <Chat /> },
      { path: "chat/:id", element: <Chat /> },
      { path: "history", element: <History /> },
    ],
  },
])
