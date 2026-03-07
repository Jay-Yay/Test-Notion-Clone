import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronRight, ChevronDown, Plus, FileText, Columns, Table, MoreHorizontal } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { usePages } from '../hooks/usePages'
import { Page, PageType } from '../types'
import clsx from 'clsx'

const pageIcon = (type: PageType) => {
  if (type === 'kanban') return <Columns className="w-4 h-4" />
  if (type === 'table') return <Table className="w-4 h-4" />
  return <FileText className="w-4 h-4" />
}

function PageItem({ page, pages, depth = 0 }: { page: Page; pages: Page[]; depth?: number }) {
  const { id } = useParams()
  const { deletePage, createPage } = usePages()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const children = pages.filter(p => p.parent_id === page.id)
  const isActive = id === page.id

  const handleNewSubpage = async () => {
    const newPage = await createPage('note', page.id)
    if (newPage) navigate(`/page/${newPage.id}`)
  }

  return (
    <div>
      <div
        className={clsx(
          'group flex items-center gap-1 px-2 py-1 rounded text-sm cursor-pointer select-none',
          isActive ? 'bg-notion-hover dark:bg-notion-hover-dark' : 'hover:bg-notion-hover dark:hover:bg-notion-hover-dark',
          'text-notion-text dark:text-notion-text-dark'
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        <button onClick={() => setExpanded(e => !e)} className="flex-shrink-0 text-notion-muted">
          {children.length > 0 ? (expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />) : <span className="w-3" />}
        </button>
        <Link to={`/page/${page.id}`} className="flex items-center gap-1.5 flex-1 min-w-0">
          {page.icon ? <span>{page.icon}</span> : pageIcon(page.type)}
          <span className="truncate">{page.title || 'Untitled'}</span>
        </Link>
        <div className="hidden group-hover:flex items-center gap-0.5">
          <button onClick={handleNewSubpage} className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-notion-muted">
            <Plus className="w-3.5 h-3.5" />
          </button>
          <div className="relative">
            <button onClick={() => setMenuOpen(m => !m)} className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-notion-muted">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            {menuOpen && (
              <div className="absolute left-0 top-6 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg py-1 min-w-[140px]">
                <button
                  onClick={() => { deletePage(page.id); setMenuOpen(false) }}
                  className="w-full text-left px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {expanded && children.map(child => (
        <PageItem key={child.id} page={child} pages={pages} depth={depth + 1} />
      ))}
    </div>
  )
}

export default function Sidebar() {
  const { profile } = useAuth()
  const { pages, loading, createPage } = usePages()
  const navigate = useNavigate()
  const rootPages = pages.filter(p => !p.parent_id)

  const handleNewPage = async () => {
    const page = await createPage('note')
    if (page) navigate(`/page/${page.id}`)
  }

  return (
    <div className="w-60 h-full flex flex-col bg-notion-sidebar dark:bg-notion-sidebar-dark border-r border-gray-200 dark:border-gray-800">
      {/* User */}
      <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2 text-sm font-medium text-notion-text dark:text-notion-text-dark">
          {profile?.avatar_url
            ? <img src={profile.avatar_url} className="w-6 h-6 rounded-full" alt="" />
            : <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs">{profile?.full_name?.[0] ?? '?'}</div>
          }
          <span className="truncate">{profile?.full_name ?? 'Workspace'}</span>
        </div>
      </div>

      {/* Pages */}
      <div className="flex-1 overflow-y-auto py-2 px-1">
        {loading ? (
          <div className="px-3 py-2 text-xs text-notion-muted">Loading...</div>
        ) : rootPages.length === 0 ? (
          <div className="px-3 py-2 text-xs text-notion-muted">No pages yet</div>
        ) : (
          rootPages.map(page => <PageItem key={page.id} page={page} pages={pages} />)
        )}
      </div>

      {/* New page */}
      <div className="px-2 py-2 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={handleNewPage}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-notion-muted hover:text-notion-text dark:hover:text-notion-text-dark hover:bg-notion-hover dark:hover:bg-notion-hover-dark rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
          New page
        </button>
      </div>
    </div>
  )
}
