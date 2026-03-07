# Notion Clone — Design Document

**Date:** 2026-03-07
**Status:** Approved

---

## Overview

A web-based workspace app for a small global team (< 50 people) with Notion-like functionality: rich text notes, kanban boards, and tables. Built with React + Supabase for fast delivery and easy maintenance.

---

## Architecture

**Frontend**
- Vite + React + TypeScript
- TailwindCSS (Notion-style light/dark theme)
- Tiptap (rich text editor for notes)
- React DnD (drag-and-drop for kanban)
- TanStack Table (spreadsheet-style table views)

**Backend (Supabase)**
- PostgreSQL — pages, blocks, kanban cards, table rows
- Auth — Google & GitHub OAuth
- Realtime — Supabase subscriptions for basic sync (changes save and refresh for others)
- Storage — file/image uploads in notes

**Deployment**
- Frontend → Vercel (global CDN, free tier)
- Backend → Supabase cloud (free tier)

---

## Data Model

```
users (managed by Supabase Auth)
  id, email, avatar_url, full_name

pages
  id, title, icon, cover_image
  type: 'note' | 'kanban' | 'table'
  parent_id (nullable — nested subpages)
  owner_id (FK → users)
  created_at, updated_at

note_content
  id, page_id (FK → pages)
  content (JSON — Tiptap editor state)

kanban_columns
  id, page_id (FK → pages)
  title, position

kanban_cards
  id, column_id (FK → kanban_columns)
  title, description, position
  assigned_to (FK → users, nullable)

table_columns
  id, page_id (FK → pages)
  name, type: 'text' | 'number' | 'date' | 'checkbox' | 'select'
  position

table_rows
  id, page_id (FK → pages)
  position

table_cells
  id, row_id, column_id
  value (text)
```

Pages are the core unit. Each page has a `type` that determines which content model it uses. `parent_id` supports nested pages for a sidebar hierarchy.

---

## UI & Navigation

**Layout**
- Collapsible left sidebar with user avatar, nested page tree, "+ New Page" button, workspace settings
- Main content area with page header (icon, cover image, title) and type-specific content

**Notion-style colour scheme**
- Light mode: off-white background (#F7F6F3), dark text
- Dark mode: dark charcoal (#191919), light text
- Accent: soft grey hover states, minimal colour
- Font: Inter

**Key interactions**
- Click page in sidebar → loads page instantly
- Hover page → reveals "..." menu (rename, delete, add subpage)
- "/" command in notes → insert block (heading, image, divider, etc.)
- Kanban: drag cards between columns
- Table: click cell to edit inline

---

## Auth & Permissions

**Authentication**
- Google OAuth and GitHub OAuth via Supabase Auth
- Sessions managed via JWT tokens

**Access Control**
- All authenticated users can read/write all pages (small team model)
- Row-Level Security (RLS) enforced at the database level on all tables
- Unauthenticated requests blocked at the DB level

**Onboarding**
- First login → prompted to set display name
- Redirected to a default "Home" page
- Sidebar pre-populated with example pages (note, kanban, table)

---

## Out of Scope (v1)

- Admin roles / fine-grained permissions
- Real-time live cursors / collaborative editing
- Calendar view, gallery view, embeds
- Billing / multi-tenant organizations
