import { useEffect } from "react"
import { useRouter } from "next/router"
import { useAuth } from "@/context/AuthContext"

export default function ProfilePage() {
  const router = useRouter()
  const { loggedIn, checkAuth, authChecked } = useAuth()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (authChecked && !loggedIn) {
      router.replace("/login")
    }
  }, [authChecked, loggedIn, router])

  if (!authChecked) return null
  if (!loggedIn) return null

  return (
    <div className="bg-muted flex min-h-screen items-center justify-center">
      <h1 className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
        Profile page
      </h1>
    </div>
  )
}
