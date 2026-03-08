import { Plus } from 'lucide-react'
import { useTable } from '../hooks/useTable'

interface Props { pageId: string }

export default function TableView({ pageId }: Props) {
  const { columns, rows, cells, loading, addColumn, addRow, updateColumn, updateCell } = useTable(pageId)

  const getCell = (rowId: string, colId: string) =>
    cells.find(c => c.row_id === rowId && c.column_id === colId)?.value ?? ''

  if (loading) return <div className="px-16 text-notion-muted text-sm">Loading table...</div>

  return (
    <div className="px-16 py-4 overflow-x-auto">
      <table className="border-collapse text-sm text-notion-text dark:text-notion-text-dark">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.id} className="border border-gray-200 dark:border-gray-700 px-0 py-0 text-left font-medium bg-notion-sidebar dark:bg-notion-sidebar-dark min-w-[160px]">
                <input
                  className="w-full px-3 py-2 bg-transparent outline-none font-medium focus:bg-blue-50 dark:focus:bg-blue-900/10"
                  value={col.name}
                  onChange={e => updateColumn(col.id, e.target.value)}
                />
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
