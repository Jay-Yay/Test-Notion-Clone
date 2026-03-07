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
