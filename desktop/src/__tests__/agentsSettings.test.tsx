import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

import { Settings } from '../pages/Settings'
import { useAgentStore } from '../stores/agentStore'

// Mock the API module so no real HTTP calls are made
vi.mock('../api/agents', () => ({
  agentsApi: {
    list: vi.fn().mockResolvedValue({ agents: [] }),
  },
}))

/** Override fetchAgents to a no-op so useEffect doesn't clobber manually set state */
const noopFetch = vi.fn()

// Mock MarkdownRenderer to avoid pulling in `marked` and CodeViewer deps
vi.mock('../components/markdown/MarkdownRenderer', () => ({
  MarkdownRenderer: ({ content }: { content: string }) => (
    <div data-testid="markdown-renderer">{content}</div>
  ),
}))

// Mock the provider store so ProviderSettings doesn't crash
vi.mock('../stores/providerStore', () => ({
  useProviderStore: () => ({
    providers: [],
    activeId: null,
    isLoading: false,
    fetchProviders: vi.fn(),
    deleteProvider: vi.fn(),
    activateProvider: vi.fn(),
    activateOfficial: vi.fn(),
    testProvider: vi.fn(),
    createProvider: vi.fn(),
    updateProvider: vi.fn(),
    testConfig: vi.fn(),
  }),
}))

// Mock the adapter settings to avoid its side effects
vi.mock('../pages/AdapterSettings', () => ({
  AdapterSettings: () => <div>Adapter Settings Mock</div>,
}))

const MOCK_AGENTS = [
  {
    name: 'code-reviewer',
    description: 'Reviews code for quality and security',
    model: 'claude-sonnet-4-6',
    tools: ['Read', 'Grep', 'Glob'],
    systemPrompt: '# Code Reviewer\n\nYou are an expert code reviewer.',
    color: 'blue',
  },
  {
    name: 'doc-writer',
    description: 'Writes technical documentation',
    model: 'claude-haiku-4-5-20251001',
    systemPrompt: 'You write clear and concise docs.',
    color: 'green',
  },
  {
    name: 'plain-agent',
    description: undefined,
    model: undefined,
    systemPrompt: undefined,
    color: undefined,
  },
]

function switchToAgentsTab() {
  // The Agents tab button has text "Agents"
  const agentsTab = screen.getByText('Agents')
  fireEvent.click(agentsTab)
}

describe('Settings > Agents tab', () => {
  beforeEach(() => {
    // Reset store to default state before each test
    useAgentStore.setState({
      agents: [],
      isLoading: false,
      error: null,
      selectedAgent: null,
    })
  })

  it('renders the Agents tab button in sidebar', () => {
    render(<Settings />)
    expect(screen.getByText('Agents')).toBeInTheDocument()
  })

  it('shows loading spinner when fetching agents', () => {
    useAgentStore.setState({ isLoading: true, agents: [], fetchAgents: noopFetch })
    render(<Settings />)
    switchToAgentsTab()

    expect(screen.getByText('Installed Agents')).toBeInTheDocument()
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('shows empty state when no agents installed', () => {
    useAgentStore.setState({ agents: [], isLoading: false, fetchAgents: noopFetch })
    render(<Settings />)
    switchToAgentsTab()

    expect(screen.getByText('No agents installed yet.')).toBeInTheDocument()
    expect(screen.getByText(/Create .md or .yaml files/)).toBeInTheDocument()
  })

  it('shows error state with retry button when API fails', () => {
    useAgentStore.setState({ agents: [], isLoading: false, error: 'Network error', fetchAgents: noopFetch })
    render(<Settings />)
    switchToAgentsTab()

    expect(screen.getByText('Network error')).toBeInTheDocument()
    expect(screen.getByText('Retry')).toBeInTheDocument()
  })

  it('renders agent list with names and descriptions', () => {
    useAgentStore.setState({ agents: MOCK_AGENTS, isLoading: false, fetchAgents: noopFetch })
    render(<Settings />)
    switchToAgentsTab()

    expect(screen.getByText('code-reviewer')).toBeInTheDocument()
    expect(screen.getByText('Reviews code for quality and security')).toBeInTheDocument()
    expect(screen.getByText('doc-writer')).toBeInTheDocument()
    expect(screen.getByText('Writes technical documentation')).toBeInTheDocument()
    // Agent count badge
    expect(screen.getByText('3 agents')).toBeInTheDocument()
  })

  it('shows model badge for agents with model defined', () => {
    useAgentStore.setState({ agents: MOCK_AGENTS, isLoading: false, fetchAgents: noopFetch })
    render(<Settings />)
    switchToAgentsTab()

    expect(screen.getByText('claude-sonnet-4-6')).toBeInTheDocument()
    expect(screen.getByText('claude-haiku-4-5-20251001')).toBeInTheDocument()
  })

  it('shows "No description" for agents without description', () => {
    useAgentStore.setState({ agents: MOCK_AGENTS, isLoading: false, fetchAgents: noopFetch })
    render(<Settings />)
    switchToAgentsTab()

    expect(screen.getByText('No description')).toBeInTheDocument()
  })

  it('navigates to agent detail view when clicking an agent', () => {
    useAgentStore.setState({ agents: MOCK_AGENTS, isLoading: false, fetchAgents: noopFetch })
    render(<Settings />)
    switchToAgentsTab()

    fireEvent.click(screen.getByText('code-reviewer'))

    // Detail view should show
    expect(screen.getByText('Back to list')).toBeInTheDocument()
    expect(screen.getByText('Reviews code for quality and security')).toBeInTheDocument()
    // Model meta
    expect(screen.getByText(/claude-sonnet-4-6/)).toBeInTheDocument()
    // Tools meta
    expect(screen.getByText(/Read, Grep, Glob/)).toBeInTheDocument()
  })

  it('renders system prompt as Markdown in detail view', () => {
    useAgentStore.setState({ agents: MOCK_AGENTS, isLoading: false, fetchAgents: noopFetch })
    render(<Settings />)
    switchToAgentsTab()

    fireEvent.click(screen.getByText('code-reviewer'))

    const mdRenderer = screen.getByTestId('markdown-renderer')
    expect(mdRenderer).toBeInTheDocument()
    expect(mdRenderer.textContent).toContain('Code Reviewer')
  })

  it('shows "no system prompt" message when agent has no prompt', () => {
    useAgentStore.setState({ agents: MOCK_AGENTS, isLoading: false, fetchAgents: noopFetch })
    render(<Settings />)
    switchToAgentsTab()

    fireEvent.click(screen.getByText('plain-agent'))

    expect(screen.getByText('No system prompt defined.')).toBeInTheDocument()
  })

  it('navigates back to list from detail view', () => {
    useAgentStore.setState({ agents: MOCK_AGENTS, isLoading: false, fetchAgents: noopFetch })
    render(<Settings />)
    switchToAgentsTab()

    // Go to detail
    fireEvent.click(screen.getByText('code-reviewer'))
    expect(screen.getByText('Back to list')).toBeInTheDocument()

    // Go back
    fireEvent.click(screen.getByText('Back to list'))

    // Should see the list again
    expect(screen.getByText('code-reviewer')).toBeInTheDocument()
    expect(screen.getByText('doc-writer')).toBeInTheDocument()
    expect(screen.getByText('plain-agent')).toBeInTheDocument()
  })
})
