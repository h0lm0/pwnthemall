"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  OnChangeFn,
  RowSelectionState,
  getPaginationRowModel,
  PaginationState,
} from "@tanstack/react-table"
import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  enableRowSelection?: boolean
  rowSelection?: RowSelectionState
  onRowSelectionChange?: OnChangeFn<RowSelectionState>
  equalizeColumnWidths?: boolean
  enablePagination?: boolean
  defaultPageSize?: number
  hidePageSizeSelector?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  enableRowSelection,
  rowSelection: externalRowSelection,
  onRowSelectionChange,
  equalizeColumnWidths,
  enablePagination = false,
  defaultPageSize = 25,
  hidePageSizeSelector = false,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: defaultPageSize,
  })

  const table = useReactTable({
    data,
    columns,
    state: {
      rowSelection: externalRowSelection ?? rowSelection,
      pagination: enablePagination ? pagination : undefined,
    },
    onRowSelectionChange: onRowSelectionChange ?? setRowSelection,
    onPaginationChange: enablePagination ? setPagination : undefined,
    enableRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    manualPagination: false,
  })

  const nonSelectableColumnCount = columns.length
  const selectionColWidthPx = enableRowSelection ? 48 : 0
  const equalWidthStyle = equalizeColumnWidths
    ? { width: `calc((100% - ${selectionColWidthPx}px) / ${Math.max(nonSelectableColumnCount, 1)})` }
    : undefined

  return (
    <div className="rounded-md border bg-background w-full">
      <div className="overflow-x-auto">
        <table className={`w-full text-sm ${equalizeColumnWidths ? 'table-fixed' : ''}`}>
          <thead className="border-b">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {enableRowSelection && (
                  <th className="w-[48px] px-3 py-2 align-middle text-center">
                    <Checkbox
                    aria-label="Select all"
                    checked={
                      table.getIsAllRowsSelected()
                        ? true
                        : table.getIsSomeRowsSelected()
                        ? "indeterminate"
                        : false
                    }
                    onCheckedChange={(value) =>
                      table.toggleAllRowsSelected(!!value)
                    }
                  />
                </th>
              )}
                {headerGroup.headers.map((header) => (
                <th key={header.id} className="px-3 py-2 text-left font-medium align-middle" style={equalWidthStyle}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b last:border-b-0">
              {enableRowSelection && (
                <td className="w-[48px] px-3 py-2 align-middle text-center">
                  <Checkbox
                    aria-label="Select row"
                    checked={
                      row.getIsSelected()
                        ? true
                        : row.getIsSomeSelected()
                        ? "indeterminate"
                        : false
                    }
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                  />
                </td>
              )}
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-3 py-2 align-middle" style={equalWidthStyle}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      
      {enablePagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          {!hidePageSizeSelector && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows per page:</span>
              <Select
                value={table.getState().pagination.pageSize.toString()}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 15, 20, 25, 50, 100, 200].map((pageSize) => (
                    <SelectItem key={pageSize} value={pageSize.toString()}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className={`flex items-center gap-6 ${hidePageSizeSelector ? 'ml-auto' : ''}`}>
            <span className="text-sm text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </span>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

