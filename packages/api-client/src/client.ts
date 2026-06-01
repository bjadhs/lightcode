import { HealthResponse } from "@lightcode/shared"

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
    streamGenerate: async function* (prompt: string): AsyncGenerator<string> {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 30000)
      try {
        const res = await f(`${baseUrl}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
          signal: ctrl.signal,
        })
        clearTimeout(timer)
        if (!res.ok) throw new Error(`POST /generate failed: ${res.status}`)
        if (!res.body) throw new Error("No response body")
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          yield decoder.decode(value, { stream: true })
        }
      } catch (err) {
        clearTimeout(timer)
        throw err
      }
    },
  }
}

export type ApiClient = ReturnType<typeof createClient>
