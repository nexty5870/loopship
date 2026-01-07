import Layout from './components/Layout'
import ControlBar from './components/ControlBar'
import StoryList from './components/StoryList'
import OutputPanel from './components/OutputPanel'
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

  // Use live data when connected, fall back to mock data otherwise
  const stories = liveStories.length > 0 ? liveStories : mockStories
  const outputLines = liveOutput.length > 0 ? liveOutput : mockOutput
  const loopStatus = connected ? liveStatus : 'idle'

  // Calculate current story
  const runningIndex = stories.findIndex((s) => s.status === 'running')
  const currentStory = runningIndex >= 0 ? runningIndex + 1 : 1
  const totalStories = stories.length

  const handleClearOutput = () => {
    clearOutput()
  }

  const handleStart = () => {
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
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-white">
          Dashboard
        </h1>
        <p className="mt-2 text-white/60 text-sm">
          Monitor and control the Ralph loop in real-time.
        </p>

        <section className="mt-6">
          <h2 className="text-sm font-medium text-white/70 mb-3">Stories</h2>
          <StoryList />
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-medium text-white/70 mb-3">Agent Output</h2>
          <OutputPanel lines={outputLines} onClear={handleClearOutput} />
        </section>
      </div>
    </Layout>
  )
}

export default App
