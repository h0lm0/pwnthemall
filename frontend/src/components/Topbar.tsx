// src/components/Topbar.tsx
import Link from "next/link";
import Switch from "./Switch";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const Topbar = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const router = useRouter();
  const { loggedIn, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <nav
      className={`border-b px-6 py-4 flex justify-between items-center ${darkMode ? "bg-black border-gray-800" : "bg-white border-gray-200"}`}
    >
      <Link
        href="/"
        className={`${darkMode ? "text-white" : "text-black"} font-bold text-xl tracking-wide`}
      >
        pwnthemall
      </Link>
      <div className="flex items-center space-x-4">
        {loggedIn && (
          <Link
            href="/pwn"
            className={`${darkMode ? "text-gray-300" : "text-gray-600"} hover:text-cyan-400 transition`}
          >
            Pwn
          </Link>
        )}
        {loggedIn ? (
          <button
            onClick={handleLogout}
            className={`${darkMode ? "text-gray-300" : "text-gray-600"} hover:text-cyan-400 transition`}
          >
            Logout
          </button>
        ) : (
          <>
            <Link
              href="/login"
              className={`${darkMode ? "text-gray-300" : "text-gray-600"} hover:text-cyan-400 transition`}
            >
              Login
            </Link>
            <Link
              href="/register"
              className={`${darkMode ? "text-gray-300" : "text-gray-600"} hover:text-cyan-400 transition`}
            >
              Register
            </Link>
          </>
        )}
        <Switch isOn={darkMode} handleToggle={toggleDarkMode} />
      </div>
    </nav>
  );
};

export default Topbar;
