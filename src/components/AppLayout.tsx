import { useState } from 'react'
import { PanelLeftClose, PanelLeft } from 'lucide-react'
import Sidebar from './Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="h-screen flex bg-notion-bg dark:bg-notion-bg-dark overflow-hidden">
      {sidebarOpen && <Sidebar />}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center px-3 py-2 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setSidebarOpen(s => !s)}
            className="p-1 rounded text-notion-muted hover:bg-notion-hover dark:hover:bg-notion-hover-dark"
          >
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>
        </div>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
