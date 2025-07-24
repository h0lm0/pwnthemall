import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import ConfigContent from "@/components/admin/ConfigContent";
import { Config } from "@/models/Config";

export default function ConfigPage() {
    const router = useRouter();
    const { loggedIn, checkAuth, authChecked } = useAuth();
    const [role, setRole] = useState("");
    const [users, setUsers] = useState<Config[]>([])
    
    const fetchUsers = () => {
        axios
        .get<Config[]>("/api/config")
        .then((res) => setUsers(res.data))
        .catch(() => setUsers([]))
    }

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
        <ConfigContent />
    );
}
