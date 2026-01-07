// Mock stories for testing StoryList component
// Statuses: pending, running, passed, failed, blocked
// Duration is in seconds (only for completed stories)

export const mockStories = [
  {
    id: '1',
    title: 'Project scaffold with Vite + React + Tailwind',
    status: 'passed',
    priority: 1,
    duration: 45,
  },
  {
    id: '2',
    title: 'Layout shell with sidebar and main panel',
    status: 'passed',
    priority: 2,
    duration: 127,
  },
  {
    id: '3',
    title: 'Story list component with status indicators',
    status: 'running',
    priority: 3,
    duration: null,
  },
  {
    id: '4',
    title: 'Output panel with monospace log',
    status: 'pending',
    priority: 4,
    duration: null,
  },
  {
    id: '5',
    title: 'Control bar with Start/Stop buttons',
    status: 'failed',
    priority: 5,
    duration: 89,
  },
]
