import { useState, useEffect, useRef } from 'react'
import Layout from './components/Layout'
import ControlBar from './components/ControlBar'
import StoryList from './components/StoryList'
import OutputPanel from './components/OutputPanel'
import ProgressSummary from './components/ProgressSummary'
import { useLoopSocket } from './hooks/useLoopSocket'
import { mockOutput } from './data/mockOutput'
import { mockStories } from './data/mockStories'

function App() {
  // WebSocket connection for live updates
  const {
    connected,
    stories: liveStories,
    output: liveOutput,
    status: liveStatus,
    startLoop,
    stopLoop,
    clearOutput
  } = useLoopSocket()

  // Track when the loop started for elapsed time calculation
  const [loopStartTime, setLoopStartTime] = useState(null)
  const prevStatus = useRef(null)

  // Use live data when connected, fall back to mock data otherwise
  const stories = liveStories.length > 0 ? liveStories : mockStories
  const loopStatus = connected ? liveStatus : 'idle'
  // Show empty output when idle to display the empty state, otherwise use live/mock output
  const outputLines = loopStatus === 'idle' && liveOutput.length === 0
    ? []
    : (liveOutput.length > 0 ? liveOutput : mockOutput)

  // Track loop start time when status changes to running
  useEffect(() => {
    if (loopStatus === 'running' && prevStatus.current !== 'running') {
      setLoopStartTime(Date.now())
    } else if (loopStatus === 'idle' && prevStatus.current !== 'idle') {
      setLoopStartTime(null)
    }
    prevStatus.current = loopStatus
  }, [loopStatus])

  // Calculate current story
  const runningIndex = stories.findIndex((s) => s.status === 'running')
  const currentStory = runningIndex >= 0 ? runningIndex + 1 : 1
  const totalStories = stories.length

  const handleClearOutput = () => {
    clearOutput()
  }

  const handleStart = () => {
    setLoopStartTime(Date.now())
    startLoop()
  }

  const handleStop = () => {
    stopLoop()
  }

  return (
    <Layout connected={connected}>
      <ControlBar
        status={loopStatus}
        currentStory={currentStory}
        totalStories={totalStories}
        onStart={handleStart}
        onStop={handleStop}
      />
      <div className="p-6 space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Dashboard
          </h1>
          <p className="mt-1.5 text-white/60 text-sm">
            Monitor and control story implementation in real-time.
          </p>
        </header>

        <section>
          <h2 className="text-xs font-medium text-white/50 uppercase tracking-wide mb-3">Progress</h2>
          <ProgressSummary
            stories={stories}
            status={loopStatus}
            startTime={loopStartTime}
          />
        </section>

        <section>
          <h2 className="text-xs font-medium text-white/50 uppercase tracking-wide mb-3">Stories</h2>
          <StoryList stories={stories} />
        </section>

        <section>
          <h2 className="text-xs font-medium text-white/50 uppercase tracking-wide mb-3">Output</h2>
          <OutputPanel lines={outputLines} onClear={handleClearOutput} />
        </section>
      </div>
    </Layout>
  )
}

export default App
