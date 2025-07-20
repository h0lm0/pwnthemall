"use client"

import Link from "next/link"
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  LogOut,
  Sun,
  Moon,
  Globe,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { useTheme } from "next-themes"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/context/AuthContext"
import { useLanguage } from '@/context/LanguageContext'

export function NavUser({
  user,
  onLogout,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
  onLogout: () => void
}) {
  const { isMobile } = useSidebar()
  const { setTheme } = useTheme()
  const { loggedIn } = useAuth()
  const { t, language, setLanguage } = useLanguage();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <AlertDialog>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback delayMs={600} className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                {loggedIn && user.email && (
                  <span className="truncate text-xs">{user.email}</span>
                )}
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback delayMs={600} className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  {loggedIn && user.email && (
                    <span className="truncate text-xs">{user.email}</span>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {loggedIn && (
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2">
                    <BadgeCheck />
                    Profile
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={() => setTheme("latte")}> <Sun /> Light</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setTheme("slate")}> <Moon /> Dark</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {/* Language Switcher */}
              <DropdownMenuItem onSelect={() => setLanguage("en")} className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>English</span>
                {language === "en" && <span className="ml-auto text-xs">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setLanguage("fr")} className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>Français</span>
                {language === "fr" && <span className="ml-auto text-xs">✓</span>}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {loggedIn && (
              <AlertDialogTrigger asChild>
                <DropdownMenuItem>
                  <LogOut />
                  {t('logout')}
                </DropdownMenuItem>
              </AlertDialogTrigger>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('logout_confirm_title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('logout_confirm_message')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={onLogout}>{t('logout')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
        </AlertDialog>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
