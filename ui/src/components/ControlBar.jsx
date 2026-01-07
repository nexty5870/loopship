import { useEffect } from 'react'

function ControlBar({ status, currentStory, totalStories, onStart, onStop }) {
  // Keyboard shortcut: Cmd+Enter or Ctrl+Enter to start
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        if (status === 'idle') {
          onStart()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [status, onStart])

  const getStatusText = () => {
    switch (status) {
      case 'running':
        return `Running Story ${currentStory}/${totalStories}`
      case 'complete':
        return 'Complete'
      default:
        return 'Idle'
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'running':
        return 'text-amber-500'
      case 'complete':
        return 'text-green-500'
      default:
        return 'text-white/50'
    }
  }

  return (
    <div className="h-12 flex items-center justify-between px-6 border-b border-white/10 bg-white/[0.02]">
      {/* Status indicator */}
      <div className="flex items-center gap-3">
        <div className={`text-sm font-medium ${getStatusColor()}`}>
          {status === 'running' && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse mr-2" />
          )}
          {getStatusText()}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {status === 'running' ? (
          <button
            onClick={onStop}
            className="px-3 py-1.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
          >
            Stop
          </button>
        ) : (
          <button
            onClick={onStart}
            disabled={status === 'complete'}
            className={`
              px-3 py-1.5 text-sm font-medium rounded transition-colors
              ${status === 'complete'
                ? 'text-white/30 cursor-not-allowed'
                : 'text-amber-500 hover:text-amber-400 hover:bg-amber-500/10'
              }
            `}
          >
            Start
            <span className="ml-2 text-xs text-white/30">⌘↵</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default ControlBar
