import { Hono } from "hono"
import { logger } from "hono/logger"
import { cors } from "hono/cors"
import generate from "./routes/generate"
import sessions from "./routes/sessions"
import { notFound, errorHandler } from "./lib/middleware"

const app = new Hono()
app.use(logger())
app.use("/*", cors())
app.notFound(notFound)
app.onError(errorHandler)

// Chain route registrations so TypeScript captures the route types in AppType
const routes = app
  .get("/", (c) => c.json({ message: "Hello from Lightcode API", ok: true }))
  .get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }))
  .route("/generate", generate)
  .route("/sessions", sessions)

export type AppType = typeof routes

export default {
  port: Number(process.env.PORT ?? 3000),
  fetch: app.fetch,
}

console.log(`Server running on http://localhost:${process.env.PORT ?? 3000}`)
