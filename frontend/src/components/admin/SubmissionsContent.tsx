import Head from "next/head"
import { useState, useMemo } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { useLanguage } from "@/context/LanguageContext"
import { useSiteConfig } from "@/context/SiteConfigContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"

interface Submission {
  id: number
  value: string
  createdAt: string
  user?: { 
    id: number
    username: string
    team?: {
      id: number
      name: string
    }
  }
  challenge?: { id: number; name: string }
}

interface SubmissionsContentProps {
  submissions: Submission[]
  onRefresh: () => void
}

export default function SubmissionsContent({ submissions, onRefresh }: SubmissionsContentProps) {
  const { t } = useLanguage()
  const { getSiteName } = useSiteConfig()
  const [userFilter, setUserFilter] = useState("")
  const [teamFilter, setTeamFilter] = useState("")
  const [challengeFilter, setChallengeFilter] = useState("")

  // Filter submissions based on user, team, and challenge
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((submission) => {
      const userMatch = !userFilter || 
        submission.user?.username?.toLowerCase().includes(userFilter.toLowerCase())
      
      const teamMatch = !teamFilter || 
        submission.user?.team?.name?.toLowerCase().includes(teamFilter.toLowerCase())
      
      const challengeMatch = !challengeFilter || 
        submission.challenge?.name?.toLowerCase().includes(challengeFilter.toLowerCase())
      
      return userMatch && teamMatch && challengeMatch
    })
  }, [submissions, userFilter, teamFilter, challengeFilter])

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
      accessorKey: "user.team.name",
      header: t("team") || "Team",
      cell: ({ row }) => (
        <span className="block min-w-[120px] truncate">
          {row.original.user?.team?.name || "-"}
        </span>
      ),
    },
    {
      accessorKey: "challenge.name",
      header: t("challenge.challenge") || t("challenge") || "Challenge",
      cell: ({ row }) => (
        <span className="block min-w-[150px] truncate">
          {row.original.challenge?.name || "-"}
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
      cell: ({ getValue }) => {
        const date = new Date(getValue() as string)
        return (
          <span className="block min-w-[150px]">
            {date.toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit'
            })} {date.toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            })}
          </span>
        )
      },
    },
  ]

  const hasActiveFilters = userFilter || teamFilter || challengeFilter

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

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-2 items-end bg-card p-4 rounded-lg border">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-1 block">
              {t("username") || "User"}
            </label>
            <div className="relative">
              <Input
                placeholder={t("search_users") || "Filter by user..."}
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="pr-8 bg-background"
              />
              {userFilter && (
                <button
                  onClick={() => setUserFilter("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-1 block">
              {t("team") || "Team"}
            </label>
            <div className="relative">
              <Input
                placeholder={t("search_teams") || "Filter by team..."}
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

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-1 block">
              {t("challenge.challenge") || "Challenge"}
            </label>
            <div className="relative">
              <Input
                placeholder={t("search_challenges") || "Filter by challenge..."}
                value={challengeFilter}
                onChange={(e) => setChallengeFilter(e.target.value)}
                className="pr-8 bg-background"
              />
              {challengeFilter && (
                <button
                  onClick={() => setChallengeFilter("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setUserFilter("")
                setTeamFilter("")
                setChallengeFilter("")
              }}
              className="mb-0.5"
            >
              {t("clear") || "Clear"} {t("all") || "All"}
            </Button>
          )}
        </div>

        <div className="mb-2 text-sm text-muted-foreground">
          {t("showing") || "Showing"} {filteredSubmissions.length} {t("of") || "of"} {submissions.length} {t("admin.submissions")?.toLowerCase() || "submissions"}
        </div>

        <DataTable columns={columns} data={filteredSubmissions} enablePagination={true} defaultPageSize={25} />
      </div>
    </>
  )
}
