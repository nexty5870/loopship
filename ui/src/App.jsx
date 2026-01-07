import Layout from './components/Layout'
import StoryList from './components/StoryList'

function App() {
  return (
    <Layout>
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
      </div>
    </Layout>
  )
}

export default App
