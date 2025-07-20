"use client";

import * as React from "react";
import { Home, Swords, LogIn, UserPlus, User, List, ShieldUser } from "lucide-react";
import { useRouter } from "next/router";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import axios from "axios";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useChallengeCategories } from "@/hooks/use-challenge-categories";
import type { NavItem } from "@/models/NavItem";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { loggedIn, logout, authChecked } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const { isMobile } = useSidebar();
  const { categories, loading } = useChallengeCategories(loggedIn);

  const [userData, setUserData] = React.useState({
    name: "",
    email: "",
    avatar: "/logo-no-text.png",
    role: "",
  });

  React.useEffect(() => {
    if (!authChecked) return;

    if (loggedIn) {
      axios
        .get("/api/me")
        .then((res) => {
          const { username, email, role } = res.data;
          setUserData({
            name: username,
            email,
            avatar: "/logo-no-text.png",
            role,
          });
        })
        .catch(() => {});
    } else {
      setUserData({ name: "Guest", email: "", avatar: "/logo-no-text.png", role: "" });
    }
  }, [loggedIn, authChecked]);

  const navItems = React.useMemo(() => {
    if (!authChecked) return [];
    const items: NavItem[] = [];
    let pwnSubItems;
    if (loading) {
      pwnSubItems = [{ title: t('loading'), url: "#" }];
    } else if (categories.length === 0) {
      pwnSubItems = [{ title: t('no_categories'), url: "#" }];
    } else {
      pwnSubItems = categories.map((cat) => ({
        title: cat.Name,
        url: `/pwn/${cat.Name}`,
      }));
    }
    if (loggedIn) {
      items.push({
        title: t('pwn'),
        url: "/pwn",
        icon: Swords,
        isActive: router.pathname.startsWith("/pwn"),
        items: pwnSubItems,
      });
      items.push({
        title: t('scoreboard'),
        url: "/scoreboard",
        icon: List,
        isActive: router.pathname === "/scoreboard",
      });
      if (userData.role === "admin") {
        items.push({
          title: t('administration'),
          url: "/admin",
          icon: ShieldUser,
          items: [
            { title: t('dashboard'), url: "/admin/dashboard" },
            { title: t('users'), url: "/admin/users" },
            { title: t('challenge_categories'), url: "/admin/challenge-categories" },
          ],
          isActive:
            router.pathname === "/admin/dashboard" ||
            router.pathname === "/admin/users" ||
            router.pathname === "/admin/challenge-categories",
        });
      }
    } else {
      items.push({
        title: t('login'),
        url: "/login",
        icon: LogIn,
        isActive: router.pathname === "/login",
      });
      items.push({
        title: t('register'),
        url: "/register",
        icon: UserPlus,
        isActive: router.pathname === "/register",
      });
    }
    return items;
  }, [authChecked, loggedIn, router.pathname, userData.role, categories, loading, t]);

  return (
    <Sidebar
      collapsible="icon"
      className={cn(!authChecked && "invisible pointer-events-none")}
      {...props}
    >
      <SidebarHeader>
        <TeamSwitcher
          teams={[{ name: "pwnthemall", logo: Home, plan: "CTF" }]}
        />
      </SidebarHeader>
      {authChecked && (
        <>
          <SidebarContent>
            <NavMain items={navItems} />
          </SidebarContent>
          <SidebarFooter>
            <NavUser user={userData} onLogout={logout} />
          </SidebarFooter>
        </>
      )}
      {!isMobile && <SidebarRail />}
    </Sidebar>
  );
}
