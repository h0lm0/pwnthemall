import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import UsersContent from "@/components/admin/UsersContent";



export default function UsersPage() {
  const router = useRouter();
  const { loggedIn, checkAuth, authChecked } = useAuth();
  const [role, setRole] = useState("");
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (authChecked && loggedIn) {
      axios
        .get("/api/me")
        .then((res) => setRole(res.data.role))
        .catch(() => setRole(""));
    }
  }, [authChecked, loggedIn]);

  useEffect(() => {
    if (!authChecked) return;
    if (!loggedIn) {
      router.replace("/login");
    } else if (role && role !== "admin") {
      router.replace("/pwn");
    } else if (role === "admin") {
      axios
        .get<User[]>("/api/users")
        .then((res) => setUsers(res.data))
        .catch(() => setUsers([]));
    }
  }, [authChecked, loggedIn, role, router]);

  if (!authChecked) return null;
  if (!loggedIn || role !== "admin") return null;

  return (
    <UsersContent
      users={users}
    />
  )
}
