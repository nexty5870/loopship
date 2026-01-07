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
    <span className="relative flex h-2 w-2">
      {config.pulse && (
        <span
          className={`absolute inline-flex h-full w-full rounded-full ${config.color} opacity-75 animate-ping`}
        />
      )}
      <span className={`relative inline-flex h-2 w-2 rounded-full ${config.color}`} />
    </span>
  )
}

function PriorityBadge({ priority }) {
  return (
    <span className="text-xs text-white/40 font-mono">
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
        group relative flex items-center gap-3 px-3 py-2 rounded-md
        hover:bg-white/5 transition-colors
        ${isPassed ? 'opacity-60' : ''}
      `}
    >
      <StatusDot status={story.status} />
      <span className="text-xs text-white/50 font-mono shrink-0">
        #{story.id}
      </span>
      <span className="text-sm text-white/90 flex-1 truncate">
        {story.title}
      </span>
      <PriorityBadge priority={story.priority} />

      {/* Duration tooltip on hover for completed stories */}
      {isCompleted && duration && (
        <span
          className="
            absolute right-0 top-1/2 -translate-y-1/2 mr-14
            px-2 py-1 text-xs font-mono text-white/80 bg-zinc-800 rounded
            opacity-0 group-hover:opacity-100 transition-opacity
            pointer-events-none whitespace-nowrap
          "
        >
          {duration}
        </span>
      )}
    </div>
  )
}

function StoryList({ stories = mockStories }) {
  return (
    <div className="space-y-1">
      {stories.map((story) => (
        <StoryItem key={story.id} story={story} />
      ))}
    </div>
  )
}

export default StoryList
