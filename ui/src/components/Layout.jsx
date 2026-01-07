import { useState } from 'react'

function Sidebar({ isOpen, onToggle }) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-60 bg-background border-r border-white/10
          transform transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-5 border-b border-white/10">
          <span className="text-lg font-semibold text-white">LoopShip</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3">
          <ul className="space-y-1">
            <li>
              <a
                href="#"
                className="block px-3 py-2 text-sm text-white/90 hover:bg-white/5 rounded-md transition-colors"
              >
                Dashboard
              </a>
            </li>
            <li>
              <a
                href="#"
                className="block px-3 py-2 text-sm text-white/60 hover:text-white/90 hover:bg-white/5 rounded-md transition-colors"
              >
                History
              </a>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  )
}

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="h-full flex bg-background">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile header with menu button */}
        <header className="h-14 flex items-center px-4 border-b border-white/10 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 text-white/60 hover:text-white/90 transition-colors"
            aria-label="Open menu"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <span className="ml-3 text-lg font-semibold text-white">LoopShip</span>
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

export default Layout
