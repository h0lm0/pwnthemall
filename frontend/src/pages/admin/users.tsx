import { useEffect, useState } from "react"
import axios from "@/lib/axios";
import { useAdminAuth } from "@/hooks/use-admin-auth"
import UsersContent from "@/components/admin/UsersContent"
import { User } from "@/models"

export default function UsersPage() {
  const { loading, isAdmin } = useAdminAuth();
  const [users, setUsers] = useState<User[]>([])

  const fetchUsers = () => {
    axios
      .get<User[]>("/api/users")
      .then((res) => setUsers(res.data))
      .catch(() => setUsers([]))
  }

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    }
  }, [isAdmin]);

  if (loading || !isAdmin) return null;

  return (
    <UsersContent
      users={users}
      onRefresh={fetchUsers}
    />
  )
}
