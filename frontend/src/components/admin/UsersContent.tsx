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
import UserForm from "./UserForm"
import { User, UserFormData } from "@/models/User"

interface UsersContentProps {
  users: User[]
  onRefresh: () => void
}

export default function UsersContent({ users, onRefresh }: UsersContentProps) {
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<User | null>(null)
  const [tempBanning, setTempBanning] = useState<User | null>(null)
  const [confirmMassDelete, setConfirmMassDelete] = useState(false)
  const [confirmMassBan, setConfirmMassBan] = useState(false)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const columns: ColumnDef<User>[] = [
    { accessorKey: "ID", header: "ID" },
    { accessorKey: "Username", header: "Username", cell: ({ getValue }) => (
      <span className="whitespace-nowrap truncate max-w-[120px] block">{getValue() as string}</span>
    ) },
    { accessorKey: "Email", header: "Email", cell: ({ getValue }) => (
      <span className="whitespace-nowrap truncate max-w-[180px] block">{getValue() as string}</span>
    ) },
    { accessorKey: "Role", header: "Role" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2 whitespace-nowrap">
          <Button variant="outline" size="sm" onClick={() => setEditingUser(row.original)}>
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => setTempBanning(row.original)}>
            Temp ban
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleting(row.original)}>
            Delete
          </Button>
        </div>
      ),
    },
  ]

  const handleCreate = async (data: UserFormData) => {
    await axios.post("/api/users", data)
    setCreating(false)
    onRefresh()
  }

  const handleUpdate = async (data: UserFormData) => {
    if (!editingUser) return
    await axios.put(`/api/users/${editingUser.ID}`, data)
    setEditingUser(null)
    onRefresh()
  }

  const handleDelete = async () => {
    if (!deleting) return
    await axios.delete(`/api/users/${deleting.ID}`)
    setDeleting(null)
    onRefresh()
  }

  const doDeleteSelected = async () => {
    const ids = Object.keys(rowSelection).map((key) => users[parseInt(key, 10)].ID)
    await Promise.all(ids.map((id) => axios.delete(`/api/users/${id}`)))
    setRowSelection({})
    onRefresh()
    setConfirmMassDelete(false)
  }

  const doTempBanSelected = async () => {
    // TODO: implement temporary ban endpoint
    setRowSelection({})
    setConfirmMassBan(false)
  }

  const doTempBanUser = async () => {
    if (!tempBanning) return
    // TODO: implement temporary ban endpoint
    setTempBanning(null)
  }

  return (
    <>
      <Head>
        <title>pwnthemall - admin zone</title>
      </Head>
      <div className="bg-muted min-h-screen p-4">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Users</h1>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmMassBan(true)}
                disabled
              >
                Temp ban
              </Button>
            </div>
            <Sheet open={creating} onOpenChange={setCreating}>
              <SheetTrigger asChild>
                <Button size="sm">New user</Button>
              </SheetTrigger>
              <SheetContent side="right" onOpenAutoFocus={(e) => e.preventDefault()}>
                <SheetHeader>
                  <SheetTitle>Create user</SheetTitle>
                </SheetHeader>
                <UserForm onSubmit={handleCreate} />
              </SheetContent>
            </Sheet>
          </div>
        </div>
        <DataTable
          columns={columns}
          data={users}
          enableRowSelection
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
        />
      </div>
      <Sheet open={!!editingUser} onOpenChange={(o) => !o && setEditingUser(null)}>
        <SheetContent side="right" onOpenAutoFocus={(e) => e.preventDefault()}>
          <SheetHeader>
            <SheetTitle>Edit user</SheetTitle>
          </SheetHeader>
          {editingUser && (
            <UserForm
              isEdit
              initialData={{ Username: editingUser.Username, Email: editingUser.Email , Role: editingUser.Role}}
              onSubmit={handleUpdate}
            />
          )}
        </SheetContent>
      </Sheet>
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleting?.Username}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!tempBanning} onOpenChange={(o) => !o && setTempBanning(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Temp ban user</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to temporarily ban {tempBanning?.Username}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doTempBanUser}>Temp ban</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={confirmMassDelete} onOpenChange={setConfirmMassDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete users</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the selected users?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDeleteSelected}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={confirmMassBan} onOpenChange={setConfirmMassBan}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Temp ban users</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to temporarily ban the selected users?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doTempBanSelected}>Temp ban</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

