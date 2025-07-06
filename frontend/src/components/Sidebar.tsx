import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useState, useEffect } from "react";
import { ModeToggle } from "@/components/ModeToggle";
import {
  Home,
  Swords,
  LogIn,
  LogOut,
  UserPlus,
  Menu,
  ChevronLeft,
} from "lucide-react";

const Sidebar = () => {
  const { darkMode } = useTheme();
  const router = useRouter();
  const { loggedIn, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [showSwitch, setShowSwitch] = useState(!collapsed);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebarCollapsed");
      if (saved) {
        setCollapsed(saved === "true");
      }
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!collapsed) {
      timer = setTimeout(() => setShowSwitch(true), 250);
    } else {
      setShowSwitch(false);
    }
    return () => clearTimeout(timer);
  }, [collapsed]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebarCollapsed", collapsed.toString());
    }
  }, [collapsed]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const linkClasses = `${darkMode ? "text-gray-300" : "text-gray-600"} hover:text-cyan-400 transition flex items-center space-x-2 h-10 px-2`;

  return (
    <div
      className={`relative h-screen flex flex-col border-r transition-all duration-300 ease-in-out ${
        darkMode ? "bg-black border-gray-800" : "bg-white border-gray-200"
      } ${collapsed ? "w-16" : "w-56"}`}
    >
      <div className="flex items-center justify-between px-4 py-4">
        {!collapsed && (
          <Link
            href="/"
            className={`${
              darkMode ? "text-white" : "text-black"
            } font-bold text-xl tracking-wide`}
          >
            pwnthemall
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`${
            darkMode ? "text-gray-300" : "text-gray-600"
          } focus:outline-none`}
        >
          {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
      <nav className="flex flex-col flex-grow space-y-1 px-2">
        <Link href="/" className={linkClasses}>
          <Home size={20} />
          {!collapsed && <span>Home</span>}
        </Link>
        {loggedIn && (
          <Link href="/pwn" className={linkClasses}>
            <Swords size={20} />
            {!collapsed && <span>Pwn</span>}
          </Link>
        )}
        {loggedIn ? (
          <button onClick={handleLogout} className={linkClasses}>
            <LogOut size={20} />
            {!collapsed && <span>Logout</span>}
          </button>
        ) : (
          <>
            <Link href="/login" className={linkClasses}>
              <LogIn size={20} />
              {!collapsed && <span>Login</span>}
            </Link>
            <Link href="/register" className={linkClasses}>
              <UserPlus size={20} />
              {!collapsed && <span>Register</span>}
            </Link>
          </>
        )}
      </nav>
      <div className="px-4 py-4 mt-auto">
        {showSwitch && <ModeToggle />}
      </div>
    </div>
  );
};

export default Sidebar;
