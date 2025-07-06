import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import PwnContent from "../components/PwnContent";

const PwnPage = () => {
  const { darkMode } = useTheme();
  const router = useRouter();
  const { loggedIn, checkAuth } = useAuth();

  useEffect(() => {
    const verify = () => {
      checkAuth();
      if (!loggedIn) {
        router.replace("/login");
      }
    };
    verify()
  }, [router, loggedIn]);
  if (loggedIn){
    return <PwnContent darkMode={darkMode} />;
  }
};

export default PwnPage;
