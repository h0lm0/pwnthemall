import Head from "next/head"
import { useState } from "react"
import axios from "axios"
import { ColumnDef, RowSelectionState } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import ChallengeCategoriesForm from "./ChallengeCategoriesForm"
import { ChallengeCategory, ChallengeCategoryFormData } from "@/models/ChallengeCategory"

interface ChallengeCategoriesContentProps {
  challengeCategories: ChallengeCategory[]
  onRefresh: () => void
}

export default function ChallengeCategoriesContent({ challengeCategories, onRefresh }: ChallengeCategoriesContentProps) {
  const [editingChallengeCategory, setEditingChallengeCategory] = useState<ChallengeCategory | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<ChallengeCategory | null>(null)
  const [confirmMassDelete, setConfirmMassDelete] = useState(false)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const columns: ColumnDef<ChallengeCategory>[] = [
    { accessorKey: "ID", header: "ID" },
    { accessorKey: "Name", header: "Name" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditingChallengeCategory(row.original)}>
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleting(row.original)}>
            Delete
          </Button>
        </div>
      ),
    },
  ]

  const handleCreate = async (data: ChallengeCategoryFormData) => {
    await axios.post("/api/challenge-categories", data)
    setCreating(false)
    onRefresh()
  }

  const handleUpdate = async (data: ChallengeCategoryFormData) => {
    if (!editingChallengeCategory) return
    await axios.put(`/api/challenge-categories/${editingChallengeCategory.ID}`, data)
    setEditingChallengeCategory(null)
    onRefresh()
  }

  const handleDelete = async () => {
    if (!deleting) return
    await axios.delete(`/api/challenge-categories/${deleting.ID}`)
    setDeleting(null)
    onRefresh()
  }

  const doDeleteSelected = async () => {
    const ids = Object.keys(rowSelection).map((key) => challengeCategories[parseInt(key, 10)].ID)
    await Promise.all(ids.map((id) => axios.delete(`/api/challenge-categories/${id}`)))
    setRowSelection({})
    onRefresh()
    setConfirmMassDelete(false)
  }

  return (
    <>
      <Head>
        <title>pwnthemall - admin zone</title>
      </Head>
      <div className="bg-muted min-h-screen p-4">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Challenge categories</h1>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-2 h-9",
                Object.keys(rowSelection).length === 0 && "invisible"
              )}
            >
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmMassDelete(true)}
              >
                Delete selected
              </Button>
            </div>
            <Sheet open={creating} onOpenChange={setCreating}>
              <SheetTrigger asChild>
                <Button size="sm">New challenge category</Button>
              </SheetTrigger>
              <SheetContent side="right" onOpenAutoFocus={(e) => e.preventDefault()}>
                <SheetHeader>
                  <SheetTitle>Create challenge category</SheetTitle>
                </SheetHeader>
                <ChallengeCategoriesForm onSubmit={handleCreate} />
              </SheetContent>
            </Sheet>
          </div>
        </div>
        <DataTable
          columns={columns}
          data={challengeCategories}
          enableRowSelection
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
        />
      </div>
      <Sheet open={!!editingChallengeCategory} onOpenChange={(o) => !o && setEditingChallengeCategory(null)}>
        <SheetContent side="right" onOpenAutoFocus={(e) => e.preventDefault()}>
          <SheetHeader>
            <SheetTitle>Edit challenge category</SheetTitle>
          </SheetHeader>
          {editingChallengeCategory && (
            <ChallengeCategoriesForm
              isEdit
              initialData={{ Name: editingChallengeCategory.Name}}
              onSubmit={handleUpdate}
            />
          )}
        </SheetContent>
      </Sheet>
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete challenge category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleting?.Name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={confirmMassDelete} onOpenChange={setConfirmMassDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete challenge categories</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the selected challenge categories?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDeleteSelected}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

