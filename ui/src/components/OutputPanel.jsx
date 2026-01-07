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
    <div className={`${colorClass} whitespace-pre-wrap break-all`}>
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
    <div className="flex flex-col bg-surface rounded-lg border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <span className="text-xs font-medium text-white/60 uppercase tracking-wide">
          Output
        </span>
        <button
          onClick={handleClear}
          className="text-xs text-white/40 hover:text-white/70 transition-colors px-2 py-1 rounded hover:bg-white/5"
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
        {lines.map((line) => (
          <OutputLine key={line.id} line={line} />
        ))}
      </div>

      {/* Auto-scroll indicator */}
      {!autoScroll && (
        <button
          onClick={() => {
            setAutoScroll(true)
            if (containerRef.current) {
              containerRef.current.scrollTop = containerRef.current.scrollHeight
            }
          }}
          className="absolute bottom-4 right-4 px-3 py-1 text-xs bg-surface-light text-white/70 rounded-full border border-white/10 hover:bg-white/10 transition-colors"
        >
          ↓ Scroll to bottom
        </button>
      )}
    </div>
  )
}

export default OutputPanel
