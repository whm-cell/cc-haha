import { create } from 'zustand'
import { agentsApi, type AgentDefinition } from '../api/agents'

type AgentStore = {
  agents: AgentDefinition[]
  isLoading: boolean
  error: string | null
  selectedAgent: AgentDefinition | null

  fetchAgents: () => Promise<void>
  selectAgent: (agent: AgentDefinition | null) => void
}

export const useAgentStore = create<AgentStore>((set) => ({
  agents: [],
  isLoading: false,
  error: null,
  selectedAgent: null,

  fetchAgents: async () => {
    set({ isLoading: true, error: null })
    try {
      const { agents } = await agentsApi.list()
      set({ agents, isLoading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load agents'
      set({ isLoading: false, error: message })
    }
  },

  selectAgent: (agent) => set({ selectedAgent: agent }),
}))
