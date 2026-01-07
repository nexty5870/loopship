import { mockStories } from '../data/mockStories'

const statusConfig = {
  pending: {
    color: 'bg-zinc-500',
    pulse: false,
  },
  running: {
    color: 'bg-amber-500',
    pulse: true,
  },
  passed: {
    color: 'bg-green-500',
    pulse: false,
  },
  failed: {
    color: 'bg-red-500',
    pulse: false,
  },
  blocked: {
    color: 'bg-zinc-400',
    pulse: false,
  },
}

// Format duration in seconds to human-readable string
function formatDuration(seconds) {
  if (!seconds) return null

  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)

  if (mins === 0) {
    return `${secs}s`
  }
  return `${mins}m ${secs}s`
}

function StatusDot({ status }) {
  const config = statusConfig[status] || statusConfig.pending

  return (
    <span className="relative flex h-2 w-2 shrink-0">
      {config.pulse && (
        <span
          className={`absolute inline-flex h-full w-full rounded-full ${config.color} opacity-75 animate-ping`}
        />
      )}
      <span className={`relative inline-flex h-2 w-2 rounded-full ${config.color} transition-colors duration-200 ease-out`} />
    </span>
  )
}

function PriorityBadge({ priority }) {
  return (
    <span className="text-xs text-white/40 font-mono tabular-nums shrink-0 transition-opacity duration-200">
      P{priority}
    </span>
  )
}

function StoryItem({ story }) {
  const isPassed = story.status === 'passed'
  const isCompleted = story.status === 'passed' || story.status === 'failed'
  const duration = formatDuration(story.duration)

  return (
    <div
      className={`
        group relative flex items-center gap-3 px-3 py-2.5 rounded-md
        hover:bg-white/5 active:bg-white/8
        transition-all duration-200 ease-out
        ${isPassed ? 'opacity-60' : 'opacity-100'}
      `}
    >
      <StatusDot status={story.status} />
      <span className="text-xs text-white/50 font-mono shrink-0 transition-colors duration-150">
        #{story.id}
      </span>
      <span className="text-sm text-white/90 flex-1 truncate transition-colors duration-150">
        {story.title}
      </span>
      <PriorityBadge priority={story.priority} />

      {/* Duration tooltip on hover for completed stories */}
      {isCompleted && duration && (
        <span
          className="
            absolute right-0 top-1/2 -translate-y-1/2 mr-14
            px-2 py-1 text-xs font-mono text-white/80 bg-zinc-800 rounded
            opacity-0 group-hover:opacity-100 transition-opacity duration-150
            pointer-events-none whitespace-nowrap
          "
        >
          {duration}
        </span>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-white/40 select-none">
      <svg
        className="w-8 h-8 mb-3 opacity-50"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
      <span className="text-sm">No stories loaded</span>
      <span className="text-xs mt-1 text-white/30">Connect to start monitoring</span>
    </div>
  )
}

function StoryList({ stories = mockStories }) {
  if (!stories || stories.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="space-y-0.5">
      {stories.map((story) => (
        <StoryItem key={story.id} story={story} />
      ))}
    </div>
  )
}

export default StoryList
