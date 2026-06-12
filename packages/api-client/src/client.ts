import {
  HealthResponse,
  SessionResponse,
  SessionDetailResponse,
  StreamChunk,
  FinalizeSessionResponse,
  type FinalizeSessionRequest,
} from "@lightcode/shared"

export type ClientOptions = {
  baseUrl?: string
  fetch?: typeof fetch
}

export function createClient(opts: ClientOptions = {}) {
  const baseUrl = opts.baseUrl ?? process.env.API_URL ?? "http://localhost:3000"
  const f = opts.fetch ?? fetch

  return {
    health: async (): Promise<HealthResponse> => {
      const res = await f(`${baseUrl}/health`)
      if (!res.ok) throw new Error(`GET /health failed: ${res.status}`)
      return HealthResponse.parse(await res.json())
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

      try {
        const res = await f(`${baseUrl}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages }),
          signal: ctrl.signal,
        })
        clearTimeout(timer)
        if (!res.ok) throw new Error(`POST /generate failed: ${res.status}`)
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

        // flush remaining buffer
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

    finalizeSession: async (
      params: FinalizeSessionRequest
    ): Promise<{ sessionId: string }> => {
      const res = await f(`${baseUrl}/sessions/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      })
      if (!res.ok) throw new Error(`POST /sessions/finalize failed: ${res.status}`)
      return FinalizeSessionResponse.parse(await res.json())
    },

    listSessions: async (): Promise<SessionResponse[]> => {
      const res = await f(`${baseUrl}/sessions`)
      if (!res.ok) throw new Error(`GET /sessions failed: ${res.status}`)
      return SessionResponse.array().parse(await res.json())
    },

    getSession: async (id: string): Promise<SessionDetailResponse> => {
      const res = await f(`${baseUrl}/sessions/${id}`)
      if (!res.ok) throw new Error(`GET /sessions/${id} failed: ${res.status}`)
      return SessionDetailResponse.parse(await res.json())
    },
  }
}

export type ApiClient = ReturnType<typeof createClient>
