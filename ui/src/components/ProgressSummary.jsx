import { useState, useEffect, useRef } from 'react'

// Format duration in seconds to human-readable string
function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return '--'

  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)

  if (mins === 0) {
    return `${secs}s`
  }
  return `${mins}m ${secs}s`
}

// Calculate estimated remaining time based on average story duration
function estimateRemaining(completedCount, totalCount, elapsedSeconds) {
  if (completedCount === 0 || completedCount >= totalCount) return null

  const avgTimePerStory = elapsedSeconds / completedCount
  const remaining = (totalCount - completedCount) * avgTimePerStory
  return Math.round(remaining)
}

function ProgressSummary({ stories = [], status = 'idle', startTime = null }) {
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef(null)

  // Count completed stories (passed or failed)
  const completedCount = stories.filter(
    (s) => s.status === 'passed' || s.status === 'failed'
  ).length
  const totalCount = stories.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  // Update elapsed time every second when running
  useEffect(() => {
    if (status === 'running' && startTime) {
      // Initial calculation
      setElapsed(Math.floor((Date.now() - startTime) / 1000))

      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
    } else if (status === 'idle') {
      setElapsed(0)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [status, startTime])

  const estimatedRemaining = estimateRemaining(completedCount, totalCount, elapsed)

  // Show empty state when no stories
  if (totalCount === 0) {
    return (
      <div className="bg-white/[0.02] border border-white/10 rounded-lg p-4">
        <div className="flex items-center justify-center py-4 text-white/40 text-sm">
          Waiting for stories...
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-white/5 rounded-full" style={{ width: '0%' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-lg p-4 transition-colors duration-200">
      {/* Header with stats */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4">
          {/* Completion count */}
          <div className="text-sm">
            <span className="text-white font-medium transition-colors duration-150">{completedCount}</span>
            <span className="text-white/50">/{totalCount} stories</span>
          </div>

          {/* Elapsed time */}
          <div className="text-sm text-white/50">
            <span className="text-white/70">Elapsed:</span>{' '}
            <span className="text-white font-mono tabular-nums transition-colors duration-150">{formatDuration(elapsed)}</span>
          </div>

          {/* Estimated remaining */}
          {status === 'running' && estimatedRemaining !== null && (
            <div className="text-sm text-white/50 transition-opacity duration-200">
              <span className="text-white/70">Est. remaining:</span>{' '}
              <span className="text-white/60 font-mono tabular-nums">
                ~{formatDuration(estimatedRemaining)}
              </span>
            </div>
          )}
        </div>

        {/* Percentage */}
        <span className="text-sm text-white/50 font-mono tabular-nums transition-colors duration-150">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-500 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export default ProgressSummary
