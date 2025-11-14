import Head from "next/head"
import { useEffect, useState, useMemo } from "react"
import axios from "@/lib/axios";

import { ColumnDef, RowSelectionState } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
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
import { useSiteConfig } from "@/context/SiteConfigContext"
import { toast } from "sonner"

interface UsersContentProps {
  users: User[]
  onRefresh: () => void
}

export default function UsersContent({ users, onRefresh }: UsersContentProps) {
  const { t, isLoaded, language } = useLanguage()
  const { getSiteName } = useSiteConfig()
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<User | null>(null)
  const [tempBanning, setTempBanning] = useState<User | null>(null)
  const [confirmMassDelete, setConfirmMassDelete] = useState(false)
  const [confirmMassBan, setConfirmMassBan] = useState(false)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [createError, setCreateError] = useState<string | null>(null)
  
  // Filter states
  const [usernameFilter, setUsernameFilter] = useState("")
  const [emailFilter, setEmailFilter] = useState("")
  const [teamFilter, setTeamFilter] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("") // "banned" | "active" | ""

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const usernameMatch = !usernameFilter || 
        user.username?.toLowerCase().includes(usernameFilter.toLowerCase())
      
      const emailMatch = !emailFilter || 
        user.email?.toLowerCase().includes(emailFilter.toLowerCase())
      
      const teamMatch = !teamFilter || 
        user.team?.name?.toLowerCase().includes(teamFilter.toLowerCase())
      
      const roleMatch = !roleFilter || 
        user.role?.toLowerCase() === roleFilter.toLowerCase()
      
      const statusMatch = !statusFilter || 
        (statusFilter === "banned" && user.banned) || 
        (statusFilter === "active" && !user.banned)
      
      return usernameMatch && emailMatch && teamMatch && roleMatch && statusMatch
    })
  }, [users, usernameFilter, emailFilter, teamFilter, roleFilter, statusFilter])

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "id",
      header: t("id"),
      cell: ({ getValue }) => (
        <span className="block text-center w-10 min-w-[40px]">
          {getValue() as string}
        </span>
      ),
      size: 40,
    },
    {
      accessorKey: "username",
      header: t("username"),
      cell: ({ getValue }) => (
        <span className="block min-w-[120px] truncate">
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: "email",
      header: t("email"),
      cell: ({ getValue }) => (
        <span className="block min-w-[150px] truncate">
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: "team",
      header: t("team"),
      cell: ({ row }) => {
        const team = row.original.team;
        return (
          <span className="block min-w-[100px] truncate">
            {team ? team.name : "N/A"}
          </span>
        );
      },
    },
    {
      accessorKey: "ipAddresses",
      header: "IP Addresses",
      cell: ({ row }) => {
        const ipAddresses = row.original.ipAddresses;
        if (!ipAddresses || ipAddresses.length === 0) {
          return <span className="text-muted-foreground">-</span>;
        }
        
        const displayIPs = ipAddresses.slice(0, 2); // Show first 2 IPs
        const remainingCount = ipAddresses.length - displayIPs.length;
        
        return (
          <div className="min-w-[120px]">
            <div className="flex flex-wrap gap-1">
              {displayIPs.map((ip, index) => (
                <span 
                  key={index}
                  className="inline-block px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-md font-mono"
                  title={ip}
                >
                  {ip}
                </span>
              ))}
              {remainingCount > 0 && (
                <span 
                  className="inline-block px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-md font-mono"
                  title={`${remainingCount} more IP${remainingCount > 1 ? 's' : ''}: ${ipAddresses.slice(2).join(', ')}`}
                >
                  +{remainingCount}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: t("role"),
      cell: ({ getValue }) => (
        <span className="block min-w-[80px]">
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: "banned",
      header: t("banned"),
      cell: ({ getValue }) => {
        const isBanned = getValue() as boolean
        return (
          <span className={cn("font-semibold min-w-[60px] block", isBanned ? "text-red-600" : "text-green-600")}>
            {isBanned ? t("yes") : t("no")}
          </span>
        )
      },
    },
    {
      id: "actions",
      header: t("actions"),
      cell: ({ row }) => (
        <div className="flex gap-1 flex-wrap">
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
            {row.original.banned ? t("unban") : t("temp_ban")}
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
      let msg = err?.response?.data?.error || "Failed to create user";
      
      // Wait for translations to load before processing
      if (!isLoaded) {
        setCreateError("Failed to create user.");
        return;
      }
      
      // Map backend error messages to user-friendly messages using locale keys
      if (msg.match(/validation.*Password.*min/)) {
        msg = t('password_too_short') || "Password must be at least 8 characters.";
      } else if (msg.match(/validation.*Password.*max/)) {
        msg = t('password_length') || "Password must be between 8 and 72 characters.";
      } else if (msg.match(/validation.*Username.*max/)) {
        msg = t('username_length') || "Username must be at most 32 characters.";
      } else if (msg.match(/validation.*Email.*max/)) {
        msg = t('email_length') || "Email must be at most 254 characters.";
      } else if (msg.match(/validation.*Email.*email/)) {
        msg = t('invalid_email') || "Invalid email address.";
      } else if (msg.includes("duplicate key") && msg.includes("username")) {
        msg = t('username_exists') || "Username already exists.";
      } else if (msg.includes("duplicate key") && msg.includes("email")) {
        msg = t('email_exists') || "Email already exists.";
      } else if (msg.includes("unique constraint failed") && msg.toLowerCase().includes("username")) {
        msg = t('username_exists') || "Username already exists.";
      } else if (msg.includes("unique constraint failed") && msg.toLowerCase().includes("email")) {
        msg = t('email_exists') || "Email already exists.";
      } else if (msg.includes("SQLSTATE 23505") && msg.includes("uni_users_username")) {
        msg = t('username_exists') || "Username already exists.";
      } else if (msg.includes("SQLSTATE 23505") && msg.includes("uni_users_email")) {
        msg = t('email_exists') || "Email already exists.";
      } else {
        msg = t('user_create_failed') || "Failed to create user.";
      }
      
      
      setCreateError(msg)
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
    const ids = Object.keys(rowSelection).map((key) => filteredUsers[parseInt(key, 10)].id)
    await Promise.all(ids.map((id) => axios.delete(`/api/users/${id}`)))
    setRowSelection({})
    setConfirmMassDelete(false)
    toast.success(t("users_deleted_success"))
    onRefresh()
  }

  const doTempBanSelected = async () => {
    const selectedUsers = Object.keys(rowSelection).map((key) => filteredUsers[parseInt(key, 10)])
    const ids = selectedUsers.map(user => user.id)
    const bannedCount = selectedUsers.filter(user => user.banned).length
    const unbannedCount = selectedUsers.length - bannedCount
    const isMostlyUnbanning = bannedCount > unbannedCount
    
    try {
      await Promise.all(ids.map((id) => axios.post(`/api/users/${id}/ban`)))
      setRowSelection({})
      setConfirmMassBan(false)
      toast.success(isMostlyUnbanning ? t("users_unbanned_success") : t("users_banned_success"))
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
      const successMessage = tempBanning.banned ? t("user_unbanned_success") : t("user_banned_success")
      setTempBanning(null)
      toast.success(successMessage)
      onRefresh()
    } catch (err: any) {
      console.error("Failed to ban/unban user:", err)
      setTempBanning(null)
    }
  }

  return (
    <>
      <Head>
        <title>{getSiteName()}</title>
      </Head>
      <div className="bg-muted min-h-screen p-4">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t("users")}</h1>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={onRefresh}>{t("refresh")}</Button>
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
                {(() => {
                  const selectedUsers = Object.keys(rowSelection).map((key) => filteredUsers[parseInt(key, 10)])
                  const bannedCount = selectedUsers.filter(user => user.banned).length
                  const unbannedCount = selectedUsers.length - bannedCount
                  return bannedCount > unbannedCount ? t("unban_users") : t("temp_ban_users")
                })()}
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
                <UserForm onSubmit={handleCreate} apiError={createError} />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-2 items-end bg-card p-4 rounded-lg border">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-1 block">
              {t("username") || "Username"}
            </label>
            <div className="relative">
              <Input
                placeholder={t("filter_by_user") || "Filter by user..."}
                value={usernameFilter}
                onChange={(e) => setUsernameFilter(e.target.value)}
                className="pr-8 bg-background"
              />
              {usernameFilter && (
                <button
                  onClick={() => setUsernameFilter("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-1 block">
              {t("email") || "Email"}
            </label>
            <div className="relative">
              <Input
                placeholder={t("filter_by_user") || "Filter by email..."}
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
                className="pr-8 bg-background"
              />
              {emailFilter && (
                <button
                  onClick={() => setEmailFilter("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-[180px]">
            <label className="text-sm font-medium mb-1 block">
              {t("team") || "Team"}
            </label>
            <div className="relative">
              <Input
                placeholder={t("filter_by_team") || "Filter by team..."}
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="pr-8 bg-background"
              />
              {teamFilter && (
                <button
                  onClick={() => setTeamFilter("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-[160px]">
            <label className="text-sm font-medium mb-1 block">
              {t("role") || "Role"}
            </label>
            <div className="relative">
              <Input
                placeholder={t("filter_by_role") || "Filter by role..."}
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="pr-8 bg-background"
              />
              {roleFilter && (
                <button
                  onClick={() => setRoleFilter("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-[160px]">
            <label className="text-sm font-medium mb-1 block">
              {t("status") || "Status"}
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">{t("all") || "All"}</option>
                <option value="active">{t("active") || "Active"}</option>
                <option value="banned">{t("banned") || "Banned"}</option>
              </select>
            </div>
          </div>

          {(usernameFilter || emailFilter || teamFilter || roleFilter || statusFilter) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setUsernameFilter("")
                setEmailFilter("")
                setTeamFilter("")
                setRoleFilter("")
                setStatusFilter("")
              }}
              className="mb-0.5"
            >
              {t("clear") || "Clear"} {t("all") || "All"}
            </Button>
          )}
        </div>

        <div className="mb-2 text-sm text-muted-foreground">
          {t("showing") || "Showing"} {filteredUsers.length} {t("of") || "of"} {users.length} {t("users")?.toLowerCase() || "users"}
        </div>

        <DataTable
          columns={columns}
          data={filteredUsers}
          enableRowSelection
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          enablePagination={true}
          defaultPageSize={25}
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
              {t("delete_user_confirm", { username: deleting?.username || "" }) || `Are you sure you want to delete ${deleting?.username}?`}
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

      {/* Temp Ban/Unban Dialog */}
      <AlertDialog open={!!tempBanning} onOpenChange={(o) => !o && setTempBanning(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {tempBanning?.banned ? t("unban_user") : t("temp_ban_user")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {tempBanning?.banned 
                ? t("unban_user_confirm", { username: tempBanning?.username || "" })
                : t("temp_ban_user_confirm", { username: tempBanning?.username || "" })
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={doTempBanUser}>
              {tempBanning?.banned ? t("unban") : t("temp_ban")}
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

      {/* Confirm Mass Temp Ban/Unban */}
      <AlertDialog open={confirmMassBan} onOpenChange={setConfirmMassBan}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {(() => {
                const selectedUsers = Object.keys(rowSelection).map((key) => filteredUsers[parseInt(key, 10)])
                const bannedCount = selectedUsers.filter(user => user.banned).length
                const unbannedCount = selectedUsers.length - bannedCount
                return bannedCount > unbannedCount ? t("unban_users") : t("temp_ban_users")
              })()}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const selectedUsers = Object.keys(rowSelection).map((key) => filteredUsers[parseInt(key, 10)])
                const bannedCount = selectedUsers.filter(user => user.banned).length
                const unbannedCount = selectedUsers.length - bannedCount
                return bannedCount > unbannedCount ? t("unban_users_confirm") : t("temp_ban_users_confirm")
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={doTempBanSelected}>
              {(() => {
                const selectedUsers = Object.keys(rowSelection).map((key) => filteredUsers[parseInt(key, 10)])
                const bannedCount = selectedUsers.filter(user => user.banned).length
                const unbannedCount = selectedUsers.length - bannedCount
                return bannedCount > unbannedCount ? t("unban") : t("temp_ban")
              })()}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
