import Layout from './components/Layout'

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
      </div>
    </Layout>
  )
}

export default App
