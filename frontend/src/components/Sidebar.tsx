import Link from "next/link"
import { useRouter } from "next/router"
import { useAuth } from "@/context/AuthContext"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import {
  Home,
  Swords,
  LogIn,
  UserPlus,
  User,
  Menu,
  ChevronLeft,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Separator } from "@/components/ui/separator"

const Sidebar = () => {
  const router = useRouter()
  const { loggedIn, logout } = useAuth()
  const { setTheme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebarCollapsed")
      if (saved) {
        setCollapsed(saved === "true")
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebarCollapsed", collapsed.toString())
    }
  }, [collapsed])

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  const linkClasses =
    "flex items-center gap-2 h-10 px-3 rounded-md text-sm hover:bg-accent hover:text-accent-foreground"

  return (
    <div
      className={`bg-background border-r flex flex-col h-screen transition-all duration-300 ${collapsed ? "w-16" : "w-56"}`}
    >
      <div className="flex items-center justify-between h-16 px-4">
        {!collapsed && (
          <Link href="/" className="font-bold text-xl">
            pwnthemall
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <Menu className="size-5" /> : <ChevronLeft className="size-5" />}
        </Button>
      </div>
      <nav className="flex-1 px-2 space-y-1">
        <Link href="/" className={linkClasses}>
          <Home className="size-5" />
          {!collapsed && <span>Home</span>}
        </Link>
        {loggedIn && (
          <Link href="/pwn" className={linkClasses}>
            <Swords className="size-5" />
            {!collapsed && <span>Pwn</span>}
          </Link>
        )}
        {!loggedIn && (
          <>
            <Link href="/login" className={linkClasses}>
              <LogIn className="size-5" />
              {!collapsed && <span>Login</span>}
            </Link>
            <Link href="/register" className={linkClasses}>
              <UserPlus className="size-5" />
              {!collapsed && <span>Register</span>}
            </Link>
          </>
        )}
      </nav>
      <div className="mt-auto p-2">
        <AlertDialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/logo-no-text.png" alt="avatar" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                {!collapsed && <span className="ml-2">Profile</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
            {loggedIn && (
              <DropdownMenuItem asChild>
                <Link href="/profile" className="w-full">Profile</Link>
              </DropdownMenuItem>
            )}
            {loggedIn && (
              <AlertDialogTrigger asChild>
                <DropdownMenuItem>Logout</DropdownMenuItem>
              </AlertDialogTrigger>
            )}
            {!loggedIn && (
              <DropdownMenuItem asChild>
                <Link href="/login">Login</Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to log out?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You will need to sign in again to continue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Log out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

export default Sidebar
