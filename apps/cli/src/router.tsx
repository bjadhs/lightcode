import { createMemoryRouter } from "react-router"
import { RootLayout } from "./layouts/root-layout"
import { About } from "./routes/about"
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
      { path: "*", element: <NotFound /> },
    ],
  },
])
