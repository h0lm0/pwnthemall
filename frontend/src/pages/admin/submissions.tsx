import { useEffect, useState } from "react"
import axios from "@/lib/axios"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import SubmissionsContent from "@/components/admin/SubmissionsContent"

type Submission = {
  id: number
  value: string
  createdAt: string
  user?: { id: number; username: string }
  challenge?: { id: number; label: string }
}

export default function SubmissionsPage() {
  const { loading, isAdmin } = useAdminAuth()
  const [submissions, setSubmissions] = useState<Submission[]>([])

  const fetchSubmissions = () => {
    axios
      .get<Submission[]>('/api/admin/submissions')
      .then((res) => setSubmissions(res.data))
      .catch(() => setSubmissions([]))
  }

  useEffect(() => {
    if (isAdmin) fetchSubmissions()
  }, [isAdmin])

  if (loading || !isAdmin) return null

  return (
    <SubmissionsContent
      submissions={submissions}
      onRefresh={fetchSubmissions}
    />
  )
}
