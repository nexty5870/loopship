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
        <div className={`text-sm font-medium transition-all duration-200 ease-out ${getStatusColor()}`}>
          {status === 'running' && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse mr-2 align-middle" />
          )}
          {getStatusText()}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {status === 'running' ? (
          <button
            onClick={onStop}
            className="px-3 py-1.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 active:bg-red-500/15 active:scale-[0.98] rounded-md transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50"
          >
            Stop
          </button>
        ) : (
          <button
            onClick={onStart}
            disabled={status === 'complete'}
            className={`
              px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150 ease-out
              focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50
              ${status === 'complete'
                ? 'text-white/30 cursor-not-allowed'
                : 'text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 active:bg-amber-500/15 active:scale-[0.98]'
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
