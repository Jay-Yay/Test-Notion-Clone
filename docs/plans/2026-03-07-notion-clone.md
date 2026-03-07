# Notion Clone Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a multi-user Notion-like web app with rich text notes, kanban boards, and tables, backed by Supabase.

**Architecture:** React SPA communicates directly with Supabase via its JS client for auth, database, realtime, and storage. Pages are the core unit with a `type` field determining which editor renders. Supabase Row-Level Security enforces auth at the DB level.

**Tech Stack:** Vite, React 18, TypeScript, TailwindCSS, Tiptap, dnd-kit, TanStack Table, Supabase JS client, Vitest, React Testing Library, Vercel

---

## Prerequisites

Before starting:
1. Create a free [Supabase](https://supabase.com) project. Note your **Project URL** and **anon key** from Settings → API.
2. Enable Google and GitHub OAuth in Supabase → Authentication → Providers. Follow their docs to get OAuth credentials from Google Cloud Console and GitHub Developer Settings. Set callback URL to `http://localhost:5173` for dev.
3. Have Node.js 18+ and npm installed.

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `src/main.tsx`, `src/App.tsx`, `src/index.css`
- Create: `src/lib/supabase.ts`
- Create: `.env.local`

**Step 1: Scaffold the Vite project**

```bash
npm create vite@latest . -- --template react-ts
npm install
```

**Step 2: Install all dependencies**

```bash
npm install @supabase/supabase-js @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-placeholder @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @tanstack/react-table react-router-dom lucide-react clsx

npm install -D tailwindcss postcss autoprefixer vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event

npx tailwindcss init -p
```

**Step 3: Configure Tailwind — replace `tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      colors: {
        notion: {
          bg: '#ffffff',
          'bg-dark': '#191919',
          sidebar: '#f7f6f3',
          'sidebar-dark': '#1f1f1f',
          hover: '#efefef',
          'hover-dark': '#2f2f2f',
          text: '#37352f',
          'text-dark': '#ffffffcf',
          muted: '#9b9a97',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
```

**Step 4: Configure Vitest — add to `vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
```

**Step 5: Create test setup file `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom'
```

**Step 6: Add Inter font to `index.html` `<head>`**

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
```

**Step 7: Replace `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'Inter', sans-serif;
}
```

**Step 8: Create Supabase client `src/lib/supabase.ts`**

```ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**Step 9: Create `.env.local` (fill in your values)**

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Step 10: Verify dev server starts**

```bash
npm run dev
```
Expected: Vite dev server running at http://localhost:5173

**Step 11: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite React app with Tailwind and Supabase client"
```

---

### Task 2: Supabase Database Schema & RLS

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

**Step 1: Create the migration file**

```sql
-- supabase/migrations/001_initial_schema.sql

-- Pages
create table pages (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Untitled',
  icon text,
  cover_image text,
  type text not null check (type in ('note', 'kanban', 'table')),
  parent_id uuid references pages(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Note content
create table note_content (
  id uuid primary key default gen_random_uuid(),
  page_id uuid references pages(id) on delete cascade unique not null,
  content jsonb default '{}'::jsonb
);

-- Kanban columns
create table kanban_columns (
  id uuid primary key default gen_random_uuid(),
  page_id uuid references pages(id) on delete cascade not null,
  title text not null default 'New Column',
  position int not null default 0
);

-- Kanban cards
create table kanban_cards (
  id uuid primary key default gen_random_uuid(),
  column_id uuid references kanban_columns(id) on delete cascade not null,
  title text not null default 'Untitled Card',
  description text,
  position int not null default 0,
  assigned_to uuid references auth.users(id) on delete set null
);

-- Table columns
create table table_columns (
  id uuid primary key default gen_random_uuid(),
  page_id uuid references pages(id) on delete cascade not null,
  name text not null default 'Column',
  type text not null default 'text' check (type in ('text', 'number', 'date', 'checkbox', 'select')),
  position int not null default 0
);

-- Table rows
create table table_rows (
  id uuid primary key default gen_random_uuid(),
  page_id uuid references pages(id) on delete cascade not null,
  position int not null default 0
);

-- Table cells
create table table_cells (
  id uuid primary key default gen_random_uuid(),
  row_id uuid references table_rows(id) on delete cascade not null,
  column_id uuid references table_columns(id) on delete cascade not null,
  value text default '',
  unique(row_id, column_id)
);

-- User profiles
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- updated_at trigger for pages
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger pages_updated_at before update on pages
  for each row execute function update_updated_at();

-- RLS: enable on all tables
alter table pages enable row level security;
alter table note_content enable row level security;
alter table kanban_columns enable row level security;
alter table kanban_cards enable row level security;
alter table table_columns enable row level security;
alter table table_rows enable row level security;
alter table table_cells enable row level security;
alter table profiles enable row level security;

-- RLS policies: authenticated users can do everything
create policy "auth_all" on pages for all to authenticated using (true) with check (true);
create policy "auth_all" on note_content for all to authenticated using (true) with check (true);
create policy "auth_all" on kanban_columns for all to authenticated using (true) with check (true);
create policy "auth_all" on kanban_cards for all to authenticated using (true) with check (true);
create policy "auth_all" on table_columns for all to authenticated using (true) with check (true);
create policy "auth_all" on table_rows for all to authenticated using (true) with check (true);
create policy "auth_all" on table_cells for all to authenticated using (true) with check (true);
create policy "auth_all" on profiles for all to authenticated using (true) with check (true);
```

**Step 2: Run the migration in Supabase**

Go to Supabase dashboard → SQL Editor → paste the full file contents → click Run.

Expected: No errors. All tables visible in Table Editor.

**Step 3: Enable Realtime for pages, kanban_cards, table_cells**

In Supabase dashboard → Database → Replication → enable realtime for: `pages`, `kanban_cards`, `table_cells`.

**Step 4: Commit**

```bash
git add supabase/
git commit -m "feat: add initial database schema and RLS policies"
```

---

### Task 3: Auth — Types, Context, and Login Page

**Files:**
- Create: `src/types/index.ts`
- Create: `src/context/AuthContext.tsx`
- Create: `src/pages/LoginPage.tsx`
- Create: `src/components/ProtectedRoute.tsx`
- Modify: `src/App.tsx`
- Create: `src/test/auth.test.tsx`

**Step 1: Write the failing test `src/test/auth.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import LoginPage from '../pages/LoginPage'

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn(),
    },
  },
}))

describe('LoginPage', () => {
  it('renders Google and GitHub sign-in buttons', () => {
    render(<LoginPage />)
    expect(screen.getByText(/sign in with google/i)).toBeInTheDocument()
    expect(screen.getByText(/sign in with github/i)).toBeInTheDocument()
  })
})
```

**Step 2: Run test to confirm it fails**

```bash
npx vitest run src/test/auth.test.tsx
```
Expected: FAIL — LoginPage module not found

**Step 3: Create types `src/types/index.ts`**

```ts
export type PageType = 'note' | 'kanban' | 'table'

export interface Page {
  id: string
  title: string
  icon: string | null
  cover_image: string | null
  type: PageType
  parent_id: string | null
  owner_id: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
}

export interface KanbanColumn {
  id: string
  page_id: string
  title: string
  position: number
}

export interface KanbanCard {
  id: string
  column_id: string
  title: string
  description: string | null
  position: number
  assigned_to: string | null
}

export interface TableColumn {
  id: string
  page_id: string
  name: string
  type: 'text' | 'number' | 'date' | 'checkbox' | 'select'
  position: number
}

export interface TableRow {
  id: string
  page_id: string
  position: number
}

export interface TableCell {
  id: string
  row_id: string
  column_id: string
  value: string
}
```

**Step 4: Create auth context `src/context/AuthContext.tsx`**

```tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { Profile } from '../types'

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({ user: null, profile: null, loading: true })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
    setLoading(false)
  }

  return <AuthContext.Provider value={{ user, profile, loading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
```

**Step 5: Create login page `src/pages/LoginPage.tsx`**

```tsx
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const signIn = (provider: 'google' | 'github') => {
    supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-notion-bg dark:bg-notion-bg-dark">
      <div className="w-full max-w-sm p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-notion-text dark:text-notion-text-dark">Welcome</h1>
          <p className="mt-2 text-notion-muted">Sign in to your workspace</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => signIn('google')}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-md text-sm font-medium text-notion-text dark:text-notion-text-dark hover:bg-notion-hover dark:hover:bg-notion-hover-dark transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Sign in with Google
          </button>

          <button
            onClick={() => signIn('github')}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-md text-sm font-medium text-notion-text dark:text-notion-text-dark hover:bg-notion-hover dark:hover:bg-notion-hover-dark transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            Sign in with GitHub
          </button>
        </div>
      </div>
    </div>
  )
}
```

**Step 6: Create `src/components/ProtectedRoute.tsx`**

```tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-notion-muted">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}
```

**Step 7: Update `src/App.tsx`**

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<ProtectedRoute><div>App coming soon</div></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
```

**Step 8: Run the test — confirm it passes**

```bash
npx vitest run src/test/auth.test.tsx
```
Expected: PASS

**Step 9: Commit**

```bash
git add src/
git commit -m "feat: add auth context, login page with Google/GitHub OAuth"
```

---

### Task 4: App Shell — Sidebar & Layout

**Files:**
- Create: `src/components/Sidebar.tsx`
- Create: `src/components/AppLayout.tsx`
- Create: `src/pages/AppPage.tsx`
- Create: `src/hooks/usePages.ts`
- Modify: `src/App.tsx`
- Create: `src/test/sidebar.test.tsx`

**Step 1: Write the failing test `src/test/sidebar.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Sidebar from '../components/Sidebar'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: '1' }, profile: { full_name: 'Test User', avatar_url: null } }),
}))

vi.mock('../hooks/usePages', () => ({
  usePages: () => ({ pages: [], loading: false, createPage: vi.fn() }),
}))

describe('Sidebar', () => {
  it('renders the new page button', () => {
    render(<MemoryRouter><Sidebar /></MemoryRouter>)
    expect(screen.getByText(/new page/i)).toBeInTheDocument()
  })

  it('renders user name', () => {
    render(<MemoryRouter><Sidebar /></MemoryRouter>)
    expect(screen.getByText('Test User')).toBeInTheDocument()
  })
})
```

**Step 2: Run test — confirm it fails**

```bash
npx vitest run src/test/sidebar.test.tsx
```
Expected: FAIL

**Step 3: Create `src/hooks/usePages.ts`**

```ts
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Page, PageType } from '../types'
import { useAuth } from '../context/AuthContext'

export function usePages() {
  const { user } = useAuth()
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPages = useCallback(async () => {
    if (!user) return
    const { data } = await supabase.from('pages').select('*').order('created_at')
    setPages(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchPages()

    const channel = supabase
      .channel('pages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pages' }, fetchPages)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchPages])

  const createPage = async (type: PageType, parentId?: string) => {
    if (!user) return
    const { data } = await supabase
      .from('pages')
      .insert({ type, owner_id: user.id, parent_id: parentId ?? null })
      .select()
      .single()
    return data as Page
  }

  const updatePage = async (id: string, updates: Partial<Page>) => {
    await supabase.from('pages').update(updates).eq('id', id)
  }

  const deletePage = async (id: string) => {
    await supabase.from('pages').delete().eq('id', id)
  }

  return { pages, loading, createPage, updatePage, deletePage, refetch: fetchPages }
}
```

**Step 4: Create `src/components/Sidebar.tsx`**

```tsx
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
```

**Step 5: Create `src/components/AppLayout.tsx`**

```tsx
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
```

**Step 6: Create `src/pages/AppPage.tsx`**

```tsx
import { useParams } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import { usePages } from '../hooks/usePages'

export default function AppPage() {
  const { id } = useParams<{ id: string }>()
  const { pages } = usePages()
  const page = pages.find(p => p.id === id)

  if (!page) return (
    <AppLayout>
      <div className="flex items-center justify-center h-full text-notion-muted">
        {id ? 'Page not found' : 'Select or create a page'}
      </div>
    </AppLayout>
  )

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-16 py-12">
        <h1 className="text-4xl font-bold text-notion-text dark:text-notion-text-dark mb-4 outline-none">
          {page.title || 'Untitled'}
        </h1>
        <div className="text-notion-muted text-sm">
          {page.type} page — editor coming soon
        </div>
      </div>
    </AppLayout>
  )
}
```

**Step 7: Update `src/App.tsx`**

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import AppPage from './pages/AppPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/page/:id" element={<ProtectedRoute><AppPage /></ProtectedRoute>} />
          <Route path="/app" element={<ProtectedRoute><AppPage /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/app" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
```

**Step 8: Run the test — confirm it passes**

```bash
npx vitest run src/test/sidebar.test.tsx
```
Expected: PASS

**Step 9: Commit**

```bash
git add src/
git commit -m "feat: add sidebar, app layout, and page navigation"
```

---

### Task 5: Page Header — Editable Title

**Files:**
- Create: `src/components/PageHeader.tsx`
- Modify: `src/pages/AppPage.tsx`
- Create: `src/test/page-header.test.tsx`

**Step 1: Write the failing test**

```tsx
// src/test/page-header.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import PageHeader from '../components/PageHeader'
import { Page } from '../types'

const mockPage: Page = {
  id: '1', title: 'My Page', icon: null, cover_image: null,
  type: 'note', parent_id: null, owner_id: 'u1',
  created_at: '', updated_at: '',
}

describe('PageHeader', () => {
  it('renders the page title', () => {
    render(<PageHeader page={mockPage} onUpdate={vi.fn()} />)
    expect(screen.getByDisplayValue('My Page')).toBeInTheDocument()
  })

  it('calls onUpdate when title changes', () => {
    const onUpdate = vi.fn()
    render(<PageHeader page={mockPage} onUpdate={onUpdate} />)
    const input = screen.getByDisplayValue('My Page')
    fireEvent.change(input, { target: { value: 'New Title' } })
    expect(onUpdate).toHaveBeenCalledWith({ title: 'New Title' })
  })
})
```

**Step 2: Run test — confirm it fails**

```bash
npx vitest run src/test/page-header.test.tsx
```
Expected: FAIL

**Step 3: Create `src/components/PageHeader.tsx`**

```tsx
import { Page } from '../types'

interface Props {
  page: Page
  onUpdate: (updates: Partial<Page>) => void
}

export default function PageHeader({ page, onUpdate }: Props) {
  return (
    <div className="px-16 pt-16 pb-4">
      {page.icon && <div className="text-6xl mb-4">{page.icon}</div>}
      <input
        className="w-full text-4xl font-bold text-notion-text dark:text-notion-text-dark bg-transparent outline-none placeholder-gray-300 dark:placeholder-gray-600"
        value={page.title}
        placeholder="Untitled"
        onChange={e => onUpdate({ title: e.target.value })}
      />
    </div>
  )
}
```

**Step 4: Update `src/pages/AppPage.tsx` to use PageHeader and debounce title saves**

```tsx
import { useParams } from 'react-router-dom'
import { useCallback, useRef } from 'react'
import AppLayout from '../components/AppLayout'
import PageHeader from '../components/PageHeader'
import { usePages } from '../hooks/usePages'
import { Page } from '../types'

export default function AppPage() {
  const { id } = useParams<{ id: string }>()
  const { pages, updatePage } = usePages()
  const page = pages.find(p => p.id === id)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleUpdate = useCallback((updates: Partial<Page>) => {
    if (!id) return
    // Optimistic local state update is handled by realtime subscription
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => updatePage(id, updates), 500)
  }, [id, updatePage])

  if (!page) return (
    <AppLayout>
      <div className="flex items-center justify-center h-full text-notion-muted">
        {id ? 'Page not found' : 'Select or create a page'}
      </div>
    </AppLayout>
  )

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <PageHeader page={page} onUpdate={handleUpdate} />
        <div className="px-16 text-notion-muted text-sm">
          {page.type} editor coming soon
        </div>
      </div>
    </AppLayout>
  )
}
```

**Step 5: Run test — confirm it passes**

```bash
npx vitest run src/test/page-header.test.tsx
```
Expected: PASS

**Step 6: Commit**

```bash
git add src/
git commit -m "feat: add editable page header with debounced title save"
```

---

### Task 6: Note Editor (Tiptap)

**Files:**
- Create: `src/components/NoteEditor.tsx`
- Create: `src/hooks/useNoteContent.ts`
- Modify: `src/pages/AppPage.tsx`
- Create: `src/test/note-editor.test.tsx`

**Step 1: Write the failing test**

```tsx
// src/test/note-editor.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import NoteEditor from '../components/NoteEditor'

vi.mock('../hooks/useNoteContent', () => ({
  useNoteContent: () => ({ content: null, saveContent: vi.fn(), loading: false }),
}))

describe('NoteEditor', () => {
  it('renders the editor', () => {
    render(<NoteEditor pageId="1" />)
    expect(document.querySelector('.ProseMirror')).toBeInTheDocument()
  })
})
```

**Step 2: Run test — confirm it fails**

```bash
npx vitest run src/test/note-editor.test.tsx
```
Expected: FAIL

**Step 3: Create `src/hooks/useNoteContent.ts`**

```ts
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useNoteContent(pageId: string) {
  const [content, setContent] = useState<object | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('note_content')
      .select('content')
      .eq('page_id', pageId)
      .single()
      .then(({ data }) => {
        setContent(data?.content ?? null)
        setLoading(false)
      })
  }, [pageId])

  const saveContent = useCallback(async (json: object) => {
    await supabase
      .from('note_content')
      .upsert({ page_id: pageId, content: json }, { onConflict: 'page_id' })
  }, [pageId])

  return { content, saveContent, loading }
}
```

**Step 4: Create `src/components/NoteEditor.tsx`**

```tsx
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useNoteContent } from '../hooks/useNoteContent'
import { useEffect, useRef } from 'react'

interface Props { pageId: string }

export default function NoteEditor({ pageId }: Props) {
  const { content, saveContent, loading } = useNoteContent(pageId)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Type '/' for commands…" }),
    ],
    content: content ?? '',
    editorProps: {
      attributes: {
        class: 'prose prose-neutral dark:prose-invert max-w-none outline-none min-h-[200px] text-notion-text dark:text-notion-text-dark',
      },
    },
    onUpdate: ({ editor }) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => saveContent(editor.getJSON()), 800)
    },
  })

  // Load content into editor once fetched
  useEffect(() => {
    if (!loading && editor && content) {
      editor.commands.setContent(content)
    }
  }, [loading, content, editor])

  if (loading) return <div className="text-notion-muted text-sm">Loading...</div>

  return (
    <div className="px-16">
      <EditorContent editor={editor} />
    </div>
  )
}
```

**Step 5: Add Tiptap prose styles — add to `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body { font-family: 'Inter', sans-serif; }

.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #9b9a97;
  pointer-events: none;
  height: 0;
}
```

Also install the prose plugin:
```bash
npm install @tailwindcss/typography
```

Add to `tailwind.config.ts` plugins: `require('@tailwindcss/typography')`

**Step 6: Update `src/pages/AppPage.tsx` to render NoteEditor for note pages**

```tsx
// Inside the return, replace the placeholder div with:
<div className="max-w-3xl mx-auto">
  <PageHeader page={page} onUpdate={handleUpdate} />
  {page.type === 'note' && <NoteEditor pageId={page.id} />}
  {page.type === 'kanban' && <div className="px-16 text-notion-muted text-sm">Kanban coming soon</div>}
  {page.type === 'table' && <div className="px-16 text-notion-muted text-sm">Table coming soon</div>}
</div>
```

**Step 7: Run test — confirm it passes**

```bash
npx vitest run src/test/note-editor.test.tsx
```
Expected: PASS

**Step 8: Commit**

```bash
git add src/
git commit -m "feat: add Tiptap rich text note editor with auto-save"
```

---

### Task 7: Kanban Board

**Files:**
- Create: `src/hooks/useKanban.ts`
- Create: `src/components/KanbanBoard.tsx`
- Create: `src/components/KanbanColumn.tsx`
- Create: `src/components/KanbanCard.tsx`
- Modify: `src/pages/AppPage.tsx`
- Create: `src/test/kanban.test.tsx`

**Step 1: Write the failing test**

```tsx
// src/test/kanban.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import KanbanBoard from '../components/KanbanBoard'

vi.mock('../hooks/useKanban', () => ({
  useKanban: () => ({
    columns: [{ id: 'c1', page_id: 'p1', title: 'To Do', position: 0 }],
    cards: [{ id: 'k1', column_id: 'c1', title: 'Card 1', description: null, position: 0, assigned_to: null }],
    loading: false,
    addColumn: vi.fn(), addCard: vi.fn(), moveCard: vi.fn(), deleteCard: vi.fn(), deleteColumn: vi.fn(),
  }),
}))

describe('KanbanBoard', () => {
  it('renders columns and cards', () => {
    render(<KanbanBoard pageId="p1" />)
    expect(screen.getByText('To Do')).toBeInTheDocument()
    expect(screen.getByText('Card 1')).toBeInTheDocument()
  })
})
```

**Step 2: Run test — confirm it fails**

```bash
npx vitest run src/test/kanban.test.tsx
```
Expected: FAIL

**Step 3: Create `src/hooks/useKanban.ts`**

```ts
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { KanbanCard, KanbanColumn } from '../types'

export function useKanban(pageId: string) {
  const [columns, setColumns] = useState<KanbanColumn[]>([])
  const [cards, setCards] = useState<KanbanCard[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const [{ data: cols }, { data: cds }] = await Promise.all([
      supabase.from('kanban_columns').select('*').eq('page_id', pageId).order('position'),
      supabase.from('kanban_cards').select('*').eq('column_id', pageId).order('position'),
    ])
    // cards: get all cards for all columns of this page
    const { data: allCards } = await supabase
      .from('kanban_cards')
      .select('*, kanban_columns!inner(page_id)')
      .eq('kanban_columns.page_id', pageId)
      .order('position')
    setColumns(cols ?? [])
    setCards(allCards ?? [])
    setLoading(false)
  }, [pageId])

  useEffect(() => {
    fetch()
    const channel = supabase.channel(`kanban-${pageId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kanban_cards' }, fetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kanban_columns' }, fetch)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetch, pageId])

  const addColumn = async () => {
    const position = columns.length
    await supabase.from('kanban_columns').insert({ page_id: pageId, title: 'New Column', position })
  }

  const addCard = async (columnId: string) => {
    const colCards = cards.filter(c => c.column_id === columnId)
    await supabase.from('kanban_cards').insert({ column_id: columnId, title: 'Untitled Card', position: colCards.length })
  }

  const moveCard = async (cardId: string, newColumnId: string, newPosition: number) => {
    await supabase.from('kanban_cards').update({ column_id: newColumnId, position: newPosition }).eq('id', cardId)
  }

  const deleteCard = async (cardId: string) => {
    await supabase.from('kanban_cards').delete().eq('id', cardId)
  }

  const deleteColumn = async (columnId: string) => {
    await supabase.from('kanban_columns').delete().eq('id', columnId)
  }

  return { columns, cards, loading, addColumn, addCard, moveCard, deleteCard, deleteColumn }
}
```

**Step 4: Create `src/components/KanbanCard.tsx`**

```tsx
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Trash2 } from 'lucide-react'
import { KanbanCard as KanbanCardType } from '../types'

interface Props {
  card: KanbanCardType
  onDelete: (id: string) => void
}

export default function KanbanCard({ card, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      {...attributes}
      {...listeners}
      className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-3 text-sm text-notion-text dark:text-notion-text-dark shadow-sm cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <span>{card.title || 'Untitled'}</span>
        <button
          onClick={e => { e.stopPropagation(); onDelete(card.id) }}
          className="hidden group-hover:block text-notion-muted hover:text-red-500 flex-shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      {card.description && <p className="mt-1 text-notion-muted text-xs">{card.description}</p>}
    </div>
  )
}
```

**Step 5: Create `src/components/KanbanColumn.tsx`**

```tsx
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus, Trash2 } from 'lucide-react'
import { KanbanColumn as KanbanColumnType, KanbanCard } from '../types'
import KanbanCardComponent from './KanbanCard'

interface Props {
  column: KanbanColumnType
  cards: KanbanCard[]
  onAddCard: (columnId: string) => void
  onDeleteCard: (cardId: string) => void
  onDeleteColumn: (columnId: string) => void
}

export default function KanbanColumn({ column, cards, onAddCard, onDeleteCard, onDeleteColumn }: Props) {
  const { setNodeRef } = useDroppable({ id: column.id })

  return (
    <div className="flex-shrink-0 w-64 flex flex-col bg-notion-sidebar dark:bg-notion-sidebar-dark rounded-lg">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-sm font-medium text-notion-text dark:text-notion-text-dark">{column.title}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => onAddCard(column.id)} className="text-notion-muted hover:text-notion-text dark:hover:text-notion-text-dark p-0.5 rounded">
            <Plus className="w-4 h-4" />
          </button>
          <button onClick={() => onDeleteColumn(column.id)} className="text-notion-muted hover:text-red-500 p-0.5 rounded">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div ref={setNodeRef} className="flex-1 px-2 pb-2 space-y-2 min-h-[100px]">
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map(card => (
            <KanbanCardComponent key={card.id} card={card} onDelete={onDeleteCard} />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}
```

**Step 6: Create `src/components/KanbanBoard.tsx`**

```tsx
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import { useKanban } from '../hooks/useKanban'
import KanbanColumnComponent from './KanbanColumn'

interface Props { pageId: string }

export default function KanbanBoard({ pageId }: Props) {
  const { columns, cards, loading, addColumn, addCard, moveCard, deleteCard, deleteColumn } = useKanban(pageId)
  const sensors = useSensors(useSensor(PointerSensor))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    // Find which column the card was dropped into
    const targetColumn = columns.find(c => c.id === over.id) ?? columns.find(c => cards.some(card => card.id === over.id && card.column_id === c.id))
    if (!targetColumn) return
    const colCards = cards.filter(c => c.column_id === targetColumn.id)
    moveCard(active.id as string, targetColumn.id, colCards.length)
  }

  if (loading) return <div className="px-16 text-notion-muted text-sm">Loading board...</div>

  return (
    <div className="px-16 py-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map(col => (
            <KanbanColumnComponent
              key={col.id}
              column={col}
              cards={cards.filter(c => c.column_id === col.id)}
              onAddCard={addCard}
              onDeleteCard={deleteCard}
              onDeleteColumn={deleteColumn}
            />
          ))}
          <button
            onClick={addColumn}
            className="flex-shrink-0 w-64 flex items-center gap-2 px-3 py-2 text-sm text-notion-muted hover:text-notion-text dark:hover:text-notion-text-dark hover:bg-notion-hover dark:hover:bg-notion-hover-dark rounded-lg transition-colors h-fit"
          >
            <Plus className="w-4 h-4" />
            Add column
          </button>
        </div>
      </DndContext>
    </div>
  )
}
```

**Step 7: Run test — confirm it passes**

```bash
npx vitest run src/test/kanban.test.tsx
```
Expected: PASS

**Step 8: Update `src/pages/AppPage.tsx` — replace kanban placeholder**

```tsx
{page.type === 'kanban' && <KanbanBoard pageId={page.id} />}
```
Import: `import KanbanBoard from '../components/KanbanBoard'`

**Step 9: Commit**

```bash
git add src/
git commit -m "feat: add kanban board with drag-and-drop columns and cards"
```

---

### Task 8: Table View

**Files:**
- Create: `src/hooks/useTable.ts`
- Create: `src/components/TableView.tsx`
- Modify: `src/pages/AppPage.tsx`
- Create: `src/test/table.test.tsx`

**Step 1: Write the failing test**

```tsx
// src/test/table.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import TableView from '../components/TableView'

vi.mock('../hooks/useTable', () => ({
  useTable: () => ({
    columns: [{ id: 'col1', page_id: 'p1', name: 'Name', type: 'text', position: 0 }],
    rows: [{ id: 'row1', page_id: 'p1', position: 0 }],
    cells: [{ id: 'cell1', row_id: 'row1', column_id: 'col1', value: 'Alice' }],
    loading: false,
    addRow: vi.fn(), addColumn: vi.fn(), updateCell: vi.fn(),
  }),
}))

describe('TableView', () => {
  it('renders column headers and cell values', () => {
    render(<TableView pageId="p1" />)
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()
  })
})
```

**Step 2: Run test — confirm it fails**

```bash
npx vitest run src/test/table.test.tsx
```
Expected: FAIL

**Step 3: Create `src/hooks/useTable.ts`**

```ts
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { TableColumn, TableRow, TableCell } from '../types'

export function useTable(pageId: string) {
  const [columns, setColumns] = useState<TableColumn[]>([])
  const [rows, setRows] = useState<TableRow[]>([])
  const [cells, setCells] = useState<TableCell[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const [{ data: cols }, { data: rws }, { data: cls }] = await Promise.all([
      supabase.from('table_columns').select('*').eq('page_id', pageId).order('position'),
      supabase.from('table_rows').select('*').eq('page_id', pageId).order('position'),
      supabase.from('table_cells').select('*'),
    ])
    setColumns(cols ?? [])
    setRows(rws ?? [])
    setCells(cls ?? [])
    setLoading(false)
  }, [pageId])

  useEffect(() => { fetch() }, [fetch])

  const addColumn = async () => {
    await supabase.from('table_columns').insert({ page_id: pageId, name: 'Column', type: 'text', position: columns.length })
    fetch()
  }

  const addRow = async () => {
    await supabase.from('table_rows').insert({ page_id: pageId, position: rows.length })
    fetch()
  }

  const updateCell = async (rowId: string, columnId: string, value: string) => {
    await supabase.from('table_cells').upsert({ row_id: rowId, column_id: columnId, value }, { onConflict: 'row_id,column_id' })
    setCells(prev => {
      const existing = prev.find(c => c.row_id === rowId && c.column_id === columnId)
      if (existing) return prev.map(c => c.row_id === rowId && c.column_id === columnId ? { ...c, value } : c)
      return [...prev, { id: crypto.randomUUID(), row_id: rowId, column_id: columnId, value }]
    })
  }

  return { columns, rows, cells, loading, addColumn, addRow, updateCell }
}
```

**Step 4: Create `src/components/TableView.tsx`**

```tsx
import { Plus } from 'lucide-react'
import { useTable } from '../hooks/useTable'

interface Props { pageId: string }

export default function TableView({ pageId }: Props) {
  const { columns, rows, cells, loading, addColumn, addRow, updateCell } = useTable(pageId)

  const getCell = (rowId: string, colId: string) =>
    cells.find(c => c.row_id === rowId && c.column_id === colId)?.value ?? ''

  if (loading) return <div className="px-16 text-notion-muted text-sm">Loading table...</div>

  return (
    <div className="px-16 py-4 overflow-x-auto">
      <table className="border-collapse text-sm text-notion-text dark:text-notion-text-dark">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.id} className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-left font-medium bg-notion-sidebar dark:bg-notion-sidebar-dark min-w-[160px]">
                {col.name}
              </th>
            ))}
            <th className="border border-gray-200 dark:border-gray-700 px-2 py-2">
              <button onClick={addColumn} className="text-notion-muted hover:text-notion-text dark:hover:text-notion-text-dark">
                <Plus className="w-4 h-4" />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id}>
              {columns.map(col => (
                <td key={col.id} className="border border-gray-200 dark:border-gray-700 p-0">
                  <input
                    className="w-full px-3 py-2 bg-transparent outline-none focus:bg-blue-50 dark:focus:bg-blue-900/10"
                    value={getCell(row.id, col.id)}
                    onChange={e => updateCell(row.id, col.id, e.target.value)}
                  />
                </td>
              ))}
              <td className="border border-gray-200 dark:border-gray-700" />
            </tr>
          ))}
          <tr>
            <td colSpan={columns.length + 1} className="border border-gray-200 dark:border-gray-700">
              <button
                onClick={addRow}
                className="w-full flex items-center gap-2 px-3 py-2 text-notion-muted hover:text-notion-text dark:hover:text-notion-text-dark hover:bg-notion-hover dark:hover:bg-notion-hover-dark"
              >
                <Plus className="w-4 h-4" />
                New row
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
```

**Step 5: Run test — confirm it passes**

```bash
npx vitest run src/test/table.test.tsx
```
Expected: PASS

**Step 6: Update `src/pages/AppPage.tsx` — replace table placeholder**

```tsx
{page.type === 'table' && <TableView pageId={page.id} />}
```
Import: `import TableView from '../components/TableView'`

**Step 7: Commit**

```bash
git add src/
git commit -m "feat: add table view with inline cell editing"
```

---

### Task 9: New Page Type Selector

**Files:**
- Create: `src/components/NewPageMenu.tsx`
- Modify: `src/components/Sidebar.tsx`

**Step 1: Create `src/components/NewPageMenu.tsx`**

```tsx
import { FileText, Columns, Table } from 'lucide-react'
import { PageType } from '../types'

interface Props {
  onSelect: (type: PageType) => void
  onClose: () => void
}

export default function NewPageMenu({ onSelect, onClose }: Props) {
  return (
    <div className="absolute bottom-10 left-2 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-2 w-48">
      <p className="px-3 py-1 text-xs font-medium text-notion-muted uppercase tracking-wide">New page</p>
      {([
        { type: 'note' as PageType, label: 'Note', icon: <FileText className="w-4 h-4" /> },
        { type: 'kanban' as PageType, label: 'Kanban board', icon: <Columns className="w-4 h-4" /> },
        { type: 'table' as PageType, label: 'Table', icon: <Table className="w-4 h-4" /> },
      ]).map(({ type, label, icon }) => (
        <button
          key={type}
          onClick={() => { onSelect(type); onClose() }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-notion-text dark:text-notion-text-dark hover:bg-notion-hover dark:hover:bg-notion-hover-dark"
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  )
}
```

**Step 2: Update Sidebar's `handleNewPage` to show type menu**

In `src/components/Sidebar.tsx`, add `menuOpen` state and render `NewPageMenu` when clicking "+ New page":

```tsx
// Add to Sidebar component
const [typeMenuOpen, setTypeMenuOpen] = useState(false)

const handleNewPage = async (type: PageType) => {
  const page = await createPage(type)
  if (page) navigate(`/page/${page.id}`)
}

// Replace the New page button section with:
<div className="px-2 py-2 border-t border-gray-200 dark:border-gray-800 relative">
  <button
    onClick={() => setTypeMenuOpen(m => !m)}
    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-notion-muted hover:text-notion-text dark:hover:text-notion-text-dark hover:bg-notion-hover dark:hover:bg-notion-hover-dark rounded transition-colors"
  >
    <Plus className="w-4 h-4" />
    New page
  </button>
  {typeMenuOpen && (
    <NewPageMenu onSelect={handleNewPage} onClose={() => setTypeMenuOpen(false)} />
  )}
</div>
```

Import `NewPageMenu` and `PageType` at the top.

**Step 3: Commit**

```bash
git add src/
git commit -m "feat: add page type selector menu for new pages"
```

---

### Task 10: Deploy to Vercel

**Files:**
- Create: `vercel.json`

**Step 1: Create `vercel.json` for SPA routing**

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**Step 2: Push to GitHub**

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

**Step 3: Deploy on Vercel**

1. Go to [vercel.com](https://vercel.com) → New Project → import your GitHub repo
2. Framework preset: Vite
3. Add environment variables:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
4. Click Deploy

**Step 4: Update Supabase OAuth callback URLs**

In Supabase → Auth → URL Configuration:
- Site URL: `https://your-project.vercel.app`
- Redirect URLs: add `https://your-project.vercel.app`

Also update OAuth app settings in Google Cloud Console and GitHub Developer Settings to allow the production URL.

**Step 5: Verify production deploy**

Visit your Vercel URL, sign in with Google or GitHub, create pages of each type, verify sync across two browser tabs.

**Step 6: Commit**

```bash
git add vercel.json
git commit -m "feat: add Vercel config for SPA routing"
```

---

## Run All Tests

```bash
npx vitest run
```

Expected: All tests pass.
