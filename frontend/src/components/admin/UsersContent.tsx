import Head from "next/head"
import { useEffect, useState } from "react"
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
import { useLanguage } from "@/context/LanguageContext"
import { toast } from "sonner"

interface UsersContentProps {
  users: User[]
  onRefresh: () => void
}

export default function UsersContent({ users, onRefresh }: UsersContentProps) {
  const { t } = useLanguage()
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<User | null>(null)
  const [tempBanning, setTempBanning] = useState<User | null>(null)
  const [confirmMassDelete, setConfirmMassDelete] = useState(false)
  const [confirmMassBan, setConfirmMassBan] = useState(false)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [createError, setCreateError] = useState<string | null>(null)

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "id",
      header: t("id"),
      cell: ({ getValue }) => (
        <span className="block text-center w-10 min-w-[40px] max-w-[40px]">
          {getValue() as string}
        </span>
      ),
      size: 40,
    },
    {
      accessorKey: "username",
      header: t("username"),
      cell: ({ getValue }) => (
        <span className="block min-w-[150px] max-w-[250px] truncate">
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: "email",
      header: t("email"),
      cell: ({ getValue }) => (
        <span className="block min-w-[200px] max-w-[300px] truncate">
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: "role",
      header: t("role"),
    },
    {
      accessorKey: "banned",
      header: t("banned"),
      cell: ({ getValue }) => {
        const isBanned = getValue() as boolean
        return (
          <span className={cn("font-semibold", isBanned ? "text-red-600" : "text-green-600")}>
            {isBanned ? t("yes") : t("no")}
          </span>
        )
      },
    },
    {
      id: "actions",
      header: t("actions"),
      cell: ({ row }) => (
        <div className="flex gap-2 whitespace-nowrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingUser(row.original)}
          >
            {t("edit")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTempBanning(row.original)}
          >
            {t("temp_ban")}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleting(row.original)}
          >
            {t("delete")}
          </Button>
        </div>
      ),
    },
  ]

  const handleCreate = async (data: UserFormData) => {
    setCreateError(null)
    try {
      await axios.post("/api/users", data)
      setCreating(false)
      toast.success(t("user_created_success"))
      onRefresh()
    } catch (err: any) {
      setCreateError(err?.response?.data?.error || "Failed to create user")
    }
  }

  const handleUpdate = async (data: UserFormData) => {
    if (!editingUser) return
    await axios.put(`/api/users/${editingUser.id}`, data)
    setEditingUser(null)
    toast.success(t("user_updated_success"))
    onRefresh()
  }

  const handleDelete = async () => {
    if (!deleting) return
    await axios.delete(`/api/users/${deleting.id}`)
    setDeleting(null)
    toast.success(t("user_deleted_success"))
    onRefresh()
  }

  const doDeleteSelected = async () => {
    const ids = Object.keys(rowSelection).map((key) => users[parseInt(key, 10)].id)
    await Promise.all(ids.map((id) => axios.delete(`/api/users/${id}`)))
    setRowSelection({})
    setConfirmMassDelete(false)
    toast.success(t("users_deleted_success"))
    onRefresh()
  }

  const doTempBanSelected = async () => {
    const ids = Object.keys(rowSelection).map((key) => users[parseInt(key, 10)].id)
    try {
      await Promise.all(ids.map((id) => axios.post(`/api/users/${id}/ban`)))
      setRowSelection({})
      setConfirmMassBan(false)
      toast.success(t("users_banned_success"))
      onRefresh()
    } catch (err: any) {
      console.error("Failed to mass ban/unban users:", err)
      setRowSelection({})
      setConfirmMassBan(false)
    }
  }

  const doTempBanUser = async () => {
    if (!tempBanning) return
    try {
      await axios.post(`/api/users/${tempBanning.id}/ban`)
      setTempBanning(null)
      toast.success(t("user_banned_success"))
      onRefresh()
    } catch (err: any) {
      console.error("Failed to ban/unban user:", err)
      setTempBanning(null)
    }
  }

  return (
    <>
      <Head>
        <title>pwnthemall - admin zone</title>
      </Head>
      <div className="bg-muted min-h-screen p-4 overflow-x-auto">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t("users")}</h1>
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
                {t("delete_selected")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmMassBan(true)}
              >
                {t("temp_ban")}
              </Button>
            </div>
            <Sheet open={creating} onOpenChange={setCreating}>
              <SheetTrigger asChild>
                <Button size="sm">{t("new_user")}</Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <SheetHeader>
                  <SheetTitle>{t("create_user")}</SheetTitle>
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

      {/* Edit Sheet */}
      <Sheet open={!!editingUser} onOpenChange={(o) => !o && setEditingUser(null)}>
        <SheetContent side="right" onOpenAutoFocus={(e) => e.preventDefault()}>
          <SheetHeader>
            <SheetTitle>{t("edit_user")}</SheetTitle>
          </SheetHeader>
          {editingUser && (
            <UserForm
              isEdit
              initialData={{
                username: editingUser.username,
                email: editingUser.email,
                role: editingUser.role,
              }}
              onSubmit={handleUpdate}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete_user")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("delete_user_confirm", { username: deleting?.username || "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Temp Ban Dialog */}
      <AlertDialog open={!!tempBanning} onOpenChange={(o) => !o && setTempBanning(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("temp_ban_user")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("temp_ban_user_confirm", { username: tempBanning?.username || "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={doTempBanUser}>
              {t("temp_ban")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Mass Delete */}
      <AlertDialog open={confirmMassDelete} onOpenChange={setConfirmMassDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete_users")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("delete_users_confirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={doDeleteSelected}>
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Mass Temp Ban */}
      <AlertDialog open={confirmMassBan} onOpenChange={setConfirmMassBan}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("temp_ban_users")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("temp_ban_users_confirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={doTempBanSelected}>
              {t("temp_ban")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
