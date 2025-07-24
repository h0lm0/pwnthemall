import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import DashboardContent from "@/components/admin/DashboardContent";

export default function AdminPage() {
    const router = useRouter();
    const { loggedIn, checkAuth, authChecked } = useAuth();
    const [role, setRole] = useState("");

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
        }
    }, [authChecked, loggedIn, role, router]);

    if (!authChecked) return null;
    if (!loggedIn || role !== "admin") return null;

    return (
        <DashboardContent />
    );
}
