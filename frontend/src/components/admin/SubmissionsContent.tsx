import Head from "next/head"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { useLanguage } from "@/context/LanguageContext"
import { useSiteConfig } from "@/context/SiteConfigContext"
import { Button } from "@/components/ui/button"

interface Submission {
  id: number
  value: string
  createdAt: string
  user?: { id: number; username: string }
  challenge?: { id: number; label: string }
}

interface SubmissionsContentProps {
  submissions: Submission[]
  onRefresh: () => void
}

export default function SubmissionsContent({ submissions, onRefresh }: SubmissionsContentProps) {
  const { t } = useLanguage()
  const { getSiteName } = useSiteConfig()

  const columns: ColumnDef<Submission>[] = [
    {
      accessorKey: "id",
      header: t("id") || "ID",
      cell: ({ getValue }) => (
        <span className="block text-center w-10 min-w-[40px] font-mono">
          {getValue() as number}
        </span>
      ),
      size: 40,
    },
    {
      accessorKey: "user.username",
      header: t("username") || "User",
      cell: ({ row }) => (
        <span className="block min-w-[120px] truncate">
          {row.original.user?.username || "-"}
        </span>
      ),
    },
    {
      accessorKey: "challenge.label",
      header: t("challenge.challenge") || t("challenge") || "Challenge",
      cell: ({ row }) => (
        <span className="block min-w-[150px] truncate">
          {row.original.challenge?.label || "-"}
        </span>
      ),
    },
    {
      accessorKey: "value",
      header: t("value") || "Value",
      cell: ({ getValue }) => (
        <span className="block min-w-[200px] font-mono truncate max-w-[300px]">
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: t("time") || "Time",
      cell: ({ getValue }) => (
        <span className="block min-w-[150px]">
          {new Date(getValue() as string).toLocaleString()}
        </span>
      ),
    },
  ]

  return (
    <>
      <Head>
        <title>{getSiteName()}</title>
      </Head>
      <div className="bg-muted min-h-screen p-4">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t("admin.submissions") || "Submissions"}</h1>
          <div>
            <Button size="sm" onClick={onRefresh}>{t("refresh") || "Refresh"}</Button>
          </div>
        </div>

        <DataTable columns={columns} data={submissions} />
      </div>
    </>
  )
}
