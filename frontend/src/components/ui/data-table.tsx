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
}

export function DataTable<TData, TValue>({
  columns,
  data,
  enableRowSelection,
  rowSelection: externalRowSelection,
  onRowSelectionChange,
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

  return (
    <div className="rounded-md border bg-background">
      <table className="w-full table-fixed text-sm">
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
                <th key={header.id} className="px-3 py-2 text-left font-medium align-middle">
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
                <td key={cell.id} className="px-3 py-2 align-middle">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

