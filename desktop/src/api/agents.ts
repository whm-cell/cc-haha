import { api } from './client'

export type AgentDefinition = {
  name: string
  description?: string
  model?: string
  tools?: string[]
  systemPrompt?: string
  color?: string
}

export const agentsApi = {
  list: () => api.get<{ agents: AgentDefinition[] }>('/api/agents'),
}
