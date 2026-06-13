import { hc } from "hono/client"
import type { AppType } from "@lightcode/server"
import { StreamChunk, type FinalizeSessionRequest } from "@lightcode/shared"

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(`HTTP ${status}`)
    this.name = "HttpError"
  }
}

export type ClientOptions = {
  baseUrl?: string
  fetch?: typeof fetch
}

async function safeJson(res: { json(): Promise<unknown> }): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    return null
  }
}

export function createClient(opts: ClientOptions = {}) {
  const baseUrl = opts.baseUrl ?? process.env.API_URL ?? "http://localhost:3000"
  const f = opts.fetch ?? fetch
  const rpc = hc<AppType>(baseUrl, { fetch: f })

  return {
    health: async () => {
      const res = await rpc.health.$get()
      if (!res.ok) throw new HttpError(res.status, await safeJson(res))
      return res.json()
    },

    streamGenerate: async function* (
      messages: unknown[],
      options?: { signal?: AbortSignal }
    ): AsyncGenerator<StreamChunk> {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 60000)

      if (options?.signal) {
        options.signal.addEventListener("abort", () => ctrl.abort(), { once: true })
      }

      const url = rpc.generate.$url().href

      try {
        const res = await f(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages }),
          signal: ctrl.signal,
        })
        clearTimeout(timer)
        if (!res.ok) throw new HttpError(res.status, await safeJson(res))
        if (!res.body) throw new Error("No response body")

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() ?? ""

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed) continue
            try {
              yield StreamChunk.parse(JSON.parse(trimmed))
            } catch {
              // skip malformed lines
            }
          }
        }

        if (buffer.trim()) {
          try {
            yield StreamChunk.parse(JSON.parse(buffer.trim()))
          } catch {
            // skip
          }
        }
      } catch (err) {
        clearTimeout(timer)
        throw err
      }
    },

    finalizeSession: async (params: FinalizeSessionRequest) => {
      const res = await rpc.sessions.finalize.$post({ json: params })
      if (!res.ok) throw new HttpError(res.status, await safeJson(res))
      return res.json()
    },

    listSessions: async () => {
      const res = await rpc.sessions.$get()
      if (!res.ok) throw new HttpError(res.status, await safeJson(res))
      return res.json()
    },

    getSession: async (id: string) => {
      const res = await rpc.sessions[":id"].$get({ param: { id } })
      if (!res.ok) throw new HttpError(res.status, await safeJson(res))
      return res.json()
    },
  }
}

export type ApiClient = ReturnType<typeof createClient>
