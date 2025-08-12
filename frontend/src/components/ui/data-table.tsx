"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  OnChangeFn,
  RowSelectionState,
} from "@tanstack/react-table"
import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  enableRowSelection?: boolean
  rowSelection?: RowSelectionState
  onRowSelectionChange?: OnChangeFn<RowSelectionState>
  equalizeColumnWidths?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  enableRowSelection,
  rowSelection: externalRowSelection,
  onRowSelectionChange,
  equalizeColumnWidths,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const table = useReactTable({
    data,
    columns,
    state: {
      rowSelection: externalRowSelection ?? rowSelection,
    },
    onRowSelectionChange: onRowSelectionChange ?? setRowSelection,
    enableRowSelection,
    getCoreRowModel: getCoreRowModel(),
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
    </div>
  )
}

