import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react"

// ── Types ────────────────────────────────────────────────────────────────────

export interface DataTableColumn<T> {
  id: string
  header: string
  /** Accessor — returns the cell value for sorting / display */
  accessorFn: (row: T) => React.ReactNode
  /** If provided, used for sorting instead of accessorFn */
  sortValue?: (row: T) => string | number
  /** If false, column header won't be sortable (default true) */
  sortable?: boolean
}

export interface DataTableProps<T> extends React.HTMLAttributes<HTMLDivElement> {
  columns: DataTableColumn<T>[]
  data: T[]
  /** Unique key extractor */
  getRowId: (row: T) => string | number
  /** Rows per page (default 10) */
  pageSize?: number
  /** Show the search filter input (default true) */
  searchable?: boolean
  /** Placeholder for search input */
  searchPlaceholder?: string
  /** Custom filter predicate — receives row and search term */
  filterFn?: (row: T, search: string) => boolean
}

function DataTableInner<T>(
  {
    columns,
    data,
    getRowId,
    pageSize = 10,
    searchable = true,
    searchPlaceholder = "Search…",
    filterFn,
    className,
    ...props
  }: DataTableProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const [search, setSearch] = React.useState("")
  const [sortId, setSortId] = React.useState<string | null>(null)
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc")
  const [page, setPage] = React.useState(0)

  // Filter
  const filtered = React.useMemo(() => {
    if (!search) return data
    const term = search.toLowerCase()
    if (filterFn) return data.filter((row) => filterFn(row, term))
    return data.filter((row) =>
      columns.some((col) => {
        const val = col.accessorFn(row)
        return val != null && String(val).toLowerCase().includes(term)
      })
    )
  }, [data, search, filterFn, columns])

  // Sort
  const sorted = React.useMemo(() => {
    if (!sortId) return filtered
    const col = columns.find((c) => c.id === sortId)
    if (!col) return filtered
    const accessor = col.sortValue ?? ((row: T) => {
      const v = col.accessorFn(row)
      return v == null ? "" : String(v)
    })
    return [...filtered].sort((a, b) => {
      const va = accessor(a)
      const vb = accessor(b)
      const cmp = va < vb ? -1 : va > vb ? 1 : 0
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [filtered, sortId, sortDir, columns])

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const paged = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize)

  // Reset page when filter changes
  React.useEffect(() => { setPage(0) }, [search])

  const toggleSort = (colId: string) => {
    if (sortId === colId) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortId(colId)
      setSortDir("asc")
    }
  }

  return (
    <div ref={ref} className={cn("space-y-3", className)} {...props}>
      {searchable && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
            aria-label="Filter table"
          />
        </div>
      )}

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => {
                const isSortable = col.sortable !== false
                return (
                  <TableHead key={col.id}>
                    {isSortable ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-foreground"
                        onClick={() => toggleSort(col.id)}
                        aria-label={`Sort by ${col.header}`}
                      >
                        {col.header}
                        <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    ) : (
                      col.header
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No results.
                </TableCell>
              </TableRow>
            ) : (
              paged.map((row) => (
                <TableRow key={getRowId(row)}>
                  {columns.map((col) => (
                    <TableCell key={col.id}>{col.accessorFn(row)}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {safePage + 1} of {totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={safePage === 0}
              onClick={() => setPage((p) => p - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Wrap with forwardRef while preserving generic
const DataTable = React.forwardRef(DataTableInner) as <T>(
  props: DataTableProps<T> & { ref?: React.Ref<HTMLDivElement> }
) => React.ReactElement

export { DataTable }
export type { DataTableColumn as DataTableColumnDef }
