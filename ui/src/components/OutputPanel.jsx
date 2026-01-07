import { useEffect, useRef, useState } from 'react'
import { mockOutput } from '../data/mockOutput'

// Highlight patterns for different log types
const lineConfig = {
  success: 'text-green-400',
  error: 'text-red-400',
  file: 'text-cyan-400',
  info: 'text-white/70',
}

function OutputLine({ line }) {
  const colorClass = lineConfig[line.type] || lineConfig.info

  return (
    <div className={`${colorClass} whitespace-pre-wrap break-all transition-colors duration-150`}>
      {line.text || '\u00A0'}
    </div>
  )
}

function OutputPanel({ lines = mockOutput, onClear }) {
  const containerRef = useRef(null)
  const [autoScroll, setAutoScroll] = useState(true)

  // Auto-scroll to bottom when new lines are added
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [lines, autoScroll])

  // Detect if user scrolls away from bottom
  const handleScroll = () => {
    if (!containerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 20
    setAutoScroll(isAtBottom)
  }

  const handleClear = () => {
    if (onClear) {
      onClear()
    }
  }

  return (
    <div className="relative flex flex-col bg-surface rounded-lg border border-white/10 overflow-hidden transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
        <span className="text-xs font-medium text-white/60 uppercase tracking-wide select-none">
          Output
        </span>
        <button
          onClick={handleClear}
          className="text-xs text-white/40 hover:text-white/70 px-2 py-1 rounded-md hover:bg-white/5 active:bg-white/8 active:scale-[0.98] transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        >
          Clear
        </button>
      </div>

      {/* Output container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto p-4 font-mono text-sm leading-relaxed min-h-[200px] max-h-[400px]"
      >
        {lines.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[180px] text-white/40 select-none">
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
                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm">No output yet</span>
            <span className="text-xs mt-1 text-white/30">Start the loop to see agent logs</span>
          </div>
        ) : (
          lines.map((line) => (
            <OutputLine key={line.id} line={line} />
          ))
        )}
      </div>

      {/* Auto-scroll indicator */}
      {!autoScroll && lines.length > 0 && (
        <button
          onClick={() => {
            setAutoScroll(true)
            if (containerRef.current) {
              containerRef.current.scrollTop = containerRef.current.scrollHeight
            }
          }}
          className="absolute bottom-4 right-4 px-3 py-1.5 text-xs bg-zinc-800 text-white/70 rounded-full border border-white/10 hover:bg-zinc-700 hover:text-white/90 active:bg-zinc-600 active:scale-[0.98] transition-all duration-150 ease-out shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        >
          ↓ Scroll to bottom
        </button>
      )}
    </div>
  )
}

export default OutputPanel
