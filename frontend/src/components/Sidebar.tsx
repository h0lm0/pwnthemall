import Link from "next/link";
import Switch from "./Switch";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useState, useEffect } from "react";

const Sidebar = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const router = useRouter();
  const { loggedIn, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [showSwitch, setShowSwitch] = useState(!collapsed);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed');
      if (saved) {
        setCollapsed(saved === 'true');
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
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', collapsed.toString());
    }
  }, [collapsed]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div
      className={`relative h-screen flex flex-col border-r transition-all ${
        darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'
      } ${collapsed ? 'w-0 overflow-visible' : 'w-56'}`}
    >
      {!collapsed && (
        <>
          <div className="flex items-center justify-between px-4 py-4">
            <Link
              href="/"
              className={`${darkMode ? 'text-white' : 'text-black'} font-bold text-xl tracking-wide`}
            >
              pwnthemall
            </Link>
            <button
              onClick={() => setCollapsed(true)}
              className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} focus:outline-none`}
            >
              {'<'}
            </button>
          </div>
          <nav className="flex flex-col flex-grow space-y-2 px-4">
            {loggedIn && (
              <Link
                href="/pwn"
                className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} hover:text-cyan-400 transition flex items-center justify-center h-8`}
              >
                Pwn
              </Link>
            )}
            {loggedIn ? (
              <button
                onClick={handleLogout}
                className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} hover:text-cyan-400 transition text-left flex items-center justify-center h-8`}
              >
                Logout
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} hover:text-cyan-400 transition flex items-center justify-center h-8`}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} hover:text-cyan-400 transition flex items-center justify-center h-8`}
                >
                  Register
                </Link>
              </>
            )}
          </nav>
          <div className="px-4 py-4">
            {showSwitch && (
              <Switch isOn={darkMode} handleToggle={toggleDarkMode} />
            )}
          </div>
        </>
      )}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className={`absolute top-4 left-0 px-2 py-1 rounded-r shadow ${
            darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-600'
          }`}
        >
          {'>'}
        </button>
      )}
    </div>
  );
};

export default Sidebar;
