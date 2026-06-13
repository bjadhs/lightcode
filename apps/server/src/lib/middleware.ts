import { HTTPException } from "hono/http-exception"
import type { Context } from "hono"

export function notFound(c: Context) {
  return c.json({ message: "Not Found" }, 404)
}

export function errorHandler(err: Error, c: Context) {
  if (err instanceof HTTPException) {
    return err.getResponse()
  }
  console.error(err)
  return c.json({ message: "Internal Server Error" }, 500)
}
