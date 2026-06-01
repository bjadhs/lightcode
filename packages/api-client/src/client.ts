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
  }
}

export type ApiClient = ReturnType<typeof createClient>
